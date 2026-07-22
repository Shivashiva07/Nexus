'use client';

import Image from 'next/image';
import { usePlayerStore, type MusicSource, type Track } from '@/store/usePlayerStore';
import { formatTime } from '@/lib/formatTime';

const SOURCE_STYLES: Record<MusicSource, { label: string; dot: string; badge: string }> = {
  spotify:    { label: 'Spotify',    dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  youtube:    { label: 'YouTube',    dot: 'bg-red-400',     badge: 'bg-red-500/10 text-red-400 border-red-500/20' },
  soundcloud: { label: 'SoundCloud', dot: 'bg-orange-400',  badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  vsnectar:   { label: 'VS Nectar',  dot: 'bg-amber-400',   badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
};

function HeartIcon({ isFilled = false }: { isFilled?: boolean }) {
  if (isFilled) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 8v8M8 12h8" />
    </svg>
  );
}

function TrashSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

function QueueAddIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 13h-2v-1.5h2V10h1.5v1.5H15V13h-1.5v1.5H12V13zM1 2.5h14V4H1V2.5zm0 5.5h14V9.5H1V8zm0 5.5h7.5V15H1v-1.5z"/>
    </svg>
  );
}

interface TrackRowProps {
  track: Track;
  isActive?: boolean;
  isLoading?: boolean;
  onPlay: () => void;
  index?: number;
  isCollapsed?: boolean;
  onAddToPlaylist?: () => void;       // show + icon → opens playlist picker
  onRemoveFromPlaylist?: () => void;  // show trash icon → remove from current playlist
}

export function TrackRow({ track, isActive, isLoading, onPlay, index, isCollapsed, onAddToPlaylist, onRemoveFromPlaylist }: TrackRowProps) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const library = usePlayerStore((s) => s.library);
  const toggleLibraryTrack = usePlayerStore((s) => s.toggleLibraryTrack);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  
  const isSaved = library.some((t) => t.id === track.id);
  const displayDuration = (isActive && currentTrack?.id === track.id && currentTrack.duration > 0)
    ? currentTrack.duration
    : track.duration;

  const sourceStyle = SOURCE_STYLES[track.source] ?? {
    label: track.source,
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };

  if (isCollapsed) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={isLoading ? undefined : onPlay}
        title={`${track.title} • ${track.artist}`}
        className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 mx-auto
          hover:bg-white/[0.1] active:bg-white/[0.15]
          ${isLoading ? 'cursor-wait opacity-50' : 'cursor-pointer'}
          ${isActive ? 'bg-white/[0.1] border border-violet-500/40 ring-1 ring-violet-500/20' : 'border border-transparent'}`}
      >
        <div className="relative h-9 w-9 overflow-hidden rounded-lg bg-white/[0.05]">
          {track.artwork ? (
            <Image src={track.artwork} alt={track.title} fill sizes="36px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white/20">
              {track.source === 'vsnectar' ? 'VS' : track.source.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-[1px]">
            <div className="flex items-end gap-[2px] h-3">
              <span className="wave-bar w-[2px] rounded-full bg-violet-400" style={{ height: '3px' }} />
              <span className="wave-bar w-[2px] rounded-full bg-violet-400" style={{ height: '8px' }} />
              <span className="wave-bar w-[2px] rounded-full bg-violet-400" style={{ height: '5px' }} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={isLoading ? undefined : onPlay}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150
        hover:bg-white/[0.06] active:bg-white/[0.09]
        ${isLoading ? 'cursor-wait opacity-50' : 'cursor-pointer'}
        ${isActive
          ? 'bg-white/[0.07] border border-violet-500/20'
          : 'border border-transparent'
        }`}
    >
      {/* Index / Play indicator */}
      <div className="w-5 shrink-0 flex items-center justify-center">
        {isActive ? (
          /* Animated wave bars */
          <div className="flex items-end gap-[2px] h-4">
            <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '4px' }} />
            <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '10px' }} />
            <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '7px' }} />
            <span className="wave-bar w-[3px] rounded-full bg-violet-400" style={{ height: '3px' }} />
          </div>
        ) : (
          <span className="text-[11px] tabular-nums text-white/20 group-hover:hidden font-mono">
            {index !== undefined ? index + 1 : ''}
          </span>
        )}
        {!isActive && (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="hidden h-3 w-3 text-white/50 group-hover:block translate-x-0.5"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      {/* Artwork */}
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/[0.05]">
        {track.artwork ? (
          <Image src={track.artwork} alt={track.title} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-bold text-white/20">
            {track.source === 'vsnectar' ? 'VS' : track.source.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Title + artist */}
      <div className="min-w-0 flex-1">
        <p className={`truncate text-[13px] font-medium leading-tight ${isActive ? 'text-violet-300' : 'text-white/85'}`}>
          {track.title}
        </p>
        <p className="truncate text-[11px] text-white/35 mt-0.5">{track.artist}</p>
      </div>

      {/* Source badge */}
      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${sourceStyle.badge}`}>
        {sourceStyle.label}
      </span>

      {/* Actions & Duration */}
      <div className="flex shrink-0 items-center justify-end gap-1.5">
        {/* Add to queue */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(track);
          }}
          className="p-1 text-white/20 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all"
          title="Add to queue"
          aria-label="Add to queue"
        >
          <QueueAddIcon />
        </button>

        {/* Add to playlist (+) */}
        {onAddToPlaylist && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToPlaylist(); }}
            className="p-1 text-white/20 hover:text-violet-400 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Add to playlist"
          >
            <PlusCircleIcon />
          </button>
        )}
        {/* Heart — liked songs */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleLibraryTrack(track);
          }}
          className={`p-1 transition-all ${isSaved ? 'text-violet-500 hover:text-violet-400 opacity-100' : 'text-white/20 hover:text-violet-400 opacity-0 group-hover:opacity-100'}`}
          aria-label={isSaved ? 'Remove from Liked Songs' : 'Add to Liked Songs'}
        >
          <HeartIcon isFilled={isSaved} />
        </button>
        {/* Remove from current playlist */}
        {onRemoveFromPlaylist && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemoveFromPlaylist(); }}
            className="p-1 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Remove from playlist"
          >
            <TrashSmallIcon />
          </button>
        )}
        <span className="w-9 text-right text-[11px] tabular-nums text-white/25 font-mono ml-1">
          {isLoading ? '…' : formatTime(displayDuration)}
        </span>
      </div>
    </div>
  );
}
