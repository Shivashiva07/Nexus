'use client';

import logoImg from '../../public/logo.png';
import Image from 'next/image';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';
import { fetchAggregatedSearch } from '@/lib/api/client';
import { redirectToSpotifyAuthorize } from '@/lib/spotifyAuth';

function SpotifyIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

export function TopBar() {
  const [mounted, setMounted] = useState(false);
  const searchQuery = usePlayerStore((s) => s.searchQuery);
  const setSearchQuery = usePlayerStore((s) => s.setSearchQuery);
  const setSearchResults = usePlayerStore((s) => s.setSearchResults);
  const isSearching = usePlayerStore((s) => s.isSearching);
  const setIsSearching = usePlayerStore((s) => s.setIsSearching);
  const setSearchError = usePlayerStore((s) => s.setSearchError);
  const resetSearch = usePlayerStore((s) => s.resetSearch);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  const setActivePlaylistId = usePlayerStore((s) => s.setActivePlaylistId);
  const spotifyAccessToken = usePlayerStore((s) => s.spotifyAccessToken);
  const setSpotifyAccessToken = usePlayerStore((s) => s.setSpotifyAccessToken);
  const isSpotifyPremium = usePlayerStore((s) => s.isSpotifyPremium);
  const setSpotifyPremium = usePlayerStore((s) => s.setSpotifyPremium);
  const recentSearches = usePlayerStore((s) => s.recentSearches);
  const addRecentSearch = usePlayerStore((s) => s.addRecentSearch);
  const removeRecentSearch = usePlayerStore((s) => s.removeRecentSearch);
  const clearRecentSearches = usePlayerStore((s) => s.clearRecentSearches);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Debounced Live Search as User Types ──────────────────────────────────────
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      setActiveView('search');
      setActivePlaylistId(null);

      try {
        const data = await fetchAggregatedSearch(trimmed, spotifyAccessToken);
        setSearchResults(data);
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Search failed.');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, spotifyAccessToken, setActiveView, setActivePlaylistId, setIsSearching, setSearchResults, setSearchError]);

  async function executeSearchNow(queryToSearch: string) {
    const trimmed = queryToSearch.trim();
    if (!trimmed) return;

    addRecentSearch(trimmed);
    setIsDropdownOpen(false);
    setIsSearching(true);
    setSearchError(null);
    setActiveView('search');
    setActivePlaylistId(null);

    try {
      const data = await fetchAggregatedSearch(trimmed, spotifyAccessToken);
      setSearchResults(data);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    executeSearchNow(searchQuery);
  }

  function handleSelectRecent(item: string) {
    setSearchQuery(item);
    executeSearchNow(item);
  }

  function handleClear() {
    setSearchQuery('');
    setSearchResults(null);
    setSearchError(null);
    setActiveView('search');
    inputRef.current?.focus();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between bg-black px-4 py-2 border-b border-white/[0.08] shrink-0">
      {/* ── Left: App Icon & Title ────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => resetSearch()}
        className="flex items-center gap-3 text-left group transition-all shrink-0 hover:opacity-90"
        title="Nexus - Return to Home"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/[0.05] border border-white/[0.08] shadow-md group-hover:scale-105 transition-transform">
          <Image src={logoImg} alt="Nexus Logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white leading-tight tracking-tight">Nexus</h1>
          <p className="text-[10px] font-medium text-[#a7a7a7] leading-none">Multi-Platform Player</p>
        </div>
      </button>

      {/* ── Center: Home Button + Search Bar ────────────────────────────── */}
      <div className="flex items-center gap-2 flex-1 max-w-xl mx-4">
        {/* Home Button */}
        <button
          type="button"
          title="Home"
          onClick={() => resetSearch()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1f1f1f] text-[#b3b3b3] hover:text-white hover:bg-[#2a2a2a] hover:scale-105 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
          </svg>
        </button>

        {/* Search Bar */}
        <div ref={dropdownRef} className="relative flex-1">
          <form onSubmit={handleSubmit}>
            <div className="relative flex items-center">
              {/* Search icon or loading spinner */}
              <div className="pointer-events-none absolute left-3.5 flex items-center text-[#b3b3b3]">
                {isSearching ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 animate-spin text-violet-400">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35" strokeLinecap="round"/>
                  </svg>
                )}
              </div>

              <input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="What do you want to play?"
                className="w-full rounded-full bg-[#1f1f1f] hover:bg-[#282828] focus:bg-[#282828] pl-10 pr-9 py-2 text-sm text-white placeholder:text-[#a7a7a7] focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
              />

              {/* Clear button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 text-[#a7a7a7] hover:text-white transition-colors"
                  title="Clear search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* Recent Searches Dropdown */}
          {isDropdownOpen && recentSearches.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-white/[0.08] bg-[#121218]/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-up">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] mb-1">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Recent Searches
                </div>
                <button
                  type="button"
                  onClick={() => clearRecentSearches()}
                  className="text-[10px] text-white/30 hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              </div>

              {recentSearches.slice(0, 5).map((item) => (
                <div
                  key={item}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-[#e0e0e0] hover:bg-white/10 hover:text-white cursor-pointer transition-colors group"
                  onClick={() => handleSelectRecent(item)}
                >
                  <span className="truncate">{item}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeRecentSearch(item); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
                    title="Remove from history"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Spotify Connection ────────────────────────────── */}
      <div className="flex items-center shrink-0">
        {mounted && (
          spotifyAccessToken ? (
            <div className="flex items-center gap-3 rounded-full bg-[#181818] border border-white/[0.08] px-3.5 py-1.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1db954] shrink-0">
                  <SpotifyIcon className="h-3.5 w-3.5 text-black" />
                </div>
                <div className="flex flex-col text-left">
                  <p className="text-xs font-semibold text-white leading-none">Spotify</p>
                  <p className="text-[10px] text-[#a7a7a7] mt-0.5 leading-none">
                    {isSpotifyPremium ? 'Premium' : 'Free'}
                  </p>
                </div>
              </div>
              <div className="h-3 w-px bg-white/10 mx-0.5" />
              <button
                type="button"
                onClick={() => { setSpotifyAccessToken(null); setSpotifyPremium(false); }}
                className="text-[11px] font-medium text-[#a7a7a7] hover:text-white transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => redirectToSpotifyAuthorize()}
              className="flex items-center gap-2 rounded-full bg-[#1db954] px-4 py-2 text-xs font-bold text-black hover:bg-[#1ed760] hover:scale-[1.02] transition-all active:scale-95 shadow-md shadow-[#1db954]/20"
            >
              <SpotifyIcon className="h-3.5 w-3.5 text-black" />
              Connect Spotify
            </button>
          )
        )}
      </div>
    </header>
  );
}
