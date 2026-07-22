import type { Track } from '@/store/usePlayerStore';

interface SoundCloudTrackItem {
  id: number;
  title: string;
  duration: number; // milliseconds
  artwork_url: string | null;
  user: { username: string; avatar_url: string };
}

interface SoundCloudSearchResponse {
  collection: SoundCloudTrackItem[];
}

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

let cachedClientId: string | null = null;

export async function getSoundCloudClientId(): Promise<string> {
  if (process.env.SOUNDCLOUD_CLIENT_ID) {
    return process.env.SOUNDCLOUD_CLIENT_ID;
  }
  if (cachedClientId) {
    return cachedClientId;
  }

  try {
    const htmlRes = await fetch('https://soundcloud.com', { headers: DEFAULT_HEADERS, cache: 'no-store' });
    const html = await htmlRes.text();
    const scriptUrls = html.match(/https?:\/\/[^\s"'`<>]+?\.js/g) || [];

    for (const scriptUrl of scriptUrls.reverse()) {
      try {
        const res = await fetch(scriptUrl, { headers: DEFAULT_HEADERS, cache: 'no-store' });
        const js = await res.text();
        const matches = js.match(/client_id[:=]["']([a-zA-Z0-9]{32})["']/g) || js.match(/client_id=([a-zA-Z0-9]{32})/g);
        if (matches && matches.length > 0) {
          const match = matches[0].match(/([a-zA-Z0-9]{32})/);
          if (match) {
            cachedClientId = match[1];
            return cachedClientId;
          }
        }
      } catch {
        // Continue to next script
      }
    }
  } catch {
    // Ignore fetch errors
  }

  throw new Error('Could not obtain a valid SoundCloud Client ID.');
}

export async function searchSoundCloud(query: string, limit = 10): Promise<Track[]> {
  const clientId = await getSoundCloudClientId();

  const params = new URLSearchParams({
    q: query,
    client_id: clientId,
    limit: String(limit),
  });

  const response = await fetch(`https://api-v2.soundcloud.com/search/tracks?${params.toString()}`, {
    headers: DEFAULT_HEADERS,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`SoundCloud search failed: ${response.status}`);
  }

  const data = (await response.json()) as SoundCloudSearchResponse;

  return data.collection.map((item) => ({
    id: `soundcloud:${item.id}`,
    title: item.title,
    artist: item.user.username,
    artwork: item.artwork_url ?? item.user.avatar_url ?? '',
    duration: Math.round(item.duration / 1000),
    source: 'soundcloud' as const,
    externalId: String(item.id),
  }));
}
