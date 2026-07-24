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

export async function searchSpotify(query: string, userToken?: string | null, limit = 50): Promise<Track[]> {
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  const url = `https://api.spotify.com/v1/search?${params.toString()}`;

  // 1. Try user token first if provided
  if (userToken) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${userToken}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = (await response.json()) as { tracks: { items: SpotifyTrackItem[] } };
        return mapSpotifyItemsToTracks(data.tracks.items);
      }
    } catch {
      // Ignore user token error and fall back to client credentials
    }
  }

  // 2. Fall back to Client Credentials token
  let clientToken = await getClientCredentialsToken();
  let response = await fetch(url, {
    headers: { Authorization: `Bearer ${clientToken}` },
    cache: 'no-store',
  });

  // If cached client token expired (401), force refresh cached token once
  if (response.status === 401) {
    cachedToken = null;
    clientToken = await getClientCredentialsToken();
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${clientToken}` },
      cache: 'no-store',
    });
  }

  if (!response.ok) {
    cachedToken = null;
    const errorText = await response.text().catch(() => '');
    console.error('Spotify Search Error Details:', response.status, errorText);
    throw new Error(`Spotify search failed (${response.status}): ${errorText || response.statusText}`);
  }

  const data = (await response.json()) as { tracks: { items: SpotifyTrackItem[] } };
  return mapSpotifyItemsToTracks(data.tracks.items);
}

