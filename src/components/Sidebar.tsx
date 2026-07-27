'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore, LIKED_SONGS_ID, type Playlist } from '@/store/usePlayerStore';
import { CreatePlaylistModal, DeletePlaylistModal } from '@/components/LibraryPanel';
import { ImportYouTubePlaylistModal } from '@/components/ImportYouTubePlaylistModal';

// ─── Spotify Icons ────────────────────────────────────────────────────────────

function SpotifyLibraryIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM7 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM10.883 21.84a1 1 0 0 1-1.34-1.272l4.89-18a1 1 0 0 1 1.802.49l-4.89 18a.997.997 0 0 1-.462.782z"/>
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M19 11h-6V5a1 1 0 00-2 0v6H5a1 1 0 000 2h6v6a1 1 0 002 0v-6h6a1 1 0 000-2z"/>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6"/>
    </svg>
  );
}

function TrashIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    </svg>
  );
}

function SearchSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
      <circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="m20 20-3.5-3.5"/>
    </svg>
  );
}


function HeartFilledIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-white">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  );
}

function MusicNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-[#b3b3b3]">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Sidebar() {
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportYouTubeModal, setShowImportYouTubeModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'playlists'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Store
  const playlists = usePlayerStore((s) => s.playlists);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const deletePlaylist = usePlayerStore((s) => s.deletePlaylist);
  const activeView = usePlayerStore((s) => s.activeView);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  const activePlaylistId = usePlayerStore((s) => s.activePlaylistId);
  const setActivePlaylistId = usePlayerStore((s) => s.setActivePlaylistId);
  const library = usePlayerStore((s) => s.library);

  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = moveEvent.clientX;
      if (newWidth < 150) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
        setSidebarWidth(Math.min(Math.max(newWidth, 200), 500));
      }
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const filteredPlaylists = searchQuery.trim()
    ? playlists.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : playlists;

  function handleCreate(name: string, description?: string) {
    const id = createPlaylist(name, description || undefined);
    setActiveView('library');
    setActivePlaylistId(id);
    setShowCreateModal(false);
  }

  const likedActive = activePlaylistId === LIKED_SONGS_ID && activeView === 'library';

  // ─── Collapsed sidebar (Spotify Design) ──────────────────────────────────────
  if (isCollapsed) {
    return (
      <aside className="flex h-full w-[72px] shrink-0 flex-col bg-[#000000] select-none">
        {/* Library Card Container */}
        <div className="bg-[#121212] rounded-xl flex-1 flex flex-col items-center py-3 px-1.5 gap-3 overflow-y-auto no-scrollbar">
          {/* Library expand toggle icon */}
          <button
            type="button"
            title="Expand Your Library"
            onClick={() => setIsCollapsed(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f] transition-all shrink-0"
          >
            <SpotifyLibraryIcon className="h-6 w-6" />
          </button>

          {/* Plus button for creating playlist */}
          <button
            type="button"
            title="Create new playlist"
            onClick={() => setShowCreateModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f] transition-all shrink-0"
          >
            <PlusIcon />
          </button>

          <div className="w-8 border-t border-white/[0.08] my-0.5" />

          {/* Liked Songs */}
          <button
            type="button"
            title="Liked Songs"
            onClick={() => { setActiveView('library'); setActivePlaylistId(LIKED_SONGS_ID); }}
            className={`relative h-12 w-12 shrink-0 rounded-md overflow-hidden transition-all hover:scale-105 ${likedActive ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#121212]' : ''}`}
          >
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#450af5] via-[#652cd1] to-[#8e8ee5]">
              <HeartFilledIcon />
            </div>
          </button>

          {/* Playlists */}
          {playlists.map((p) => {
            const artwork = p.tracks.find((t) => t.artwork)?.artwork;
            const isActive = activePlaylistId === p.id && activeView === 'library';
            return (
              <button
                key={p.id}
                type="button"
                title={p.name}
                onClick={() => { setActiveView('library'); setActivePlaylistId(p.id); }}
                className={`relative h-12 w-12 shrink-0 rounded-md overflow-hidden transition-all hover:scale-105 bg-[#282828] ${isActive ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#121212]' : ''}`}
              >
                {artwork ? (
                  <Image src={artwork} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <MusicNoteIcon />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {/* Modals */}
        {showCreateModal && (
          <CreatePlaylistModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreate}
          />
        )}
        {showImportYouTubeModal && (
          <ImportYouTubePlaylistModal
            onClose={() => setShowImportYouTubeModal(false)}
          />
        )}
        {playlistToDelete && (
          <DeletePlaylistModal
            playlistName={playlistToDelete.name}
            onClose={() => setPlaylistToDelete(null)}
            onDelete={() => {
              if (activePlaylistId === playlistToDelete.id) {
                setActivePlaylistId(null);
              }
              deletePlaylist(playlistToDelete.id);
              setPlaylistToDelete(null);
            }}
          />
        )}
      </aside>
    );
  }

  // ─── Expanded sidebar (Spotify Design) ───────────────────────────────────────
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="relative flex h-full shrink-0 flex-col bg-[#000000] select-none group/sidebar overflow-hidden"
    >
      {/* ── Your Library Card ───────────────────────────────────────── */}
      <div className="bg-[#121212] rounded-xl flex-1 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveView('library'); setActivePlaylistId(null); }}
            className="flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors group"
          >
            <SpotifyLibraryIcon className="h-6 w-6 text-[#b3b3b3] group-hover:text-white transition-colors" />
            <span className="text-base font-bold tracking-tight">Your Library</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowImportYouTubeModal(true)}
              title="Import YouTube Playlist"
              className="flex h-8 w-8 items-center justify-center rounded-full text-red-500 hover:bg-[#1f1f1f] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              title="Create playlist"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f] transition-all"
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f] transition-all"
            >
              <ArrowLeftIcon />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 px-4 pb-3 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedFilter(selectedFilter === 'playlists' ? 'all' : 'playlists')}
            className={`rounded-full text-xs font-semibold px-3 py-1.5 transition-all ${
              selectedFilter === 'playlists'
                ? 'bg-white text-black'
                : 'bg-[#232323] text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Playlists
          </button>
        </div>

        {/* Search & Recents sorting row */}
        <div className="flex items-center justify-between px-4 pb-2 shrink-0">
          {showSearch ? (
            <div className="flex flex-1 items-center gap-2 rounded-md bg-[#242424] px-3 py-1.5">
              <SearchSmallIcon />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); setShowSearch(false); } }}
                placeholder="Search in Your Library"
                className="flex-1 bg-transparent text-xs text-white placeholder:text-[#7f7f7f] focus:outline-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#1f1f1f] transition-all"
              title="Search in Your Library"
            >
              <SearchSmallIcon />
            </button>
          )}
        </div>

        {/* Scrollable Playlist List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 no-scrollbar">

          {/* Liked Songs */}
          <button
            type="button"
            onClick={() => { setActiveView('library'); setActivePlaylistId(LIKED_SONGS_ID); }}
            className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-all hover:bg-[#1f1f1f] ${likedActive ? 'bg-[#232323]' : ''}`}
          >
            <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#450af5] via-[#652cd1] to-[#8e8ee5]">
              <HeartFilledIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold leading-snug ${likedActive ? 'text-violet-400' : 'text-white'}`}>
                Liked Songs
              </p>
              <p className="truncate text-xs text-[#a7a7a7] mt-0.5">Playlist · {library.length} songs</p>
            </div>
          </button>

          {/* User playlists */}
          {filteredPlaylists.map((p) => {
            const artwork = p.tracks.find((t) => t.artwork)?.artwork;
            const isActive = activePlaylistId === p.id && activeView === 'library';
            return (
              <div
                key={p.id}
                onClick={() => { setActiveView('library'); setActivePlaylistId(p.id); }}
                className={`group flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-all hover:bg-[#1f1f1f] cursor-pointer ${isActive ? 'bg-[#232323]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-[#282828]">
                    {artwork ? (
                      <Image src={artwork} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <MusicNoteIcon />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold leading-snug ${isActive ? 'text-violet-400' : 'text-white'}`}>
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-[#a7a7a7] mt-0.5">
                      Playlist · {p.tracks.length} songs
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  title="Remove from Library"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaylistToDelete(p);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-[#a7a7a7] hover:text-red-400 hover:bg-white/10 transition-all shrink-0 ml-1"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            );
          })}

          {filteredPlaylists.length === 0 && searchQuery && (
            <p className="px-2 py-3 text-xs text-[#a7a7a7]">No playlists match &quot;{searchQuery}&quot;</p>
          )}

          {playlists.length === 0 && !searchQuery && (
            <div className="px-4 py-4 rounded-lg bg-[#1f1f1f] mt-1">
              <p className="text-sm font-bold text-white mb-1">Create your first playlist</p>
              <p className="text-xs text-[#a7a7a7] mb-3">It&apos;s easy, we&apos;ll help you</p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="rounded-full bg-white text-black text-xs font-bold px-4 py-1.5 hover:scale-105 transition-all"
              >
                Create playlist
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Drag Resize Handle ──────────────────────────────────── */}
      <div
        onMouseDown={startResizing}
        onDoubleClick={() => {
          setIsCollapsed(false);
          setSidebarWidth(280);
        }}
        className={`absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize z-30 flex items-center justify-center transition-all ${
          isResizing ? 'bg-violet-500/40' : 'hover:bg-white/20 active:bg-violet-500/40'
        }`}
        title="Drag to resize sidebar (Double-click to reset width)"
      >
        <div className={`h-10 w-1 rounded-full transition-colors ${
          isResizing ? 'bg-violet-400' : 'bg-white/20 group-hover/sidebar:bg-white/50'
        }`} />
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {showImportYouTubeModal && (
        <ImportYouTubePlaylistModal
          onClose={() => setShowImportYouTubeModal(false)}
        />
      )}

      {playlistToDelete && (
        <DeletePlaylistModal
          playlistName={playlistToDelete.name}
          onClose={() => setPlaylistToDelete(null)}
          onDelete={() => {
            if (activePlaylistId === playlistToDelete.id) {
              setActivePlaylistId(null);
            }
            deletePlaylist(playlistToDelete.id);
            setPlaylistToDelete(null);
          }}
        />
      )}
    </aside>
  );
}
