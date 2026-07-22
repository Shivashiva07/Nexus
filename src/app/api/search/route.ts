import { NextRequest, NextResponse } from 'next/server';
import { searchSpotify } from '@/lib/api/spotify';
import { searchYouTube } from '@/lib/api/youtube';
import { searchSoundCloud } from '@/lib/api/soundcloud';
import { searchVSNectar } from '@/lib/api/vsnectar';
import type { AggregatedSearchResult } from '@/lib/api/types';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization');
  const userToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  const [spotifyResult, youtubeResult, soundcloudResult, vsnectarResult] = await Promise.allSettled([
    searchSpotify(query, userToken),
    searchYouTube(query),
    searchSoundCloud(query),
    searchVSNectar(query),
  ]);


  const result: AggregatedSearchResult = {
    spotify: spotifyResult.status === 'fulfilled' ? spotifyResult.value : [],
    youtube: youtubeResult.status === 'fulfilled' ? youtubeResult.value : [],
    soundcloud: soundcloudResult.status === 'fulfilled' ? soundcloudResult.value : [],
    vsnectar: vsnectarResult.status === 'fulfilled' ? vsnectarResult.value : [],
    errors: {},
  };

  if (spotifyResult.status === 'rejected') {
    result.errors.spotify = spotifyResult.reason?.message ?? 'Unknown Spotify error';
  }
  if (youtubeResult.status === 'rejected') {
    result.errors.youtube = youtubeResult.reason?.message ?? 'Unknown YouTube error';
  }
  if (soundcloudResult.status === 'rejected') {
    result.errors.soundcloud = soundcloudResult.reason?.message ?? 'Unknown SoundCloud error';
  }
  if (vsnectarResult.status === 'rejected') {
    result.errors.vsnectar = vsnectarResult.reason?.message ?? 'Unknown VS Nectar error';
  }

  return NextResponse.json(result);
}
