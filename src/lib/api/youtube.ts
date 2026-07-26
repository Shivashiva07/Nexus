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

function extractYouTubeVideoId(input: string): string | null {
  const match = input.match(/(?:youtube\.com\/(?:watch\?.*v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export function extractYouTubePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) return listMatch[1];
  if (/^(?:PL|OLAK5uy_|FL|LL|RD)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export async function searchYouTube(query: string, limit = 50): Promise<Track[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured.');
  }

  // 1. Direct YouTube Link Detection
  const directVideoId = extractYouTubeVideoId(query);
  if (directVideoId) {
    const videosParams = new URLSearchParams({
      part: 'snippet,contentDetails',
      id: directVideoId,
      key: apiKey,
    });
    const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`, {
      cache: 'no-store',
    });
    if (videosResponse.ok) {
      const videosData = (await videosResponse.json()) as { items: YouTubeVideoItem[] };
      if (videosData.items && videosData.items.length > 0) {
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
    }
  }

  // 2. Standard Search Query
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

export async function fetchYouTubePlaylist(input: string): Promise<{
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
}> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY is not configured.');
  }

  const playlistId = extractYouTubePlaylistId(input);
  if (!playlistId) {
    throw new Error('Invalid YouTube playlist URL or ID.');
  }

  // 1. Fetch Playlist Metadata
  const playlistParams = new URLSearchParams({
    part: 'snippet',
    id: playlistId,
    key: apiKey,
  });

  const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?${playlistParams.toString()}`, {
    cache: 'no-store',
  });

  let playlistTitle = 'YouTube Playlist';
  let playlistDescription = '';

  if (playlistRes.ok) {
    const playlistData = await playlistRes.json();
    if (playlistData.items && playlistData.items.length > 0) {
      playlistTitle = playlistData.items[0].snippet.title || playlistTitle;
      playlistDescription = playlistData.items[0].snippet.description || '';
    }
  }

  // 2. Fetch Playlist Items (up to 50 items)
  const itemsParams = new URLSearchParams({
    part: 'snippet,contentDetails',
    playlistId: playlistId,
    maxResults: '50',
    key: apiKey,
  });

  const itemsRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${itemsParams.toString()}`, {
    cache: 'no-store',
  });

  if (!itemsRes.ok) {
    const errData = await itemsRes.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Failed to fetch YouTube playlist (status ${itemsRes.status})`);
  }

  const itemsData = await itemsRes.json();
  const rawItems = itemsData.items || [];

  const videoIds: string[] = [];
  const rawTracks: Array<{
    id: string;
    videoId: string;
    title: string;
    artist: string;
    artwork: string;
  }> = [];

  for (const item of rawItems) {
    const videoId = item.snippet?.resourceId?.videoId || item.contentDetails?.videoId;
    if (!videoId) continue;
    videoIds.push(videoId);
    rawTracks.push({
      id: `youtube:${videoId}`,
      videoId,
      title: item.snippet?.title || 'Untitled Track',
      artist: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || 'YouTube',
      artwork:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        '',
    });
  }

  if (videoIds.length === 0) {
    return {
      id: playlistId,
      name: playlistTitle,
      description: playlistDescription,
      tracks: [],
    };
  }

  // 3. Fetch video details for exact durations
  const durationMap = new Map<string, number>();
  const videosParams = new URLSearchParams({
    part: 'contentDetails',
    id: videoIds.join(','),
    key: apiKey,
  });

  const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videosParams.toString()}`, {
    cache: 'no-store',
  });

  if (videosRes.ok) {
    const videosData = await videosRes.json();
    for (const v of videosData.items || []) {
      if (v.id && v.contentDetails?.duration) {
        durationMap.set(v.id, parseIso8601Duration(v.contentDetails.duration));
      }
    }
  }

  const tracks: Track[] = rawTracks.map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.artist,
    artwork: t.artwork,
    duration: durationMap.get(t.videoId) || 0,
    source: 'youtube' as const,
    externalId: t.videoId,
  }));

  return {
    id: playlistId,
    name: playlistTitle,
    description: playlistDescription,
    tracks,
  };
}
