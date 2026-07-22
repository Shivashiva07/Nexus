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
 * it in sync with the Zustand player store. The container div must stay mounted
 * for the lifetime of the app since the IFrame API replaces it with an <iframe>.
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
    // Player is created exactly once for the app's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current || !isActive || !currentTrack?.externalId) return;
    player.cueVideoById(currentTrack.externalId);
    if (isPlaying) player.loadVideoById(currentTrack.externalId);
  }, [currentTrack?.id, currentTrack?.externalId, isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !readyRef.current || !isActive) return;

    if (isPlaying) {
      player.playVideo();
      pollRef.current = setInterval(() => {
        updateProgress(player.getCurrentTime());
      }, 500);
    } else {
      player.pauseVideo();
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isPlaying, isActive, updateProgress]);

  useEffect(() => {
    if (!isActive) playerRef.current?.pauseVideo();
  }, [isActive]);

  useEffect(() => {
    playerRef.current?.setVolume(Math.round(volume * 100));
  }, [volume]);

  useEffect(() => {
    if (seekRequest === null || !isActive) return;
    playerRef.current?.seekTo(seekRequest, true);
    clearSeekRequest();
  }, [seekRequest, isActive, clearSeekRequest]);
}
