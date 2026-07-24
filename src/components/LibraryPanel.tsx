'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { TrackRow } from '@/components/TrackRow';
import { usePlayerStore, type Track, type Playlist, LIKED_SONGS_ID } from '@/store/usePlayerStore';
import { resolveSoundCloudStreamUrl } from '@/lib/api/client';
import { formatTime } from '@/lib/formatTime';

// ─── Icons ──────────────────────────────────────────────────────────────────

function PlusIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className}>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function HeartFilledIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// ─── Artwork Mosaic ──────────────────────────────────────────────────────────

function PlaylistArtwork({ tracks, isLikedSongs = false, size = 'md' }: {
  tracks: Track[];
  isLikedSongs?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'card';
}) {
  const sizeClass = { sm: 'h-12 w-12', md: 'h-16 w-16', lg: 'h-52 w-52', card: 'w-full aspect-square' }[size];
  const imgSize = { sm: '48px', md: '64px', lg: '208px', card: '200px' }[size];

  if (isLikedSongs) {
    return (
      <div className={`${sizeClass} shrink-0 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-700 via-violet-500 to-indigo-400 shadow-lg`}>
        <HeartFilledIcon className={size === 'lg' ? 'h-24 w-24 text-white' : size === 'md' ? 'h-8 w-8 text-white' : 'h-5 w-5 text-white'} />
      </div>
    );
  }

  const artworks = tracks.map(t => t.artwork).filter(Boolean).slice(0, 4);

  if (artworks.length === 0) {
    return (
      <div className={`${sizeClass} shrink-0 rounded-lg flex items-center justify-center bg-white/[0.06] border border-white/[0.07]`}>
        <svg viewBox="0 0 24 24" fill="currentColor" className={size === 'lg' ? 'h-20 w-20 text-white/15' : 'h-6 w-6 text-white/15'}>
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    );
  }

  if (artworks.length < 4) {
    return (
      <div className={`${sizeClass} shrink-0 rounded-lg overflow-hidden relative`}>
        <Image src={artworks[0]} alt="playlist" fill sizes={imgSize} className="object-cover" />
      </div>
    );
  }

  // 2x2 mosaic
  return (
    <div className={`${sizeClass} shrink-0 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2`}>
      {artworks.map((art, i) => (
        <div key={i} className="relative w-full h-full">
          <Image src={art} alt="" fill sizes={`calc(${imgSize} / 2)`} className="object-cover" />
        </div>
      ))}
    </div>
  );
}

// ─── Create Playlist Modal ───────────────────────────────────────────────────

export function CreatePlaylistModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}) {
  const playlists = usePlayerStore((s) => s.playlists);
  const [name, setName] = useState(`My Playlist #${playlists.length + 1}`);
  const [desc, setDesc] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), desc.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#141420] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-5 text-lg font-bold text-white">Create playlist</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Playlist name"
            maxLength={60}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Add an optional description"
            rows={2}
            maxLength={200}
            className="w-full resize-none rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-medium text-white/50 hover:text-white transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rename Modal ────────────────────────────────────────────────────────────

function RenameModal({ playlist, onClose, onRename }: {
  playlist: Playlist;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(playlist.name);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.select(); }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onRename(name.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#141420] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-base font-bold text-white">Rename playlist</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm text-white focus:border-violet-500/60 focus:outline-none focus:ring-1 focus:ring-violet-500/40 transition-all"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={!name.trim()} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Playlist Card ───────────────────────────────────────────────────────────

function PlaylistCard({ playlist, isLikedSongs, onClick }: {
  playlist: { id: string; name: string; description?: string; tracks: Track[] };
  isLikedSongs?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative text-left rounded-md bg-[#181818] p-4 transition-all duration-300 hover:bg-[#282828] active:bg-[#282828]"
    >
      <div className="relative mb-4 shadow-md rounded-md overflow-hidden">
        <PlaylistArtwork tracks={playlist.tracks} isLikedSongs={isLikedSongs} size="card" />
        {/* Play button that appears on hover (Spotify style) */}
        <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 flex h-12 w-12 items-center justify-center rounded-full bg-[#1db954] text-black shadow-lg hover:scale-105 hover:bg-[#1ed760]">
          <PlayIcon />
        </div>
      </div>
      <p className="truncate text-base font-bold text-white mb-1">{playlist.name}</p>
      <p className="truncate text-sm text-[#a7a7a7]">
        {isLikedSongs ? 'Liked Songs' : `By ${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'song' : 'songs'}`}
      </p>
    </button>
  );
}

// ─── Library Grid View ───────────────────────────────────────────────────────

function LibraryGridView({ onOpenPlaylist, onCreatePlaylist }: {
  onOpenPlaylist: (id: string) => void;
  onCreatePlaylist: () => void;
}) {
  const library = usePlayerStore((s) => s.library);
  const playlists = usePlayerStore((s) => s.playlists);

  const allItems = [
    { id: LIKED_SONGS_ID, name: 'Liked Songs', tracks: library, isLikedSongs: true },
    ...playlists.map((p) => ({ ...p, isLikedSongs: false })),
  ];

  return (
    <div className="flex h-full flex-col bg-[#121212]">
      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white tracking-tight">Your Library</h2>
          <button
            type="button"
            onClick={onCreatePlaylist}
            className="flex items-center justify-center h-8 w-8 rounded-full text-[#a7a7a7] hover:text-white hover:bg-[#2a2a2a] transition-all"
            title="Create Playlist"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 animate-fade-up">
          {allItems.map((item) => (
            <PlaylistCard
              key={item.id}
              playlist={item}
              isLikedSongs={item.isLikedSongs}
              onClick={() => onOpenPlaylist(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Playlist Detail View ────────────────────────────────────────────────────

function PlaylistDetailView({ playlistId, onBack }: {
  playlistId: string;
  onBack: () => void;
}) {
  const library = usePlayerStore((s) => s.library);
  const playlists = usePlayerStore((s) => s.playlists);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);
  const renamePlaylist = usePlayerStore((s) => s.renamePlaylist);
  const removeTrackFromPlaylist = usePlayerStore((s) => s.removeTrackFromPlaylist);

  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLiked = playlistId === LIKED_SONGS_ID;
  const playlist = isLiked
    ? { id: LIKED_SONGS_ID, name: 'Liked Songs', description: 'Songs you\'ve liked', tracks: library }
    : playlists.find((p) => p.id === playlistId);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!playlist) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#121212]">
        <p className="text-[#a7a7a7] text-sm">Playlist not found.</p>
        <button onClick={onBack} className="text-xs text-violet-400 hover:underline">← Back to Library</button>
      </div>
    );
  }

  async function handlePlay(track: Track) {
    const index = playlist!.tracks.findIndex((t) => t.id === track.id);
    if (index === -1) return;

    if (track.source === 'soundcloud' && !track.streamUrl && track.externalId) {
      setResolvingTrackId(track.id);
      try {
        const streamUrl = await resolveSoundCloudStreamUrl(track.externalId);
        const resolved = playlist!.tracks.map((t) => t.id === track.id ? { ...t, streamUrl } : t);
        setQueue(resolved, index);
      } catch (err) {
        console.error('Failed to resolve SoundCloud stream.', err);
      } finally {
        setResolvingTrackId(null);
      }
      return;
    }
    setQueue(playlist!.tracks, index);
  }

  function handlePlayAll() {
    if (playlist!.tracks.length === 0) return;
    setQueue(playlist!.tracks, 0);
  }

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <div className="flex h-full flex-col bg-[#121212]">
      {/* Hero header */}
      <div className="relative border-b border-white/[0.04] px-6 pt-5 pb-5 overflow-hidden">
        {/* subtle background glow from artwork */}
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{ background: isLiked ? 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.6) 0%, transparent 60%)' : 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.3) 0%, transparent 60%)' }}
        />

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-xs font-medium text-white/40 hover:text-white transition-colors"
        >
          <ChevronLeftIcon />
          Your Library
        </button>

        <div className="flex items-end gap-5">
          <PlaylistArtwork tracks={playlist.tracks} isLikedSongs={isLiked} size="lg" />

          <div className="flex-1 min-w-0 pb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/35 mb-1">Playlist</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-2 truncate">{playlist.name}</h2>
            {playlist.description && (
              <p className="text-sm text-white/40 mb-2 line-clamp-2">{playlist.description}</p>
            )}
            <p className="text-xs text-white/30">
              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}
              {totalDuration > 0 && ` · ${formatTime(totalDuration)}`}
            </p>
          </div>
        </div>

        {/* Actions row */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handlePlayAll}
            disabled={playlist.tracks.length === 0}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1db954] text-black shadow-lg hover:scale-105 hover:bg-[#1ed760] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            aria-label="Play all"
          >
            <PlayIcon />
          </button>

          {/* Three-dot menu (only for user playlists) */}
          {!isLiked && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
              >
                <DotsIcon />
              </button>
              {showMenu && (
                <div className="absolute left-0 top-11 z-30 min-w-[160px] rounded-xl border border-white/[0.1] bg-[#1a1a28] py-1.5 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => { setShowRenameModal(true); setShowMenu(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <EditIcon /> Rename playlist
                  </button>
                  <button
                    type="button"
                    onClick={() => { deletePlaylist(playlistId); onBack(); }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/30 transition-colors"
                  >
                    <TrashIcon /> Remove from Library
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {playlist.tracks.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center pb-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.03] border border-white/[0.05]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white/15">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/30">This playlist is empty</p>
            <p className="text-xs text-white/15">Add tracks from search results using the + button</p>
          </div>
        ) : (
          <div className="space-y-0.5 animate-fade-up">
            {playlist.tracks.map((track, i) => (
              <TrackRow
                key={track.id}
                track={track}
                isActive={currentTrack?.id === track.id}
                isLoading={resolvingTrackId === track.id}
                onPlay={() => handlePlay(track)}
                index={i}
                onRemoveFromPlaylist={!isLiked ? () => removeTrackFromPlaylist(playlistId, track.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rename modal */}
      {showRenameModal && !isLiked && (
        <RenameModal
          playlist={playlist as Playlist}
          onClose={() => setShowRenameModal(false)}
          onRename={(name) => renamePlaylist(playlistId, name)}
        />
      )}
    </div>
  );
}

// ─── Add to Playlist Modal ───────────────────────────────────────────────────

export function AddToPlaylistModal({ track, onClose }: {
  track: Track;
  onClose: () => void;
}) {
  const playlists = usePlayerStore((s) => s.playlists);
  const addTrackToPlaylist = usePlayerStore((s) => s.addTrackToPlaylist);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating) inputRef.current?.focus();
  }, [creating]);

  function handleAdd(playlistId: string) {
    addTrackToPlaylist(playlistId, track);
    onClose();
  }

  function handleCreateAndAdd() {
    if (!newName.trim()) return;
    const id = createPlaylist(newName.trim());
    addTrackToPlaylist(id, track);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl border border-white/[0.1] bg-[#141420] py-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Add to playlist</p>

        <div className="max-h-60 overflow-y-auto">
          {/* New playlist inline */}
          {creating ? (
            <div className="flex items-center gap-2 px-4 py-2">
              <input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); if (e.key === 'Escape') setCreating(false); }}
                placeholder="Playlist name…"
                className="flex-1 rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
              />
              <button onClick={handleCreateAndAdd} disabled={!newName.trim()} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-violet-400 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.06] border border-dashed border-white/[0.1]">
                <PlusIcon className="h-4 w-4" />
              </div>
              New playlist
            </button>
          )}

          {playlists.length === 0 && !creating && (
            <p className="px-4 py-3 text-xs text-white/25">No playlists yet. Create one above.</p>
          )}

          {playlists.map((p) => {
            const alreadyAdded = p.tracks.some((t) => t.id === track.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => !alreadyAdded && handleAdd(p.id)}
                disabled={alreadyAdded}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/[0.05]'}`}
              >
                <PlaylistArtwork tracks={p.tracks} size="sm" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm text-white/80">{p.name}</p>
                  <p className="text-[10px] text-white/30">{p.tracks.length} songs{alreadyAdded ? ' · Added' : ''}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Root LibraryPanel ───────────────────────────────────────────────────────

export function LibraryPanel() {
  const activePlaylistId = usePlayerStore((s) => s.activePlaylistId);
  const setActivePlaylistId = usePlayerStore((s) => s.setActivePlaylistId);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);

  const [showCreateModal, setShowCreateModal] = useState(false);

  function handleCreate(name: string, description: string) {
    createPlaylist(name, description || undefined);
  }

  if (activePlaylistId !== null) {
    return (
      <>
        <PlaylistDetailView
          playlistId={activePlaylistId}
          onBack={() => setActivePlaylistId(null)}
        />
        {showCreateModal && (
          <CreatePlaylistModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
        )}
      </>
    );
  }

  return (
    <>
      <LibraryGridView
        onOpenPlaylist={(id) => setActivePlaylistId(id)}
        onCreatePlaylist={() => setShowCreateModal(true)}
      />
      {showCreateModal && (
        <CreatePlaylistModal onClose={() => setShowCreateModal(false)} onCreate={handleCreate} />
      )}
    </>
  );
}
