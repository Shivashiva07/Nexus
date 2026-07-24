import type { Track } from '@/store/usePlayerStore';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

async function getClientCredentialsToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET are not configured.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.accessToken;
}

interface SpotifyTrackItem {
  id: string;
  uri: string;
  name: string;
  duration_ms: number;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
}

function mapSpotifyItemsToTracks(items: SpotifyTrackItem[]): Track[] {
  return items.map((item) => ({
    id: `spotify:${item.id}`,
    title: item.name,
    artist: item.artists.map((a) => a.name).join(', '),
    artwork: item.album.images[0]?.url ?? '',
    duration: Math.round(item.duration_ms / 1000),
    source: 'spotify' as const,
    externalId: item.uri,
    embedUrl: `https://open.spotify.com/embed/track/${item.id}?utm_source=generator&theme=0`,
  }));
}

async function fetchSpotifyPage(query: string, token: string, limit: number, offset: number): Promise<SpotifyTrackItem[]> {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: String(limit),
    offset: String(offset),
  });
  const response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Spotify search failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = (await response.json()) as { tracks: { items: SpotifyTrackItem[] } };
  return data.tracks?.items ?? [];
}

function extractSpotifyTrackId(input: string): string | null {
  const match = input.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]{22})/);
  return match ? match[1] : null;
}

export async function searchSpotify(query: string, userToken?: string | null, targetLimit = 50): Promise<Track[]> {
  // Direct Spotify Link Lookup
  const directTrackId = extractSpotifyTrackId(query);
  if (directTrackId) {
    try {
      let token = userToken;
      if (!token) token = await getClientCredentialsToken();
      const res = await fetch(`https://api.spotify.com/v1/tracks/${directTrackId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const item = (await res.json()) as SpotifyTrackItem;
        return mapSpotifyItemsToTracks([item]);
      }
    } catch {
      // Fall through to regular search
    }
  }

  const chunkSize = 10;
  const numRequests = Math.ceil(Math.min(targetLimit, 50) / chunkSize);
  const offsets = Array.from({ length: numRequests }, (_, i) => i * chunkSize);

  // 1. Try user token first if provided
  if (userToken) {
    try {
      const results = await Promise.all(
        offsets.map((offset) => fetchSpotifyPage(query, userToken, chunkSize, offset))
      );
      const allItems = results.flat();
      if (allItems.length > 0) {
        return mapSpotifyItemsToTracks(allItems.slice(0, targetLimit));
      }
    } catch {
      // Ignore user token error and fall back to client credentials
    }
  }

  // 2. Fall back to Client Credentials token
  let clientToken = await getClientCredentialsToken();
  try {
    const results = await Promise.all(
      offsets.map((offset) => fetchSpotifyPage(query, clientToken, chunkSize, offset))
    );
    return mapSpotifyItemsToTracks(results.flat().slice(0, targetLimit));
  } catch {
    // If client credentials token failed or expired (e.g. 401), force refresh token and retry once
    cachedToken = null;
    clientToken = await getClientCredentialsToken();
    const results = await Promise.all(
      offsets.map((offset) => fetchSpotifyPage(query, clientToken, chunkSize, offset))
    );
    return mapSpotifyItemsToTracks(results.flat().slice(0, targetLimit));
  }
}

