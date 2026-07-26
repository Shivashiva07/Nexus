import type { AggregatedSearchResult } from './types';

export async function fetchAggregatedSearch(query: string, spotifyAccessToken?: string | null): Promise<AggregatedSearchResult> {
  const headers: Record<string, string> = {};
  if (spotifyAccessToken) {
    headers['Authorization'] = `Bearer ${spotifyAccessToken}`;
  }
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers });
  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }
  return response.json() as Promise<AggregatedSearchResult>;
}

export async function resolveSoundCloudStreamUrl(trackId: string): Promise<string> {
  const response = await fetch(`/api/soundcloud/resolve?trackId=${encodeURIComponent(trackId)}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `SoundCloud resolve failed: ${response.status}`);
  }
  const data = (await response.json()) as { streamUrl: string };
  return data.streamUrl;
}

export async function importYouTubePlaylist(urlOrId: string): Promise<{
  id: string;
  name: string;
  description?: string;
  tracks: import('@/store/usePlayerStore').Track[];
}> {
  const response = await fetch(`/api/youtube/playlist?list=${encodeURIComponent(urlOrId)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error || `Playlist import failed with status ${response.status}`);
  }
  return response.json();
}
