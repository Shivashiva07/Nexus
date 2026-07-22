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

export async function searchSpotify(query: string, userToken?: string | null, limit = 10): Promise<Track[]> {
  let token: string;
  if (userToken) {
    token = userToken;
  } else {
    token = await getClientCredentialsToken();
  }

  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
  let response = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok && userToken) {
    try {
      const fallbackToken = await getClientCredentialsToken();
      const fallbackResponse = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
        headers: { Authorization: `Bearer ${fallbackToken}` },
        cache: 'no-store',
      });
      if (fallbackResponse.ok) {
        response = fallbackResponse;
      }
    } catch {
      // Keep original response error
    }
  }

  if (!response.ok) {
    cachedToken = null;
    const errorText = await response.text().catch(() => '');
    console.error('Spotify Search Error Details:', response.status, errorText);
    throw new Error(`Spotify search failed (${response.status}): ${errorText || response.statusText}`);
  }



  const data = (await response.json()) as { tracks: { items: SpotifyTrackItem[] } };

  return data.tracks.items.map((item) => ({
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

