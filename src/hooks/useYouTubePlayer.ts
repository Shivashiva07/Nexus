'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

const IFRAME_API_SRC = 'https://www.youtube.com/iframe_api';

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) return Promise.resolve();

  return new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    if (!document.querySelector(`script[src="${IFRAME_API_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = IFRAME_API_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

/**
 * Owns the lifecycle of a single YT.Player mounted on #yt-dock-player and keeps
 * it in sync with the Zustand player store.
 */
export function useYouTubePlayer(containerId: string) {
  const playerRef = useRef<YT.Player | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyRef = useRef(false);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const next = usePlayerStore((s) => s.next);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const clearSeekRequest = usePlayerStore((s) => s.clearSeekRequest);

  const isActive = currentTrack?.source === 'youtube';

  useEffect(() => {
    let cancelled = false;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || playerRef.current) return;

      playerRef.current = new window.YT.Player(containerId, {
        height: '180',
        width: '320',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: typeof window !== 'undefined' ? window.location.origin : '',
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            playerRef.current?.setVolume(Math.round(volume * 100));
            const store = usePlayerStore.getState();
            if (store.currentTrack?.source === 'youtube' && store.currentTrack.externalId) {
              if (store.isPlaying) {
                playerRef.current?.loadVideoById(store.currentTrack.externalId);
              } else {
                playerRef.current?.cueVideoById(store.currentTrack.externalId);
              }
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              next();
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  // Synchronized Track Loading & Transport Control for YouTube
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current) return;

    if (!isActive || !currentTrack?.externalId) {
      try { player.pauseVideo(); } catch {}
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (isPlaying) {
      try {
        player.loadVideoById(currentTrack.externalId);
      } catch {}

      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          updateProgress(playerRef.current.getCurrentTime());
        }
      }, 500);
    } else {
      try {
        player.pauseVideo();
      } catch {}
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isActive, currentTrack?.id, currentTrack?.externalId, isPlaying, updateProgress]);

  // Volume sync
  useEffect(() => {
    playerRef.current?.setVolume(Math.round(volume * 100));
  }, [volume]);

  // Seek handler
  useEffect(() => {
    if (seekRequest === null || !isActive) return;
    playerRef.current?.seekTo(seekRequest, true);
    clearSeekRequest();
  }, [seekRequest, isActive, clearSeekRequest]);
}
