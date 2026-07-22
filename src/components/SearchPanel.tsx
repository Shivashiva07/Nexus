'use client';

import { FormEvent, useMemo, useRef, useState, useEffect } from 'react';
import { TrackRow } from '@/components/TrackRow';
import { AddToPlaylistModal } from '@/components/LibraryPanel';
import { usePlayerStore, type Track } from '@/store/usePlayerStore';
import { fetchAggregatedSearch, resolveSoundCloudStreamUrl } from '@/lib/api/client';
import type { AggregatedSearchResult } from '@/lib/api/types';

const SECTIONS: Array<{ key: keyof Omit<AggregatedSearchResult, 'errors'>; label: string; color: string }> = [
  { key: 'spotify',    label: 'Spotify',    color: 'text-emerald-400' },
  { key: 'youtube',    label: 'YouTube',    color: 'text-red-400' },
  { key: 'soundcloud', label: 'SoundCloud', color: 'text-orange-400' },
  { key: 'vsnectar',   label: 'VS Nectar',  color: 'text-amber-400' },
];

function SearchMagnifier() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 animate-spin">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
    </svg>
  );
}

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
  const { LIKED_SONGS_ID } = require('@/store/usePlayerStore');
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
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                ) : item.artwork ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.artwork} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[#404040] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#a7a7a7]">
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
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
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AggregatedSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resolvingTrackId, setResolvingTrackId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const spotifyAccessToken = usePlayerStore((s) => s.spotifyAccessToken);
  const recentSearches = usePlayerStore((s) => s.recentSearches);
  const addRecentSearch = usePlayerStore((s) => s.addRecentSearch);
  const removeRecentSearch = usePlayerStore((s) => s.removeRecentSearch);
  const clearRecentSearches = usePlayerStore((s) => s.clearRecentSearches);

  const combinedTracks = useMemo<Track[]>(() => {
    if (!results) return [];
    return [...results.spotify, ...results.youtube, ...results.soundcloud, ...results.vsnectar];
  }, [results]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          setResults((prevResults) => {
            if (!prevResults) return prevResults;
            return {
              ...prevResults,
              vsnectar: prevResults.vsnectar.map((t) =>
                t.id === track.id ? { ...t, duration: dur } : t
              ),
            };
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
  }, [results?.vsnectar]);

  async function executeSearch(searchQuery: string) {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    addRecentSearch(trimmed);
    setIsDropdownOpen(false);
    setIsSearching(true);
    setSearchError(null);
    setActiveTab('all');
    try {
      const data = await fetchAggregatedSearch(trimmed, spotifyAccessToken);
      setResults(data);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    await executeSearch(query);
  }

  function handleSelectRecent(item: string) {
    setQuery(item);
    executeSearch(item);
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

  // Tabs: 'all' plus each provider
  const tabs = [
    { key: 'all', label: 'All' },
    ...SECTIONS.map((s) => ({ key: s.key, label: s.label })),
  ];

  return (
    <div className="flex h-full flex-col bg-[#121212]">

      {/* ── Spotify-style Top Nav Bar ─────────────────── */}
      <div className="flex items-center justify-center px-6 pt-4 pb-3 shrink-0 relative">
        <div className="flex items-center gap-2 w-full max-w-xl">
          <button
            type="button"
            title="Home"
            onClick={() => {
              setQuery('');
              setResults(null);
              setSearchError(null);
            }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2a2a2a] text-[#b3b3b3] hover:text-white hover:scale-105 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline strokeLinecap="round" strokeLinejoin="round" points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>

          {/* Search bar — Spotify pill style */}
          <div ref={dropdownRef} className="relative flex-1">
            <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                {isSearching
                  ? <LoadingSpinner />
                  : <svg viewBox="0 0 24 24" fill="none" stroke="#b3b3b3" strokeWidth={2.5} className="h-4 w-4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
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
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-black'
                    : 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]'
                }`}
              >
                {tab.label}
                {tab.key !== 'all' && results && (
                  <span className="ml-1.5 opacity-60">
                    {results[tab.key as keyof Omit<AggregatedSearchResult, 'errors'>]?.length ?? 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Results / Home ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4">

        {/* Error */}
        {searchError && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg bg-[#2a2a2a] px-4 py-3 text-sm text-red-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {searchError}
          </div>
        )}

        {/* Home state — show recently played playlists */}
        {!results && !isSearching && (
          <HomeGrid recentSearches={recentSearches} onSearchRecent={handleSelectRecent} />
        )}

        {/* Loading skeleton */}
        {isSearching && (
          <div className="space-y-3">
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
          <div className="space-y-8">
            {SECTIONS.filter((s) => activeTab === 'all' || activeTab === s.key).map(({ key, label, color }) => {
              const tracks = results[key];
              const providerError = results.errors[key];
              if (tracks.length === 0 && !providerError) return null;

              return (
                <section key={key} className="animate-fade-up">
                  {/* Section header */}
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{label}</h3>
                    <button className="text-sm font-semibold text-[#a7a7a7] hover:text-white transition-colors">Show all</button>
                  </div>

                  {providerError && (
                    <p className="rounded-lg bg-[#282828] px-4 py-3 text-xs text-[#a7a7a7]">
                      {providerError}
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
      </div>

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
