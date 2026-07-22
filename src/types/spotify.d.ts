export {};

declare global {
  interface Window {
    Spotify: typeof Spotify;
    onSpotifyWebPlaybackSDKReady: (() => void) | undefined;
  }

  namespace Spotify {
    interface PlayerInit {
      name: string;
      getOAuthToken: (callback: (token: string) => void) => void;
      volume?: number;
    }

    interface WebPlaybackTrack {
      uri: string;
      id: string | null;
      name: string;
      duration_ms: number;
      artists: Array<{ name: string; uri: string }>;
      album: {
        name: string;
        images: Array<{ url: string }>;
      };
    }

    interface WebPlaybackState {
      paused: boolean;
      position: number;
      duration: number;
      track_window: {
        current_track: WebPlaybackTrack;
      };
    }

    interface WebPlaybackError {
      message: string;
    }

    type PlayerEventName =
      | 'ready'
      | 'not_ready'
      | 'player_state_changed'
      | 'initialization_error'
      | 'authentication_error'
      | 'account_error'
      | 'playback_error';

    class Player {
      constructor(init: PlayerInit);
      connect(): Promise<boolean>;
      disconnect(): void;
      addListener(
        event: 'ready' | 'not_ready',
        callback: (data: { device_id: string }) => void
      ): boolean;
      addListener(
        event: 'player_state_changed',
        callback: (state: WebPlaybackState | null) => void
      ): boolean;
      addListener(
        event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error',
        callback: (data: WebPlaybackError) => void
      ): boolean;
      removeListener(event: PlayerEventName): void;
      getCurrentState(): Promise<WebPlaybackState | null>;
      setName(name: string): Promise<void>;
      getVolume(): Promise<number>;
      setVolume(volume: number): Promise<void>;
      pause(): Promise<void>;
      resume(): Promise<void>;
      togglePlay(): Promise<void>;
      seek(positionMs: number): Promise<void>;
      previousTrack(): Promise<void>;
      nextTrack(): Promise<void>;
      activateElement(): Promise<void>;
    }
  }
}
