'use client';

import { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { importYouTubePlaylist } from '@/lib/api/client';

export function ImportYouTubePlaylistModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlaylistWithTracks = usePlayerStore((s) => s.createPlaylistWithTracks);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  const setActivePlaylistId = usePlayerStore((s) => s.setActivePlaylistId);
  const showToast = usePlayerStore((s) => s.showToast);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const data = await importYouTubePlaylist(trimmed);
      if (!data.tracks || data.tracks.length === 0) {
        throw new Error('No tracks were found in this YouTube playlist.');
      }

      const playlistId = createPlaylistWithTracks(
        data.name || 'Imported YouTube Playlist',
        data.description || 'Imported from YouTube',
        data.tracks
      );

      showToast(`Imported "${data.name}" (${data.tracks.length} tracks)`);
      setActiveView('library');
      setActivePlaylistId(playlistId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import YouTube playlist.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#141420] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3.5 mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600/15 border border-red-500/30 text-red-500">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Import YouTube Playlist</h3>
            <p className="text-xs text-white/40">Paste a YouTube playlist link or ID to add to your app library</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">YouTube Playlist URL or ID</label>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/playlist?list=PL123..."
              disabled={loading}
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-red-500/60 focus:outline-none focus:ring-1 focus:ring-red-500/40 transition-all disabled:opacity-50"
            />
          </div>

          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 text-[11px] text-white/50 space-y-1">
            <p className="font-semibold text-white/70">Supported Formats:</p>
            <p className="font-mono text-[10px] text-white/40 truncate">https://www.youtube.com/playlist?list=PL...</p>
            <p className="font-mono text-[10px] text-white/40 truncate">https://www.youtube.com/watch?v=...&amp;list=PL...</p>
            <p className="font-mono text-[10px] text-white/40 truncate">PL... or OLAK5uy_...</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs text-red-400">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/50 hover:text-white transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || loading}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/25 hover:bg-red-500 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Importing...
                </>
              ) : (
                'Import Playlist'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
