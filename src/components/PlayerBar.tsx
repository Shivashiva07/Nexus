'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { formatTime } from '@/lib/formatTime';

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 translate-x-0.5 text-black">
      <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/>
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-black">
      <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"/>
    </svg>
  );
}

function SkipBackIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.576a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"/>
    </svg>
  );
}

function SkipForwardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.106A.7.7 0 0 0 1 1.712v12.576a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"/>
    </svg>
  );
}

function PlusCircleIcon({ isSaved }: { isSaved?: boolean }) {
  if (isSaved) {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-[#1db954]">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.78 6.28-4.25 4.25a.75.75 0 0 1-1.06 0L4.22 8.28a.75.75 0 0 1 1.06-1.06L7 8.94l3.72-3.72a.75.75 0 1 1 1.06 1.06z"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-[#b3b3b3] hover:text-white transition-colors">
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8.75-4.25v3.5h3.5v1.5h-3.5v3.5h-1.5v-3.5h-3.5v-1.5h3.5v-3.5h1.5z"/>
    </svg>
  );
}

function VolumeIcon({ volume }: { volume: number }) {
  if (volume === 0) {
    return (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
        <path d="M13.86 5.47a.75.75 0 0 0-1.061 0l-1.3 1.3-1.3-1.3a.75.75 0 0 0-1.061 1.06l1.3 1.3-1.3 1.3a.75.75 0 0 0 1.06 1.061l1.3-1.3 1.3 1.3a.75.75 0 0 0 1.061-1.06l-1.3-1.3 1.3-1.3a.75.75 0 0 0 0-1.06zM9.716 1.58A.75.75 0 0 0 8.5 2.1v11.8a.75.75 0 0 0 1.216.52l4-3.5A.75.75 0 0 0 14 10.35V5.65a.75.75 0 0 0-.284-.57l-4-3.5zM1 5v6h3.5l4 3.5V1.5L4.5 5H1z"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M9.716 1.58A.75.75 0 0 0 8.5 2.1v11.8a.75.75 0 0 0 1.216.52l4-3.5A.75.75 0 0 0 14 10.35V5.65a.75.75 0 0 0-.284-.57l-4-3.5zM1 5v6h3.5l4 3.5V1.5L4.5 5H1z"/>
      <path d="M11.5 8c0-1.284-.566-2.434-1.464-3.218a.75.75 0 0 0-.972 1.14c.594.516.936 1.264.936 2.078 0 .814-.342 1.562-.936 2.078a.75.75 0 1 0 .972 1.14A4.246 4.246 0 0 0 11.5 8z"/>
    </svg>
  );
}

function QueueIcon({ isActive }: { isActive?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={`h-4 w-4 ${isActive ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'} transition-colors`}>
      <path d="M15 15H1V13.5H15V15ZM15 9.5H1V8H15V9.5ZM15 4H1V2.5H15V4Z"/>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlayerBar() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleLibraryTrack = usePlayerStore((s) => s.toggleLibraryTrack);
  const library = usePlayerStore((s) => s.library);
  const isQueueOpen = usePlayerStore((s) => s.isQueueOpen);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const seekRangeRef = useRef<HTMLInputElement>(null);
  const volRangeRef = useRef<HTMLInputElement>(null);

  const duration = currentTrack?.duration ?? 0;
  const canGoPrevious = queueIndex > 0;
  const canGoNext = queueIndex < queue.length - 1;
  const isSaved = currentTrack ? library.some(t => t.id === currentTrack.id) : false;

  useEffect(() => {
    if (seekRangeRef.current) {
      const pct = duration > 0 ? (Math.min(currentTime, duration) / duration) * 100 : 0;
      seekRangeRef.current.style.setProperty('--seek-pct', `${pct}%`);
    }
  }, [currentTime, duration]);

  useEffect(() => {
    if (volRangeRef.current) {
      volRangeRef.current.style.setProperty('--vol-pct', `${volume * 100}%`);
    }
  }, [volume]);

  return (
    <footer className="relative z-30 h-[72px] shrink-0 border-t border-[#282828] bg-[#000000] px-4">
      <div className="flex h-full items-center justify-between">

        {/* ── Left: Track Info (Now Playing) ────────────────── */}
        <div className="flex w-[30%] min-w-[180px] items-center gap-3">
          <div className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded bg-[#282828]">
            {currentTrack?.artwork ? (
              <Image src={currentTrack.artwork} alt={currentTrack.title} fill sizes="56px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#a7a7a7]">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 min-w-0 max-w-full">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white leading-snug hover:underline cursor-pointer">
                {currentTrack?.title ?? 'Nothing playing'}
              </p>
              <p className="truncate text-xs text-[#a7a7a7] mt-0.5 hover:underline cursor-pointer">
                {currentTrack?.artist ?? '—'}
              </p>
            </div>

            {/* Plus/Save button */}
            <button
              type="button"
              onClick={() => currentTrack && toggleLibraryTrack(currentTrack)}
              disabled={!currentTrack}
              className="shrink-0 p-1 hover:scale-110 active:scale-95 transition-all disabled:opacity-30"
              aria-label="Save to Library"
            >
              <PlusCircleIcon isSaved={isSaved} />
            </button>
          </div>
        </div>

        {/* ── Center: Controls + Progress ───────────────────── */}
        <div className="flex w-[40%] max-w-[722px] flex-col items-center gap-1.5">
          {/* Controls row */}
          <div className="flex items-center gap-4">
            {/* Skip back */}
            <button
              type="button"
              onClick={previous}
              disabled={!canGoPrevious}
              className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1"
              aria-label="Previous track"
            >
              <SkipBackIcon />
            </button>

            {/* Play/Pause — Solid White Circle */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={!currentTrack}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black shadow transition-transform hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Skip forward */}
            <button
              type="button"
              onClick={next}
              disabled={!canGoNext}
              className="text-[#b3b3b3] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed p-1"
              aria-label="Next track"
            >
              <SkipForwardIcon />
            </button>
          </div>

          {/* Seek progress bar */}
          <div className="group/range flex w-full items-center gap-2">
            <span className="w-9 text-right text-[11px] tabular-nums text-[#a7a7a7] font-normal">
              {formatTime(currentTime)}
            </span>
            <input
              ref={seekRangeRef}
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => seek(Number(e.target.value))}
              disabled={!currentTrack}
              className="h-1 flex-1 seek-range disabled:cursor-not-allowed"
              aria-label="Seek"
            />
            <span className="w-9 text-left text-[11px] tabular-nums text-[#a7a7a7] font-normal">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ── Right: Controls & Volume ───────────────────────── */}
        <div className="flex w-[30%] min-w-[180px] items-center justify-end gap-3 text-[#b3b3b3]">
          {/* Queue toggle button */}
          <button
            type="button"
            onClick={toggleQueue}
            className={`p-1.5 rounded transition-all hover:scale-105 active:scale-95 ${
              isQueueOpen ? 'text-[#1db954] bg-white/10' : 'text-[#b3b3b3] hover:text-white'
            }`}
            title="Queue"
            aria-label="Queue"
          >
            <QueueIcon isActive={isQueueOpen} />
          </button>

          {/* Volume container */}
          <div className="group/range flex items-center gap-2">
            <span className="hover:text-white transition-colors cursor-pointer">
              <VolumeIcon volume={volume} />
            </span>
            <input
              ref={volRangeRef}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 w-24 vol-range"
              aria-label="Volume"
            />
          </div>
        </div>

      </div>
    </footer>
  );
}
