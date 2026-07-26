'use client';

import { useMemo, useState, useEffect } from 'react';
import { TrackRow } from '@/components/TrackRow';
import { AddToPlaylistModal } from '@/components/LibraryPanel';
import { usePlayerStore, LIKED_SONGS_ID, type Track } from '@/store/usePlayerStore';
import { fetchAggregatedSearch, resolveSoundCloudStreamUrl } from '@/lib/api/client';
import type { AggregatedSearchResult } from '@/lib/api/types';

const SECTIONS: Array<{ key: keyof Omit<AggregatedSearchResult, 'errors'>; label: string; color: string }> = [
  { key: 'spotify', label: 'Spotify', color: 'text-emerald-400' },
  { key: 'youtube', label: 'YouTube', color: 'text-red-400' },
  { key: 'soundcloud', label: 'SoundCloud', color: 'text-orange-400' },
  { key: 'vsnectar', label: 'VS Nectar', color: 'text-amber-400' },
];

// ─── Home Grid (Spotify-style quick access) ───────────────────────────────────

function HomeGrid({ recentSearches, onSearchRecent }: {
  recentSearches: string[];
  onSearchRecent: (q: string) => void;
}) {
  const library = usePlayerStore((s) => s.library);
  const playlists = usePlayerStore((s) => s.playlists);
  const setActiveView = usePlayerStore((s) => s.setActiveView);
  const setActivePlaylistId = usePlayerStore((s) => s.setActivePlaylistId);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Build quick-access items: playlists + liked songs
  const quickItems = [
    { id: LIKED_SONGS_ID, name: 'Liked Songs', artwork: null, isLiked: true, count: library.length },
    ...playlists.slice(0, 5).map(p => ({
      id: p.id, name: p.name,
      artwork: p.tracks.find(t => t.artwork)?.artwork ?? null,
      isLiked: false,
      count: p.tracks.length
    })),
  ];

  // Fill up to 6 slots with recent searches if needed
  const searchItems = recentSearches.slice(0, Math.max(0, 6 - quickItems.length));

  return (
    <div className="space-y-8 pb-6">
      <h1 className="text-2xl font-bold text-white">{greeting}</h1>

      {/* Quick access 3-col grid */}
      {quickItems.length > 0 && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {quickItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setActiveView('library'); setActivePlaylistId(item.id); }}
              className="group flex items-center overflow-hidden rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all"
            >
              {/* Thumbnail */}
              <div className="h-16 w-16 shrink-0 overflow-hidden">
                {item.isLiked ? (
                  <div className="h-full w-full bg-gradient-to-br from-violet-700 via-violet-500 to-indigo-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 text-white">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                ) : item.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.artwork} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[#404040] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#a7a7a7]">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                    </svg>
                  </div>
                )}
              </div>
              <span className="px-3 text-sm font-bold text-white truncate">{item.name}</span>
            </button>
          ))}
          {/* Recent search shortcut tiles */}
          {searchItems.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onSearchRecent(q)}
              className="group flex items-center overflow-hidden rounded bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-all"
            >
              <div className="h-16 w-16 shrink-0 bg-[#404040] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#a7a7a7" strokeWidth={2} className="h-6 w-6">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
              </div>
              <span className="px-3 text-sm font-bold text-white truncate">{q}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state if no playlists and no recent searches */}
      {quickItems.length === 0 && recentSearches.length === 0 && (
        <p className="text-sm text-[#a7a7a7]">Search for music across Spotify, YouTube, SoundCloud &amp; VS Nectar.</p>
      )}
    </div>
  );
}

export function SearchPanel() {
  const activeTab = usePlayerStore((s) => s.searchTab);
  const setActiveTab = usePlayerStore((s) => s.setSearchTab);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);

  const setSearchQuery = usePlayerStore((s) => s.setSearchQuery);
  const results = usePlayerStore((s) => s.searchResults);
  const setResults = usePlayerStore((s) => s.setSearchResults);
  const isSearching = usePlayerStore((s) => s.isSearching);
  const setIsSearching = usePlayerStore((s) => s.setIsSearching);
  const searchError = usePlayerStore((s) => s.searchError);
  const setSearchError = usePlayerStore((s) => s.setSearchError);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const spotifyAccessToken = usePlayerStore((s) => s.spotifyAccessToken);
  const setSpotifyAccessToken = usePlayerStore((s) => s.setSpotifyAccessToken);
  const setSpotifyPremium = usePlayerStore((s) => s.setSpotifyPremium);
  const recentSearches = usePlayerStore((s) => s.recentSearches);
  const addRecentSearch = usePlayerStore((s) => s.addRecentSearch);

  const combinedTracks = useMemo<Track[]>(() => {
    if (!results) return [];
    return [...results.spotify, ...results.youtube, ...results.soundcloud, ...results.vsnectar];
  }, [results]);

  // Pre-fetch duration metadata for tracks in search results that have duration === 0 (e.g. VS Nectar)
  useEffect(() => {
    if (!results || !results.vsnectar || results.vsnectar.length === 0) return;

    let cancelled = false;
    const unprobedTracks = results.vsnectar.filter((t) => t.duration === 0 && t.streamUrl);
    if (unprobedTracks.length === 0) return;

    const audioElements: HTMLAudioElement[] = [];

    unprobedTracks.forEach((track) => {
      if (!track.streamUrl) return;
      const audio = new Audio();
      audio.preload = 'metadata';

      const handleLoaded = () => {
        if (cancelled) return;
        const dur = Math.round(audio.duration);
        if (dur && isFinite(dur) && dur > 0) {
          setResults({
            ...results,
            vsnectar: results.vsnectar.map((t) =>
              t.id === track.id ? { ...t, duration: dur } : t
            ),
          });
        }
      };

      audio.addEventListener('loadedmetadata', handleLoaded);
      audio.src = track.streamUrl;
      audioElements.push(audio);
    });

    return () => {
      cancelled = true;
      audioElements.forEach((a) => {
        a.src = '';
        a.load();
      });
    };
  }, [results, setResults]);

  async function executeSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    addRecentSearch(trimmed);
    setIsSearching(true);
    setSearchError(null);
    setActiveTab('all');
    try {
      const data = await fetchAggregatedSearch(trimmed, spotifyAccessToken);
      if (data.errors.spotify?.includes('401') || data.errors.spotify?.includes('expired')) {
        setSpotifyAccessToken(null);
        setSpotifyPremium(false);
      }
      setResults(data);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearchRecent(q: string) {
    setSearchQuery(q);
    executeSearch(q);
  }

  async function handlePlay(track: Track) {
    const index = combinedTracks.findIndex((t) => t.id === track.id);
    if (index === -1) return;

    if (track.source === 'soundcloud' && !track.streamUrl && track.externalId) {
      setResolvingTrackId(track.id);
      try {
        const streamUrl = await resolveSoundCloudStreamUrl(track.externalId);
        const resolvedQueue = combinedTracks.map((t) => (t.id === track.id ? { ...t, streamUrl } : t));
        setQueue(resolvedQueue, index);
      } catch (error) {
        setSearchError(error instanceof Error ? error.message : 'Failed to resolve SoundCloud stream.');
      } finally {
        setResolvingTrackId(null);
      }
      return;
    }

    setQueue(combinedTracks, index);
  }

function SpotifyCapsuleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function YouTubeCapsuleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

function SoundCloudCapsuleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M1.175 12.225c-.07 0-.13.06-.14.13l-.33 3.54.33 3.52c.01.07.07.12.14.12.07 0 .13-.05.14-.12l.37-3.52-.37-3.54c-.01-.07-.07-.13-.14-.13zm1.18-.88c-.08 0-.14.06-.15.14l-.32 4.41.32 4.34c.01.08.07.14.15.14s.14-.06.15-.14l.37-4.34-.37-4.41c-.01-.08-.07-.14-.15-.14zm1.18-.73c-.09 0-.15.06-.16.15l-.3 5.14.3 5.03c.01.09.07.15.16.15s.15-.06.16-.15l.35-5.03-.35-5.14c-.01-.09-.07-.15-.16-.15zm1.18-.39c-.09 0-.16.07-.17.16l-.28 5.53.28 5.37c.01.09.08.16.17.16s.16-.07.17-.16l.33-5.37-.33-5.53c-.01-.09-.08-.16-.17-.16zm1.18-.28c-.1 0-.17.07-.18.17l-.26 5.81.26 5.61c.01.1.08.17.18.17s.17-.07.18-.17l.31-5.61-.31-5.81c-.01-.1-.08-.17-.18-.17zm1.18-.46c-.1 0-.18.07-.19.17l-.24 6.27.24 5.92c.01.1.09.18.19.18.11 0 .18-.08.19-.18l.29-5.92-.29-6.27c-.01-.1-.08-.17-.19-.17zm1.18-.8c-.11 0-.19.08-.2.19l-.22 7.07.22 6.18c.01.1.09.18.2.18s.19-.08.2-.18l.27-6.18-.27-7.07c-.01-.11-.09-.19-.2-.19zm1.18-.78c-.11 0-.2.08-.21.19l-.2 7.85.2 6.35c.01.11.1.19.21.19s.2-.08.21-.19l.25-6.35-.25-7.85c-.01-.11-.1-.19-.21-.19zm1.18-.54c-.12 0-.2.09-.21.2l-.18 8.39.18 6.49c.01.11.1.2.21.2s.2-.09.21-.2l.23-6.49-.23-8.39c-.01-.11-.09-.2-.21-.2zm1.18-1.5c-.12 0-.21.09-.22.21l-.16 9.89.16 6.64c.01.12.1.21.22.21s.21-.09.22-.21l.21-6.64-.21-9.89c-.01-.12-.1-.21-.22-.21zm1.18.59c-.13 0-.22.1-.23.22l-.14 9.3.14 6.74c.01.12.1.22.23.22.12 0 .22-.1.23-.22l.19-6.74-.19-9.3c-.01-.12-.1-.22-.23-.22zm3.62-5.75c-1.39 0-2.58.74-3.23 1.84l-.16 9.17.16 6.84c.01.13.11.23.24.23h7.62c2.48 0 4.5-2.02 4.5-4.5 0-2.31-1.74-4.21-4-4.47-.36-2.58-2.57-4.58-5.13-4.58z"/>
    </svg>
  );
}

function VSNectarCapsuleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
    </svg>
  );
}

function AllCapsuleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>
  );
}

  const platformTabs = [
    { key: 'all',        label: 'All',        Icon: AllCapsuleLogo,        color: 'bg-white text-black font-bold' },
    { key: 'spotify',    label: 'Spotify',    Icon: SpotifyCapsuleLogo,    color: 'bg-[#1db954] text-black font-bold' },
    { key: 'youtube',    label: 'YouTube',    Icon: YouTubeCapsuleLogo,    color: 'bg-[#ff0000] text-white font-bold' },
    { key: 'soundcloud', label: 'SoundCloud', Icon: SoundCloudCapsuleLogo, color: 'bg-[#ff5500] text-white font-bold' },
    { key: 'vsnectar',   label: 'VS Nectar',  Icon: VSNectarCapsuleLogo,   color: 'bg-[#f59e0b] text-black font-bold' },
  ];

  return (
    <div className="flex h-full flex-col bg-[#121212] overflow-y-auto p-6 space-y-6">

      {/* ── Platform Filter Tablets (Spotify, YouTube, SoundCloud, VS Nectar) ── */}
      {(results || isSearching) && (
        <div className="sticky top-0 z-20 -mx-6 -mt-6 mb-4 px-6 py-3.5 bg-[#121212]/95 backdrop-blur-xl border-b border-white/[0.08] flex items-center gap-2.5 overflow-x-auto no-scrollbar shadow-lg">
          {platformTabs.map((tab) => {
            const isActive = activeTab === tab.key;
            const TabIcon = tab.Icon;

<<<<<<< Updated upstream
            return (
=======
          {/* Search bar — Spotify pill style */}
          <div ref={dropdownRef} className="relative flex-1">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  {isSearching
                    ? <LoadingSpinner />
                    : <svg viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" strokeWidth={2.5} className="h-4 w-4"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" /></svg>
                  }
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(e as unknown as FormEvent); } }}
                  placeholder="What do you want to play?"
                  className="w-full rounded-full bg-[#2a2a2a] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#a7a7a7] focus:outline-none focus:ring-2 focus:ring-white/20 hover:bg-[#3a3a3a] transition-colors"
                />
              </div>
            </form>

            {/* Recent Searches Dropdown */}
            {isDropdownOpen && recentSearches.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-white/[0.07] bg-[#12121a]/95 p-2 shadow-2xl backdrop-blur-xl animate-fade-up">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] mb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Recent
                  </div>
                  <button
                    type="button"
                    onClick={() => clearRecentSearches()}
                    className="text-[10px] text-white/20 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-0.5">
                  {recentSearches.map((item) => (
                    <div
                      key={item}
                      className="group flex items-center justify-between rounded-xl px-3 py-2 text-xs text-white/50 hover:bg-white/[0.06] hover:text-white cursor-pointer transition-all"
                      onClick={() => handleSelectRecent(item)}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <svg className="w-3 h-3 shrink-0 text-white/20 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="truncate">{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeRecentSearch(item); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-white/60 transition-all"
                        title="Remove from history"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Platform Filter Tabs (shown after search) */}
        {results && (
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {tabs.map((tab) => (
>>>>>>> Stashed changes
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
<<<<<<< Updated upstream
                className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  isActive
                    ? `${tab.color} scale-105 shadow-md`
                    : 'bg-[#242424] text-white/80 hover:bg-[#323232] hover:text-white'
                }`}
=======
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${activeTab === tab.key
                    ? 'bg-white text-black'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                  }`}
>>>>>>> Stashed changes
              >
                <TabIcon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

        {/* Error */}
        {searchError && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-[#2a2a2a] px-4 py-3 text-sm text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {searchError}
          </div>
        )}

        {/* Home state — show recently played playlists */}
        {!results && !isSearching && (
          <HomeGrid recentSearches={recentSearches} onSearchRecent={handleSearchRecent} />
        )}

        {/* Loading skeleton */}
        {isSearching && (
          <div className="space-y-3 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/[0.03] animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-white/[0.05] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 w-3/4 rounded-full bg-white/[0.05]" />
                  <div className="h-2 w-1/2 rounded-full bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {results && !isSearching && (
          <div className="space-y-8 pt-2">
            {SECTIONS.filter((s) => activeTab === 'all' || activeTab === s.key).map(({ key, label }) => {
              const tracks = results[key];
              const providerError = results.errors[key];
              if (tracks.length === 0 && !providerError) return null;

              return (
                <section key={key} className="animate-fade-up">
                  {/* Section header */}
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{label}</h3>
                  </div>

                  {providerError && (
                    <p className="rounded-lg bg-[#1f1f1f] px-4 py-2.5 text-xs text-[#a7a7a7]">
                      {providerError === 'fetch failed'
                        ? 'Unable to connect to service. Please check your connection or credentials.'
                        : providerError}
                    </p>
                  )}

                  <div className="space-y-0.5">
                    {tracks.map((track, i) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        isActive={currentTrack?.id === track.id}
                        isLoading={resolvingTrackId === track.id}
                        onPlay={() => handlePlay(track)}
                        index={i}
                        onAddToPlaylist={() => setAddToPlaylistTrack(track)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      {/* Add to Playlist Modal */}
      {addToPlaylistTrack && (
        <AddToPlaylistModal
          track={addToPlaylistTrack}
          onClose={() => setAddToPlaylistTrack(null)}
        />
      )}
    </div>
  );
}
}
