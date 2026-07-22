import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addTrackToPlaylist: (playlistId: string, track: Track) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
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
      setTrack: (track) => set({ currentTrack: track, isPlaying: true, currentTime: 0 }),
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
