'use client';

import logoImg from '../../public/logo.png';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore, LIKED_SONGS_ID } from '@/store/usePlayerStore';
import { CreatePlaylistModal } from '@/components/LibraryPanel';

// ─── Icons ────────────────────────────────────────────────────────────────────

function LibraryIconBig() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M8 3h13M8 3v18M21 3v18M21 3H8M21 21H8"/>
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // ─── Collapsed sidebar ───────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <aside className="flex h-full w-[72px] shrink-0 flex-col bg-[#000000] py-2 gap-1">
        {/* Nexus logo */}
        <div className="flex items-center justify-center px-3 py-3 mb-3">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white/[0.05] border border-white/[0.08] shadow-md">
            <Image src={logoImg} alt="Nexus Logo" className="h-full w-full object-cover" />
          </div>
        </div>

        {/* Library icon → expand */}
        <button
          type="button"
          title="Expand Your Library"
          onClick={() => setIsCollapsed(false)}
          className="flex flex-col items-center gap-1 px-2 py-3 text-[#b3b3b3] hover:text-white transition-all"
        >
          <LibraryIconBig />
          <span className="text-[9px] font-semibold">Library</span>
        </button>

        <div className="my-1 border-t border-white/[0.07]" />

        {/* Liked Songs */}
        <button
          type="button"
          title="Liked Songs"
          onClick={() => { setActiveView('library'); setActivePlaylistId(LIKED_SONGS_ID); }}
          className={`mx-auto flex h-12 w-12 items-center justify-center rounded transition-all hover:opacity-80 ${likedActive ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-black' : ''}`}
        >
          <div className="h-12 w-12 rounded flex items-center justify-center bg-gradient-to-br from-violet-700 via-violet-500 to-indigo-400">
            <HeartFilledIcon />
          </div>
        </button>

        {/* User playlists */}
        {playlists.map((p) => {
          const artwork = p.tracks.find((t) => t.artwork)?.artwork;
          const isActive = activePlaylistId === p.id && activeView === 'library';
          return (
            <button
              key={p.id}
              type="button"
              title={p.name}
              onClick={() => { setActiveView('library'); setActivePlaylistId(p.id); }}
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded overflow-hidden transition-all hover:opacity-80 ${isActive ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-black' : ''}`}
            >
              {artwork ? (
                <Image src={artwork} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
              ) : (
                <div className="h-12 w-12 rounded bg-[#282828] flex items-center justify-center">
                  <MusicNoteIcon />
                </div>
              )}
            </button>
          );
        })}

        <div className="mt-auto" />
      </aside>
    );
  }

  // ─── Expanded sidebar ─────────────────────────────────────────────────────────
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="relative flex h-full shrink-0 flex-col bg-[#000000] overflow-hidden p-2 select-none group/sidebar"
    >

      {/* ── Your Library ────────────────────────────────────────── */}
      <div className="bg-[#121212] rounded-lg mx-2 flex-1 overflow-hidden flex flex-col">

        {/* Library Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => { setActiveView('library'); setActivePlaylistId(null); }}
            className="flex items-center gap-3 text-[#b3b3b3] hover:text-white transition-colors group"
          >
            <LibraryIconBig />
            <span className="text-sm font-bold">Your Library</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              title="Create playlist"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-all"
            >
              <PlusIcon />
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-all"
            >
              <ArrowLeftIcon />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-4 pb-3 flex-shrink-0">
          <span className="rounded-full bg-white text-black text-xs font-semibold px-3.5 py-1 transition-all">
            Playlists
          </span>
        </div>

        {/* Search row */}
        <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
          {showSearch ? (
            <div className="flex flex-1 items-center gap-2 rounded bg-[#2a2a2a] px-3 py-2">
              <SearchSmallIcon />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchQuery(''); setShowSearch(false); } }}
                placeholder="Search in Your Library"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#6a6a6a] focus:outline-none"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="p-1.5 rounded-full text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] transition-all"
              title="Search in Your Library"
            >
              <SearchSmallIcon />
            </button>
          )}
        </div>

        {/* Playlist list — scrollable */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-px no-scrollbar">

          {/* Liked Songs */}
          <button
            type="button"
            onClick={() => { setActiveView('library'); setActivePlaylistId(LIKED_SONGS_ID); }}
            className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-all hover:bg-[#1a1a1a] ${likedActive ? 'bg-[#2a2a2a]' : ''}`}
          >
            <div className="h-12 w-12 shrink-0 rounded overflow-hidden flex items-center justify-center bg-gradient-to-br from-violet-700 via-violet-500 to-indigo-400">
              <HeartFilledIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-normal leading-snug ${likedActive ? 'text-violet-400' : 'text-white'}`}>
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
                className={`group flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-all hover:bg-[#1a1a1a] cursor-pointer ${isActive ? 'bg-[#2a2a2a]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-12 w-12 shrink-0 rounded overflow-hidden bg-[#282828]">
                    {artwork ? (
                      <Image src={artwork} alt={p.name} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <MusicNoteIcon />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-normal leading-snug ${isActive ? 'text-violet-400' : 'text-white'}`}>
                      {p.name}
                    </p>
                    <p className="truncate text-xs text-[#a7a7a7] mt-0.5">
                      Playlist · {p.tracks.length} songs
                    </p>
                  </div>
                </div>

                {/* Remove from Library / Delete Button */}
                <button
                  type="button"
                  title="Remove from Library"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePlaylistId === p.id) {
                      setActivePlaylistId(null);
                    }
                    deletePlaylist(p.id);
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
            <div className="px-4 py-4 rounded-lg bg-[#1a1a1a] mt-1">
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

      {/* Bottom padding */}
      <div className="h-2" />

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

      {/* ── Create Playlist Modal ───────────────────────────────── */}
      {showCreateModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </aside>
  );
}
