import { NextRequest, NextResponse } from 'next/server';
import { getSoundCloudClientId } from '@/lib/api/soundcloud';

interface Transcoding {
  url: string;
  format: { protocol: 'progressive' | 'hls'; mime_type: string };
}

interface SoundCloudTrackDetail {
  media: { transcodings: Transcoding[] };
}

interface SignedStreamResponse {
  url: string;
}

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get('trackId');
  if (!trackId) {
    return NextResponse.json({ error: 'Query parameter "trackId" is required.' }, { status: 400 });
  }

  try {
    const clientId = await getSoundCloudClientId();

    const trackResponse = await fetch(
      `https://api-v2.soundcloud.com/tracks/${trackId}?client_id=${clientId}`,
      { headers: DEFAULT_HEADERS, cache: 'no-store' }
    );
    if (!trackResponse.ok) {
      throw new Error(`SoundCloud track lookup failed: ${trackResponse.status}`);
    }
    const track = (await trackResponse.json()) as SoundCloudTrackDetail;

    const progressive = track.media.transcodings.find(
      (t) => t.format.protocol === 'progressive'
    );
    const transcoding = progressive ?? track.media.transcodings[0];
    if (!transcoding) {
      throw new Error('Track has no available transcodings.');
    }

    const signedResponse = await fetch(`${transcoding.url}?client_id=${clientId}`, {
      headers: DEFAULT_HEADERS,
      cache: 'no-store',
    });
    if (!signedResponse.ok) {
      throw new Error(`SoundCloud stream signing failed: ${signedResponse.status}`);
    }
    const signed = (await signedResponse.json()) as SignedStreamResponse;

    return NextResponse.json({ streamUrl: signed.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SoundCloud resolve error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
