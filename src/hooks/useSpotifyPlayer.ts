'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';

function loadSpotifySdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Spotify) return Promise.resolve();

  return new Promise((resolve) => {
    const previousCallback = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      previousCallback?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${SDK_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SDK_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

async function startSpotifyUriPlayback(deviceId: string, token: string, uri: string) {
  await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uris: [uri] }),
  });
}

/**
 * Owns the Web Playback SDK connection for Premium accounts. Only activates
 * when a Spotify access token is present.
 */
export function useSpotifyPlayer() {
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const lastStartedTrackId = useRef<string | null>(null);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const isSpotifyPremium = usePlayerStore((s) => s.isSpotifyPremium);
  const accessToken = usePlayerStore((s) => s.spotifyAccessToken);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const next = usePlayerStore((s) => s.next);
  const pause = usePlayerStore((s) => s.pause);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const clearSeekRequest = usePlayerStore((s) => s.clearSeekRequest);

  const isActive = currentTrack?.source === 'spotify';
  const canUseSdk = isSpotifyPremium && !!accessToken;

  useEffect(() => {
    if (!canUseSdk) return;
    let cancelled = false;

    loadSpotifySdk().then(() => {
      if (cancelled || playerRef.current) return;

      const player = new window.Spotify.Player({
        name: 'Multi-Platform Music Aggregator',
        getOAuthToken: (cb) => cb(accessToken as string),
        volume,
      });

      player.addListener('ready', ({ device_id }) => {
        deviceIdRef.current = device_id;
        const store = usePlayerStore.getState();
        if (store.currentTrack?.source === 'spotify' && store.currentTrack.externalId && store.isPlaying) {
          lastStartedTrackId.current = store.currentTrack.id;
          startSpotifyUriPlayback(device_id, accessToken as string, store.currentTrack.externalId);
        }
      });
      player.addListener('not_ready', () => {
        deviceIdRef.current = null;
      });
      player.addListener('player_state_changed', (state) => {
        if (!state) return;
        updateProgress(state.position / 1000);
        if (state.paused && state.position === 0 && lastStartedTrackId.current) {
          next();
        }
      });
      player.addListener('authentication_error', () => pause());
      player.addListener('account_error', () => pause());

      player.connect();
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      playerRef.current?.disconnect();
      playerRef.current = null;
      deviceIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseSdk, accessToken]);

  // Synchronized Track Loading & Transport Control for Spotify SDK
  useEffect(() => {
    if (!canUseSdk || !isActive || !currentTrack?.externalId) return;
    const deviceId = deviceIdRef.current;
    if (!deviceId || !accessToken) return;

    if (isPlaying) {
      if (lastStartedTrackId.current !== currentTrack.id) {
        lastStartedTrackId.current = currentTrack.id;
        startSpotifyUriPlayback(deviceId, accessToken, currentTrack.externalId);
      } else {
        playerRef.current?.resume();
      }
    } else {
      playerRef.current?.pause();
    }
  }, [canUseSdk, isActive, isPlaying, currentTrack?.id, currentTrack?.externalId, accessToken]);

  // Volume sync
  useEffect(() => {
    if (canUseSdk) playerRef.current?.setVolume(volume);
  }, [canUseSdk, volume]);

  // Reset last track ID when Spotify becomes inactive
  useEffect(() => {
    if (!isActive) lastStartedTrackId.current = null;
  }, [isActive]);

  // Seek handler
  useEffect(() => {
    if (seekRequest === null || !isActive || !canUseSdk) return;
    playerRef.current?.seek(seekRequest * 1000);
    clearSeekRequest();
  }, [seekRequest, isActive, canUseSdk, clearSeekRequest]);
}
