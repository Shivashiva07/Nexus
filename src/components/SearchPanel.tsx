'use client';

import { useMemo, useState, useEffect } from 'react';
import { TrackRow } from '@/components/TrackRow';
import { AddToPlaylistModal } from '@/components/LibraryPanel';
import { usePlayerStore, LIKED_SONGS_ID, type Track } from '@/store/usePlayerStore';
import { fetchAggregatedSearch, resolveSoundCloudStreamUrl } from '@/lib/api/client';
import type { AggregatedSearchResult } from '@/lib/api/types';

const SECTIONS: Array<{ key: keyof Omit<AggregatedSearchResult, 'errors'>; label: string; color: string }> = [
  { key: 'spotify',    label: 'Spotify',    color: 'text-emerald-400' },
  { key: 'youtube',    label: 'YouTube',    color: 'text-red-400' },
  { key: 'soundcloud', label: 'SoundCloud', color: 'text-orange-400' },
  { key: 'vsnectar',   label: 'VS Nectar',  color: 'text-amber-400' },
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

  const platformTabs = [
    { key: 'all',        label: 'All',        color: 'bg-white text-black font-bold' },
    { key: 'spotify',    label: 'Spotify',    color: 'bg-[#1db954] text-black font-bold' },
    { key: 'youtube',    label: 'YouTube',    color: 'bg-[#ff0000] text-white font-bold' },
    { key: 'soundcloud', label: 'SoundCloud', color: 'bg-[#ff5500] text-white font-bold' },
    { key: 'vsnectar',   label: 'VS Nectar',  color: 'bg-[#f59e0b] text-black font-bold' },
  ];

  return (
    <div className="flex h-full flex-col bg-[#121212] overflow-y-auto p-6 space-y-6">

      {/* ── Platform Filter Tablets (Spotify, YouTube, SoundCloud, VS Nectar) ── */}
      {(results || isSearching) && (
        <div className="sticky top-0 z-20 -mx-6 -mt-6 mb-4 px-6 py-3.5 bg-[#121212]/95 backdrop-blur-xl border-b border-white/[0.08] flex items-center gap-2.5 overflow-x-auto no-scrollbar shadow-lg">
          {platformTabs.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${
                  isActive
                    ? `${tab.color} scale-105 shadow-md`
                    : 'bg-[#242424] text-white/80 hover:bg-[#323232] hover:text-white'
                }`}
              >
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
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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
