'use client';

import Image from 'next/image';
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

const SOURCE_COLORS: Record<string, { glow: string; label: string; dot: string }> = {
  spotify:    { glow: 'shadow-emerald-900/40', label: 'Spotify',    dot: 'bg-emerald-400' },
  youtube:    { glow: 'shadow-red-900/40',     label: 'YouTube',    dot: 'bg-red-400' },
  soundcloud: { glow: 'shadow-orange-900/40',  label: 'SoundCloud', dot: 'bg-orange-400' },
  vsnectar:   { glow: 'shadow-amber-900/40',   label: 'VS Nectar',  dot: 'bg-amber-400' },
};

/**
 * The Adaptive Compliance Sandbox. Every provider's native playback surface is
 * anchored here so their SDKs/embeds stay mounted regardless of which track is
 * active — swapping surfaces per-source instead would violate the YouTube and
 * Spotify embed terms of service around visible-player requirements.
 */
export function DynamicMediaDock() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isSpotifyPremium = usePlayerStore((s) => s.isSpotifyPremium);

  useYouTubePlayer(YT_DOCK_CONTAINER_ID);
  useNativeAudio(audioRef);
  useSpotifyPlayer();

  const isYouTubeActive = currentTrack?.source === 'youtube';
  const isSpotifyActive = currentTrack?.source === 'spotify';
  const embedSrc = currentTrack && isSpotifyActive ? spotifyEmbedSrc(currentTrack) : null;
  const sourceInfo = currentTrack ? SOURCE_COLORS[currentTrack.source] : null;

  return (
    <div className="fixed bottom-24 right-5 z-40 w-80 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0f0f18]/90 shadow-2xl shadow-black/60 backdrop-blur-xl">
      {/* Glow accent at top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          {/* Animated playback dot */}
          <span
            className={`h-1.5 w-1.5 rounded-full transition-all ${
              isPlaying && sourceInfo ? `${sourceInfo.dot} shadow-sm` : 'bg-white/20'
            }`}
            style={isPlaying ? { animation: 'glow-pulse 1.4s ease-in-out infinite' } : {}}
          />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
            Media Dock
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-white/20 font-medium">
          {currentTrack?.source ?? 'idle'}
        </span>
      </div>

      {/* YouTube embed */}
      <div className={isYouTubeActive ? 'block' : 'hidden'}>
        <div id={YT_DOCK_CONTAINER_ID} className="h-[180px] w-[320px] bg-black" />
      </div>

      {/* Spotify */}
      {isSpotifyActive && (
        <div className="p-3">
          {isSpotifyPremium ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.04] px-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.05] shadow-lg">
                {currentTrack?.artwork && (
                  <Image src={currentTrack.artwork} alt={currentTrack.title} fill sizes="56px" className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white leading-tight">
                  {currentTrack?.title}
                </p>
                <p className="truncate text-xs text-white/40 mt-0.5">{currentTrack?.artist}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-semibold">
                    Web Playback SDK
                  </p>
                </div>
              </div>
            </div>
          ) : embedSrc ? (
            <iframe
              key={embedSrc}
              src={embedSrc}
              width="100%"
              height="152"
              style={{ borderRadius: '12px' }}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify embed player"
            />
          ) : (
            <p className="rounded-xl bg-white/[0.03] px-3 py-3 text-xs text-white/30">
              No Spotify embed available for this track.
            </p>
          )}
        </div>
      )}

      {/* SoundCloud / VS Nectar / Idle */}
      {!isYouTubeActive && !isSpotifyActive && (
        <div className="p-3">
          {currentTrack ? (
            <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.04] px-3 py-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.05] shadow-lg">
                {currentTrack.artwork ? (
                  <Image src={currentTrack.artwork} alt={currentTrack.title} fill sizes="56px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white/20">
                    {currentTrack.source === 'vsnectar' ? 'VS' : 'SC'}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white leading-tight">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-white/40 mt-0.5">{currentTrack.artist}</p>

                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${sourceInfo?.dot ?? 'bg-white/20'}`} />
                    <span className="text-[9px] uppercase tracking-wider font-semibold text-white/30">
                      {sourceInfo?.label ?? currentTrack.source}
                    </span>
                  </div>

                  {isPlaying && (
                    <div className="flex items-end gap-[2px] h-3.5">
                      <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '4px' }} />
                      <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '10px' }} />
                      <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '7px' }} />
                      <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '3px' }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <div className="h-10 w-10 rounded-full bg-white/[0.04] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white/15">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
              <p className="text-xs text-white/20">Nothing playing</p>
            </div>
          )}
        </div>
      )}

      {/* Hidden native audio element carrying every SoundCloud stream. */}
      <audio ref={audioRef} className="hidden" preload="metadata" />
    </div>
  );
}
