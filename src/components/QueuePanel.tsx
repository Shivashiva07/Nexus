'use client';

import { usePlayerStore } from '@/store/usePlayerStore';

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z" />
    </svg>
  );
}

function PlayingEqualizerIcon() {
  return (
    <span className="flex items-end gap-[2px] h-3 w-3 text-[#1db954]">
      <span className="w-[2px] h-full bg-current animate-[bounce_1s_infinite_100ms]" />
      <span className="w-[2px] h-2/3 bg-current animate-[bounce_1s_infinite_300ms]" />
      <span className="w-[2px] h-4/5 bg-current animate-[bounce_1s_infinite_200ms]" />
    </span>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4 text-white">
      <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.214L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm4.5-.75h7v1.5h-7v-1.5z" />
    </svg>
  );
}

function getProviderBadge(provider: string) {
  switch (provider) {
    case 'spotify':
      return { text: 'SPOTIFY', bg: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' };
    case 'youtube':
      return { text: 'YOUTUBE', bg: 'bg-red-950/60 text-red-400 border-red-800/40' };
    case 'soundcloud':
      return { text: 'SOUNDCLOUD', bg: 'bg-orange-950/60 text-orange-400 border-orange-800/40' };
    case 'vsnectar':
      return { text: 'VS NECTAR', bg: 'bg-amber-950/60 text-amber-400 border-amber-800/40' };
    default:
      return { text: provider.toUpperCase(), bg: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
  }
}

export function QueuePanel() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const setIsQueueOpen = usePlayerStore((s) => s.setIsQueueOpen);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);
  const playQueueIndex = usePlayerStore((s) => s.playQueueIndex);

  const upcomingQueue = queue.slice(queueIndex + 1);

  return (
    <aside className="flex h-full w-80 min-w-[320px] max-w-[380px] shrink-0 flex-col border-l border-white/[0.08] bg-[#121212] p-4 text-white overflow-hidden select-none animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] shrink-0">
        <h2 className="text-base font-bold text-white tracking-tight">Queue</h2>
        <button
          type="button"
          onClick={() => setIsQueueOpen(false)}
          className="rounded-full p-1.5 text-[#b3b3b3] hover:bg-[#282828] hover:text-white transition-colors"
          title="Close Queue"
        >
          <CloseIcon />
        </button>
      </div>

      {/* ── Scrollable Body ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-6 pt-4 pr-1 no-scrollbar">
        {/* Now Playing Section */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#a7a7a7] mb-3">
            Now Playing
          </p>

          {currentTrack ? (
            <div className="group flex items-center gap-3 rounded-lg bg-[#181818] p-2.5 transition-all border border-white/[0.04]">
              {/* Artwork thumbnail */}
              <div className="relative h-12 w-12 shrink-0 rounded overflow-hidden bg-zinc-800 shadow">
                <img
                  src={currentTrack.artwork || '/icon.png'}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <PlayingEqualizerIcon />
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1db954]">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-[#a7a7a7]">
                  {currentTrack.artist}
                </p>
              </div>

              {/* Badge */}
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getProviderBadge(currentTrack.source).bg}`}
              >
                {getProviderBadge(currentTrack.source).text}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#a7a7a7] italic py-2">Nothing currently playing</p>
          )}
        </div>

        {/* Next in Queue Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#a7a7a7]">
              Next In Queue
            </p>

            {upcomingQueue.length > 0 && (
              <button
                type="button"
                onClick={clearQueue}
                className="text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors hover:underline"
              >
                Clear queue
              </button>
            )}
          </div>

          {upcomingQueue.length > 0 ? (
            <div className="space-y-1">
              {upcomingQueue.map((track, i) => {
                const actualIndex = queueIndex + 1 + i;
                const badge = getProviderBadge(track.source);

                return (
                  <div
                    key={`${track.id}-${actualIndex}`}
                    className="group relative flex items-center gap-3 rounded-md px-2 py-2 hover:bg-[#1a1a1a] transition-all cursor-pointer"
                    onClick={() => playQueueIndex(actualIndex)}
                  >
                    {/* Index or Play icon */}
                    <div className="w-5 text-center text-xs font-semibold text-[#a7a7a7] shrink-0">
                      <span className="group-hover:hidden">{i + 1}</span>
                      <span className="hidden group-hover:inline-block">
                        <PlayIcon />
                      </span>
                    </div>

                    {/* Artwork */}
                    <div className="h-10 w-10 shrink-0 rounded overflow-hidden bg-zinc-800">
                      <img
                        src={track.artwork || '/icon.png'}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white group-hover:text-[#1db954] transition-colors">
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-[#a7a7a7]">
                        {track.artist}
                      </p>
                    </div>

                    {/* Badge */}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.bg}`}
                    >
                      {badge.text}
                    </span>

                    {/* Remove from queue button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(actualIndex);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#a7a7a7] hover:text-red-400 transition-all rounded"
                      title="Remove from queue"
                    >
                      <RemoveIcon />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-[#181818] p-4 text-center border border-white/[0.04] space-y-1">
              <p className="text-xs font-medium text-white">Queue is empty</p>
              <p className="text-[11px] text-[#a7a7a7]">
                Click the queue button (+) next to any track to add it to your queue.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
