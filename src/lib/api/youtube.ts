import type { Track } from '@/store/usePlayerStore';

interface YouTubeSearchItem {
  id: { videoId: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { high?: { url: string }; medium?: { url: string }; default?: { url: string } };
  };
  contentDetails: { duration: string };
}

/** Parses an ISO 8601 duration (e.g. "PT4M13S") into whole seconds. */
function parseIso8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const [, hours, minutes, seconds] = match;
  return (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60 + (Number(seconds) || 0);
}

export async function searchYouTube(query: string, limit = 10): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured.');
  }

  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoCategoryId: '10', // Music
    videoEmbeddable: 'true', // Filter to videos that allow embedding
    maxResults: String(limit),
    key: apiKey,
  });

  const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`, {
    cache: 'no-store',
  });
  if (!searchResponse.ok) {
    throw new Error(`YouTube search failed: ${searchResponse.status}`);
  }
  const searchData = (await searchResponse.json()) as { items: YouTubeSearchItem[] };
  const videoIds = searchData.items.map((item) => item.id.videoId).filter(Boolean);
  if (videoIds.length === 0) return [];

  const videosParams = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: videoIds.join(','),
    key: apiKey,
  });
  const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`, {
    cache: 'no-store',
  });
  if (!videosResponse.ok) {
    throw new Error(`YouTube video lookup failed: ${videosResponse.status}`);
  }
  const videosData = (await videosResponse.json()) as { items: YouTubeVideoItem[] };

  return videosData.items.map((item) => ({
    id: `youtube:${item.id}`,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    artwork:
      item.snippet.thumbnails.high?.url ??
      item.snippet.thumbnails.medium?.url ??
      item.snippet.thumbnails.default?.url ??
      '',
    duration: parseIso8601Duration(item.contentDetails.duration),
    source: 'youtube' as const,
    externalId: item.id,
  }));
}
