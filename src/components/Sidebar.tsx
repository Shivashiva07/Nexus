'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePlayerStore, LIKED_SONGS_ID } from '@/store/usePlayerStore';
import { TrackRow } from '@/components/TrackRow';
import { redirectToSpotifyAuthorize } from '@/lib/spotifyAuth';

// ─── Icons ────────────────────────────────────────────────────────────────────

function SpotifyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function HomeIcon({ filled = false }: { filled?: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6 shrink-0">
      <path strokeLinejoin="round" d="M3 12l9-9 9 9v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-9z"/>
    </svg>
  );
}

function SearchIconBig({ filled = false }: { filled?: boolean }) {
  return filled ? (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 shrink-0">
      <path d="M23.384 21.619l-5.794-5.794a9.636 9.636 0 10-1.768 1.768l5.794 5.794a1.25 1.25 0 001.768-1.768zM2.5 11.137A8.637 8.637 0 1111.137 19.773 8.646 8.646 0 012.5 11.137z"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6 shrink-0">
      <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
    </svg>
  );
}

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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
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

function SearchSmallIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
      <circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="m20 20-3.5-3.5"/>
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
      <path d="M15 14.5H5V13h10v1.5zm0-5.75H5v-1.5h10v1.5zM15 3H5V1.5h10V3zM3 3H1V1.5h2V3zm0 5.75H1v-1.5h2v1.5zM3 14.5H1V13h2v1.5z"/>
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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Store
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const library = usePlayerStore((s) => s.library);
  const playlists = usePlayerStore((s) => s.playlists);
  const createPlaylist = usePlayerStore((s) => s.createPlaylist);
  const activeView = usePlayerStore((s) => s.activeView);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  const activePlaylistId = usePlayerStore((s) => s.activePlaylistId);
  const setActivePlaylistId = usePlayerStore((s) => s.setActivePlaylistId);
  const isSpotifyPremium = usePlayerStore((s) => s.isSpotifyPremium);
  const spotifyAccessToken = usePlayerStore((s) => s.spotifyAccessToken);
  const setSpotifyAccessToken = usePlayerStore((s) => s.setSpotifyAccessToken);
  const setSpotifyPremium = usePlayerStore((s) => s.setSpotifyPremium);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  const filteredPlaylists = searchQuery.trim()
    ? playlists.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : playlists;

  function handleCreate() {
    const id = createPlaylist(`My Playlist #${playlists.length + 1}`);
    setActiveView('library');
    setActivePlaylistId(id);
  }

  const isHomeActive = activeView === 'search';
  const likedActive = activePlaylistId === LIKED_SONGS_ID && activeView === 'library';

  // ─── Collapsed sidebar ───────────────────────────────────────────────────────
  if (isCollapsed) {
    return (
      <aside className="flex h-full w-[72px] shrink-0 flex-col bg-[#000000] py-2 gap-1">
        {/* Nexus logo */}
        <div className="flex items-center justify-center px-3 py-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
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

        {/* Spotify icon */}
        {mounted && (
          <div className="flex justify-center px-2 pb-3">
            {spotifyAccessToken ? (
              <button
                type="button"
                title="Spotify Connected"
                onClick={() => { setSpotifyAccessToken(null); setSpotifyPremium(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1db954] text-black transition-all hover:scale-105"
              >
                <SpotifyIcon className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                title="Connect Spotify"
                onClick={() => redirectToSpotifyAuthorize()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#282828] text-[#b3b3b3] hover:text-white transition-all"
              >
                <SpotifyIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </aside>
    );
  }

  // ─── Expanded sidebar ─────────────────────────────────────────────────────────
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col bg-[#000000] overflow-hidden">

      {/* ── Top Header (Logo) ─────────────────────────────── */}
      <div className="bg-[#121212] rounded-lg mx-2 mt-2 mb-2 px-4 py-3.5 flex-shrink-0 flex items-center justify-between">
        {/* Logo (clickable to return to Discover/Search) */}
        <button
          type="button"
          onClick={() => { setActiveView('search'); setActivePlaylistId(null); }}
          className="flex items-center gap-3 text-left group"
          title="Back to Discover / Search"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Nexus</h1>
            <p className="text-[10px] text-[#a7a7a7] mt-0.5 leading-none">Multi-Platform Player</p>
          </div>
        </button>
      </div>

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
              onClick={handleCreate}
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
          <button
            type="button"
            className="rounded-full bg-white text-black text-xs font-semibold px-3 py-1.5 transition-all"
          >
            Playlists
          </button>
          <button
            type="button"
            className="rounded-full bg-[#2a2a2a] text-white text-xs font-semibold px-3 py-1.5 hover:bg-[#3a3a3a] transition-all"
          >
            Artists
          </button>
          <button
            type="button"
            className="rounded-full bg-[#2a2a2a] text-white text-xs font-semibold px-3 py-1.5 hover:bg-[#3a3a3a] transition-all"
          >
            Albums
          </button>
        </div>

        {/* Search + Recents row */}
        <div className="flex items-center justify-between px-4 pb-2 flex-shrink-0">
          {showSearch ? (
            <div className="flex flex-1 items-center gap-2 rounded bg-[#2a2a2a] px-3 py-2 mr-2">
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
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#b3b3b3] hover:text-white transition-colors ml-auto"
          >
            Recents
            <ListIcon />
          </button>
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
              <button
                key={p.id}
                type="button"
                onClick={() => { setActiveView('library'); setActivePlaylistId(p.id); }}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-all hover:bg-[#1a1a1a] ${isActive ? 'bg-[#2a2a2a]' : ''}`}
              >
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
              </button>
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
                onClick={handleCreate}
                className="rounded-full bg-white text-black text-xs font-bold px-4 py-1.5 hover:scale-105 transition-all"
              >
                Create playlist
              </button>
            </div>
          )}


        </div>

        {/* ── Spotify Connection ─────────────────────────────────── */}
        {mounted && (
          <div className="flex-shrink-0 border-t border-white/[0.07] px-3 py-3">
            {spotifyAccessToken ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1db954]">
                    <SpotifyIcon className="h-4 w-4 text-black" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white leading-none">Spotify</p>
                    <p className="text-[10px] text-[#a7a7a7] mt-0.5 leading-none">
                      {isSpotifyPremium ? 'Premium' : 'Free'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSpotifyAccessToken(null); setSpotifyPremium(false); }}
                  className="text-[10px] text-[#a7a7a7] hover:text-white transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => redirectToSpotifyAuthorize()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1db954] px-4 py-2.5 text-xs font-bold text-black hover:bg-[#1ed760] hover:scale-[1.02] transition-all active:scale-95"
              >
                <SpotifyIcon className="h-3.5 w-3.5 text-black" />
                Connect Spotify
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom padding */}
      <div className="h-2" />
    </aside>
  );
}
