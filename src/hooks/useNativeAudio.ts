'use client';

import { RefObject, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * Binds a native <audio> element to the player store for SoundCloud and VSNectar tracks.
 * Wires source swaps, transport state, volume, and progress reporting.
 */
export function useNativeAudio(audioRef: RefObject<HTMLAudioElement | null>) {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const updateProgress = usePlayerStore((s) => s.updateProgress);
  const updateCurrentTrackDuration = usePlayerStore((s) => s.updateCurrentTrackDuration);
  const next = usePlayerStore((s) => s.next);
  const seekRequest = usePlayerStore((s) => s.seekRequest);
  const clearSeekRequest = usePlayerStore((s) => s.clearSeekRequest);

  const isActive = currentTrack?.source === 'soundcloud' || currentTrack?.source === 'vsnectar';

  // Synchronized Track Loading & Playback Execution
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isActive || !currentTrack?.streamUrl) {
      audio.pause();
      return;
    }

    const isNewSource = audio.src !== currentTrack.streamUrl;
    if (isNewSource) {
      audio.src = currentTrack.streamUrl;
      audio.load();
    }

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Native audio playback error:', err);
        });
      }
    } else {
      audio.pause();
    }
  }, [audioRef, isActive, currentTrack?.id, currentTrack?.streamUrl, isPlaying]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [audioRef, volume]);

  // Progress, duration, ended events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => updateProgress(audio.currentTime);
    const handleEnded = () => next();
    const handleDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        updateCurrentTrackDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleDuration);
    audio.addEventListener('durationchange', handleDuration);

    if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
      updateCurrentTrackDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleDuration);
      audio.removeEventListener('durationchange', handleDuration);
    };
  }, [audioRef, updateProgress, next, updateCurrentTrackDuration]);

  // Seek handler
  useEffect(() => {
    if (seekRequest === null || !isActive || !audioRef.current) return;
    audioRef.current.currentTime = seekRequest;
    clearSeekRequest();
  }, [audioRef, seekRequest, isActive, clearSeekRequest]);
}
