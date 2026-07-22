'use client';

import { useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { useNativeAudio } from '@/hooks/useNativeAudio';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

const YT_DOCK_CONTAINER_ID = 'yt-dock-player';

function spotifyEmbedSrc(track: { embedUrl?: string; externalId?: string }): string | null {
  if (track.embedUrl) return track.embedUrl;
  if (track.externalId) {
    return `https://open.spotify.com/embed/track/${track.externalId}?utm_source=generator&theme=0`;
  }
  return null;
}

/**
 * Non-visual Media Dock Host. Keeps native playback surfaces (YouTube player container,
 * native <audio> element, and Spotify fallback iframe) mounted invisibly in background
 * so media SDKs function without rendering a visible Media Dock card UI.
 */
export function DynamicMediaDock() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isSpotifyActive = currentTrack?.source === 'spotify';
  const embedSrc = currentTrack && isSpotifyActive ? spotifyEmbedSrc(currentTrack) : null;

  useYouTubePlayer(YT_DOCK_CONTAINER_ID);
  useNativeAudio(audioRef);
  useSpotifyPlayer();

  return (
    <div className="sr-only pointer-events-none fixed -bottom-full -right-full opacity-0 aria-hidden">
      {/* YouTube player container */}
      <div id={YT_DOCK_CONTAINER_ID} className="h-1 w-1" />

      {/* Spotify fallback iframe embed */}
      {isSpotifyActive && embedSrc && (
        <iframe
          key={embedSrc}
          src={embedSrc}
          width="1"
          height="1"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title="Spotify embed player"
        />
      )}

      {/* Hidden native audio element for SoundCloud & HTML5 audio streams */}
      <audio ref={audioRef} className="hidden" preload="metadata" />
    </div>
  );
}
