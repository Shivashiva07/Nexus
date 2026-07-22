'use client';

import { RefObject, useEffect } from 'react';
import { usePlayerStore } from '@/store/usePlayerStore';

/**
 * Binds a native <audio> element to the player store for SoundCloud and VSNectar tracks.
 * The element itself lives in DynamicMediaDock (hidden), this hook just wires
 * source swaps, transport state, volume, and progress reporting.
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isActive || !currentTrack?.streamUrl) return;
    if (audio.src !== currentTrack.streamUrl) {
      audio.src = currentTrack.streamUrl;
      audio.load();
    }
  }, [audioRef, isActive, currentTrack?.streamUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isActive) return;

    if (isPlaying) {
      audio.play().catch(() => {
        // Autoplay can be rejected before a user gesture unlocks the element; the
        // transport controls in PlayerBar remain the source of truth for isPlaying.
      });
    } else {
      audio.pause();
    }
  }, [audioRef, isPlaying, isActive]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [audioRef, volume]);

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

    // Initial check in case metadata was already loaded
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

  useEffect(() => {
    if (!isActive) audioRef.current?.pause();
  }, [audioRef, isActive]);

  useEffect(() => {
    if (seekRequest === null || !isActive || !audioRef.current) return;
    audioRef.current.currentTime = seekRequest;
    clearSeekRequest();
  }, [audioRef, seekRequest, isActive, clearSeekRequest]);
}
