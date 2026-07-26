import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubePlaylist } from '@/lib/api/youtube';

export async function GET(request: NextRequest) {
  const urlOrId = request.nextUrl.searchParams.get('list')?.trim();
  if (!urlOrId) {
    return NextResponse.json({ error: 'Query parameter "list" or YouTube playlist URL/ID is required.' }, { status: 400 });
  }

  try {
    const playlist = await fetchYouTubePlaylist(urlOrId);
    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import YouTube playlist' },
      { status: 500 }
    );
  }
}
