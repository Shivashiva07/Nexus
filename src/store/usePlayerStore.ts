import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AggregatedSearchResult } from '@/lib/api/types';

export type MusicSource = 'spotify' | 'youtube' | 'soundcloud' | 'vsnectar';

export interface Track {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  duration: number; // in seconds
  source: MusicSource;
  streamUrl?: string; // SoundCloud specific asset string
  externalId?: string; // provider-native id (YouTube video id, Spotify URI, etc.)
  embedUrl?: string; // Spotify embed iframe src, when applicable
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  createdAt: number;
}

// Built-in playlist IDs
export const LIKED_SONGS_ID = '__liked_songs__';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  isSpotifyPremium: boolean;
  spotifyAccessToken: string | null;
  seekRequest: number | null;
  library: Track[]; // "Liked Songs" flat list
  playlists: Playlist[]; // user-created playlists
  activeView: 'search' | 'library';
  activePlaylistId: string | null; // null = grid, LIKED_SONGS_ID or playlist.id = detail

  searchQuery: string;
  searchResults: AggregatedSearchResult | null;
  isSearching: boolean;
  searchError: string | null;
  searchTab: string;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: AggregatedSearchResult | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  setSearchError: (error: string | null) => void;
  setSearchTab: (tab: string) => void;
  resetSearch: () => void;

  recentSearches: string[];
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  updateProgress: (time: number) => void;
  updateCurrentTrackDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setSpotifyPremium: (isPremium: boolean) => void;
  setSpotifyAccessToken: (token: string | null) => void;
  seek: (time: number) => void;
  clearSeekRequest: () => void;
  addRecentSearch: (query: string) => void;
  removeRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setActiveView: (view: 'search' | 'library') => void;
  setActivePlaylistId: (id: string | null) => void;
  // Liked Songs
  toggleLibraryTrack: (track: Track) => void;
  // Playlist CRUD
  createPlaylist: (name: string, description?: string) => string;
  createPlaylistWithTracks: (name: string, description: string | undefined, tracks: Track[]) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  // Queue management
  isQueueOpen: boolean;
  toggleQueue: () => void;
  setIsQueueOpen: (open: boolean) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playQueueIndex: (index: number) => void;
  toastMessage: string | null;
  showToast: (msg: string | null) => void;

  // Cloud Sync & User Profile
  firebaseUser: string | null;
  userEmail: string | null;
  userDisplayName: string | null;
  userPhotoURL: string | null;
  isAnonymousUser: boolean;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  setUserProfile: (profile: { userEmail: string | null; userDisplayName: string | null; userPhotoURL: string | null; isAnonymousUser: boolean } | null) => void;
  setFirebaseUser: (uid: string | null) => void;
  setLibraryFromCloud: (tracks: Track[]) => void;
  setPlaylistsFromCloud: (playlists: Playlist[]) => void;
  setRecentSearchesFromCloud: (searches: string[]) => void;
}


export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      volume: 0.5,
      currentTime: 0,
      isSpotifyPremium: false,
      spotifyAccessToken: null,
      seekRequest: null,
      recentSearches: [],
      library: [],
      playlists: [],
      activeView: 'search',
      activePlaylistId: null,
      firebaseUser: null,
      userEmail: null,
      userDisplayName: null,
      userPhotoURL: null,
      isAnonymousUser: true,
      isAuthModalOpen: false,
      setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      setUserProfile: (profile) =>
        set(
          profile
            ? {
                userEmail: profile.userEmail,
                userDisplayName: profile.userDisplayName,
                userPhotoURL: profile.userPhotoURL,
                isAnonymousUser: profile.isAnonymousUser,
              }
            : {
                userEmail: null,
                userDisplayName: null,
                userPhotoURL: null,
                isAnonymousUser: true,
              }
        ),
      setFirebaseUser: (uid) => set({ firebaseUser: uid }),
      setLibraryFromCloud: (tracks) => set({ library: tracks }),
      setPlaylistsFromCloud: (playlists) => set({ playlists }),
      setRecentSearchesFromCloud: (searches) => set({ recentSearches: searches }),

      searchQuery: '',
      searchResults: null,
      isSearching: false,
      searchError: null,
      searchTab: 'all',
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      setIsSearching: (isSearching) => set({ isSearching }),
      setSearchError: (searchError) => set({ searchError }),
      setSearchTab: (tab) => set({ searchTab: tab }),
      resetSearch: () => set({ searchQuery: '', searchResults: null, searchError: null, searchTab: 'all', activeView: 'search', activePlaylistId: null }),
      isQueueOpen: false,
      toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),
      setIsQueueOpen: (open) => set({ isQueueOpen: open }),
      addToQueue: (track) => {
        const { queue, queueIndex, currentTrack } = get();
        if (!currentTrack || queue.length === 0) {
          set({
            queue: [track],
            queueIndex: 0,
            currentTrack: track,
            isPlaying: true,
            currentTime: 0,
            toastMessage: `Added to Queue: ${track.title}`
          });
        } else {
          set({
            queue: [...queue, track],
            toastMessage: `Added to Queue: ${track.title}`
          });
        }
      },
      removeFromQueue: (targetIndex) => {
        set((state) => {
          const newQueue = state.queue.filter((_, idx) => idx !== targetIndex);
          let newIndex = state.queueIndex;
          if (targetIndex < state.queueIndex) {
            newIndex = Math.max(0, state.queueIndex - 1);
          } else if (targetIndex === state.queueIndex && newQueue.length > 0) {
            newIndex = Math.min(newIndex, newQueue.length - 1);
          }
          return {
            queue: newQueue,
            queueIndex: newIndex,
            currentTrack: newQueue[newIndex] || null
          };
        });
      },
      clearQueue: () => {
        set((state) => {
          if (!state.currentTrack) return { queue: [], queueIndex: 0 };
          return {
            queue: [state.currentTrack],
            queueIndex: 0
          };
        });
      },
      playQueueIndex: (index) => {
        const { queue } = get();
        if (queue[index]) {
          set({
            queueIndex: index,
            currentTrack: queue[index],
            isPlaying: true,
            currentTime: 0
          });
        }
      },
      toastMessage: null,
      showToast: (msg) => set({ toastMessage: msg }),

      setTrack: (track) => {
        const { queue, queueIndex } = get();
        if (queue.length === 0) {
          set({ queue: [track], queueIndex: 0, currentTrack: track, isPlaying: true, currentTime: 0 });
        } else {
          const newQueue = [...queue.slice(0, queueIndex + 1), track, ...queue.slice(queueIndex + 1)];
          set({ queue: newQueue, queueIndex: queueIndex + 1, currentTrack: track, isPlaying: true, currentTime: 0 });
        }
      },
      setQueue: (tracks, startIndex = 0) => set({
        queue: tracks,
        queueIndex: startIndex,
        currentTrack: tracks[startIndex] || null,
        isPlaying: tracks.length > 0,
        currentTime: 0
      }),
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      next: () => {
        const { queue, queueIndex } = get();
        if (queueIndex < queue.length - 1) {
          const nextIndex = queueIndex + 1;
          set({ queueIndex: nextIndex, currentTrack: queue[nextIndex], currentTime: 0, isPlaying: true });
        }
      },
      previous: () => {
        const { queue, queueIndex } = get();
        if (queueIndex > 0) {
          const prevIndex = queueIndex - 1;
          set({ queueIndex: prevIndex, currentTrack: queue[prevIndex], currentTime: 0, isPlaying: true });
        }
      },
      updateProgress: (time) => set({ currentTime: time }),
      updateCurrentTrackDuration: (duration) =>
        set((state) => {
          if (!state.currentTrack || !duration || !isFinite(duration) || duration <= 0) return state;
          const rounded = Math.round(duration);
          if (state.currentTrack.duration === rounded) return state;
          const updatedTrack = { ...state.currentTrack, duration: rounded };
          const updatedQueue = state.queue.map((t, idx) =>
            idx === state.queueIndex ? updatedTrack : t
          );
          return { currentTrack: updatedTrack, queue: updatedQueue };
        }),
      setVolume: (volume) => set({ volume }),
      setSpotifyPremium: (isPremium) => set({ isSpotifyPremium: isPremium }),
      setSpotifyAccessToken: (token) => set({ spotifyAccessToken: token }),
      seek: (time) => set({ seekRequest: time, currentTime: time }),
      clearSeekRequest: () => set({ seekRequest: null }),
      addRecentSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        set((state) => {
          const filtered = state.recentSearches.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase()
          );
          return { recentSearches: [trimmed, ...filtered].slice(0, 10) };
        });
      },
      removeRecentSearch: (query) => {
        set((state) => ({
          recentSearches: state.recentSearches.filter((item) => item !== query),
        }));
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
      setActiveView: (view) => set({ activeView: view, activePlaylistId: null }),
      setActivePlaylistId: (id) => set({ activePlaylistId: id }),
      // Liked Songs toggle
      toggleLibraryTrack: (track) => set((state) => {
        const exists = state.library.some((t) => t.id === track.id);
        if (exists) {
          return { library: state.library.filter((t) => t.id !== track.id) };
        } else {
          return { library: [track, ...state.library] };
        }
      }),
      // Playlist CRUD
      createPlaylist: (name, description) => {
        const id = `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
          playlists: [
            ...state.playlists,
            { id, name, description, tracks: [], createdAt: Date.now() },
          ],
        }));
        return id;
      },
      createPlaylistWithTracks: (name, description, tracks) => {
        const id = `playlist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        set((state) => ({
          playlists: [
            ...state.playlists,
            { id, name, description, tracks, createdAt: Date.now() },
          ],
        }));
        return id;
      },
      deletePlaylist: (id) => {
        set((state) => ({
          playlists: state.playlists.filter((p) => p.id !== id),
          activePlaylistId: state.activePlaylistId === id ? null : state.activePlaylistId,
        }));
      },
      renamePlaylist: (id, name) => {
        set((state) => ({
          playlists: state.playlists.map((p) => p.id === id ? { ...p, name } : p),
        }));
      },
      addTrackToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((p) => {
            if (p.id !== playlistId) return p;
            // don't add duplicates
            if (p.tracks.some((t) => t.id === track.id)) return p;
            return { ...p, tracks: [...p.tracks, track] };
          }),
        }));
      },
      removeTrackFromPlaylist: (playlistId, trackId) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id !== playlistId ? p : { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
          ),
        }));
      },
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentTrack: state.currentTrack,
        queue: state.queue,
        queueIndex: state.queueIndex,
        volume: state.volume,
        isSpotifyPremium: state.isSpotifyPremium,
        spotifyAccessToken: state.spotifyAccessToken,
        recentSearches: state.recentSearches,
        library: state.library,
        playlists: state.playlists,
      }),
    }
  )
);
