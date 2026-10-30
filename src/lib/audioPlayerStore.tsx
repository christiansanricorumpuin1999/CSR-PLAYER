'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { CommandResult, PlaybackStatus, PlayerControls, QueueItem, RepeatMode, Track } from './types';
import { recordHistory, toggleFavorite as dbToggleFavorite } from './db';
import { runCommand } from './commandExecutor';

type AudioPlayerContextType = PlayerControls & {
  executeCommand: (input: string) => Promise<CommandResult>;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

interface QueueState {
  items: QueueItem[];
  index: number;
}

function describeAudioError(code: number | undefined, isStream: boolean): string {
  switch (code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return 'Playback was stopped before the audio finished loading.';
    case MediaError.MEDIA_ERR_NETWORK:
      return isStream
        ? 'The audio link could not be downloaded. The server may be offline or blocking playback from other websites.'
        : 'The audio file could not be read from your library.';
    case MediaError.MEDIA_ERR_DECODE:
      return 'This audio file is damaged or uses an encoding your browser cannot decode.';
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return isStream
        ? 'This link is not a playable audio file in a format your browser supports. Try a direct MP3, WAV, OGG, M4A, AAC, or FLAC link.'
        : 'Your browser cannot play this file format.';
    default:
      return 'Playback failed.';
  }
}

function playFailure(err: unknown, audio: HTMLAudioElement): { status: PlaybackStatus; message: string } | null {
  if (err instanceof DOMException && err.name === 'AbortError') return null;
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    return { status: 'paused', message: 'Your browser blocked playback. Press Play to start.' };
  }
  return { status: 'error', message: describeAudioError(audio.error?.code, !audio.src.startsWith('blob:')) };
}

function createQueueItem(track: Track, status: QueueItem['status']): QueueItem {
  return { id: `q_${track.id}_${Math.random().toString(36).slice(2, 7)}`, track, status };
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({ items: [], index: -1 });
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const queue = queueState.items;
  const queueIndex = queueState.index;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onPlaying = () => {
      setErrorMessage(undefined);
      setStatus('playing');
    };

    // Keeps 'loading' while a new source is being set, since switching sources also pauses the element
    const onPause = () => {
      setStatus((prev) => (prev === 'loading' || prev === 'error' ? prev : 'paused'));
    };

    const onError = () => {
      setStatus('error');
      setErrorMessage(describeAudioError(audio.error?.code, !audio.src.startsWith('blob:')));
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);

  const applyAudioVolume = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = isMutedRef.current ? 0 : volumeRef.current;
  }, []);

  const releaseObjectUrl = useCallback(() => {
    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
      currentObjectUrlRef.current = null;
    }
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    audio.currentTime = 0;
  }, []);

  const updateMediaSession = useCallback((track: Track) => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const artwork = track.artworkUrl
      ? [{ src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || 'Unknown Artist',
      album: track.album || 'CSR-PLAYER Library',
      artwork,
    });
  }, []);

  // Loads a track into the audio element and starts it; does not touch the queue
  const loadTrack = useCallback(
    async (track: Track) => {
      setErrorMessage(undefined);
      setCurrentTrack(track);
      updateMediaSession(track);
      recordHistory(track.id).catch(() => {});

      releaseObjectUrl();
      setCurrentTime(0);
      setDuration(track.duration || 0);

      const audio = audioRef.current;
      if (!audio) return;

      let src: string;
      if (track.source === 'local') {
        if (!track.localBlob) {
          stopAudio();
          setStatus('error');
          setErrorMessage('This file has no audio data stored, so it cannot be played.');
          return;
        }
        src = URL.createObjectURL(track.localBlob);
        currentObjectUrlRef.current = src;
      } else {
        if (!track.sourceUrl) {
          stopAudio();
          setStatus('error');
          setErrorMessage('This stream has no audio link.');
          return;
        }
        src = track.sourceUrl;
      }

      setStatus('loading');
      audio.src = src;
      applyAudioVolume();

      try {
        await audio.play();
        setStatus('playing');
      } catch (err: unknown) {
        const failure = playFailure(err, audio);
        if (failure) {
          setStatus(failure.status);
          setErrorMessage(failure.message);
        }
      }
    },
    [updateMediaSession, releaseObjectUrl, stopAudio, applyAudioVolume]
  );

  const playTrack = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      setQueueState((prev) => {
        if (newQueue && newQueue.length > 0) {
          const items = newQueue.map((t) => createQueueItem(t, t.id === track.id ? 'playing' : 'ready'));
          const index = items.findIndex((item) => item.track.id === track.id);
          return { items, index: index >= 0 ? index : 0 };
        }

        const existing = prev.items.findIndex((item) => item.track.id === track.id);
        if (existing >= 0) {
          const items = prev.items.map((item, i): QueueItem => ({
            ...item,
            status: i === existing ? 'playing' : 'ready',
          }));
          return { items, index: existing };
        }

        const items = [...prev.items, createQueueItem(track, 'playing')];
        return { items, index: items.length - 1 };
      });

      await loadTrack(track);
    },
    [loadTrack]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;
    audio.play().then(
      () => setStatus('playing'),
      (err: unknown) => {
        const failure = playFailure(err, audio);
        if (failure) {
          setStatus(failure.status);
          setErrorMessage(failure.message);
        }
      }
    );
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!currentTrack) return;
    if (status === 'playing') pause();
    else resume();
  }, [currentTrack, status, pause, resume]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    const target = Math.max(0, seconds);
    audio.currentTime = target;
    setCurrentTime(target);
  }, []);

  const setVolume = useCallback(
    (vol: number) => {
      const clamped = Math.max(0, Math.min(1, vol));
      volumeRef.current = clamped;
      setVolumeState(clamped);
      applyAudioVolume();
    },
    [applyAudioVolume]
  );

  const setMuted = useCallback(
    (muted: boolean) => {
      isMutedRef.current = muted;
      setIsMuted(muted);
      applyAudioVolume();
    },
    [applyAudioVolume]
  );

  const toggleMute = useCallback(() => {
    setMuted(!isMutedRef.current);
  }, [setMuted]);

  const skipNext = useCallback((): boolean => {
    if (queue.length === 0) return false;

    let next = queueIndex + 1;
    if (isShuffle) {
      next = Math.floor(Math.random() * queue.length);
    } else if (next >= queue.length) {
      if (repeatMode !== 'all') return false;
      next = 0;
    }

    const item = queue[next];
    if (!item) return false;
    setQueueState((prev) => ({ ...prev, index: next }));
    void loadTrack(item.track);
    return true;
  }, [queue, queueIndex, isShuffle, repeatMode, loadTrack]);

  const playPrevious = useCallback((): boolean => {
    if (queue.length === 0) return false;

    let prev = queueIndex - 1;
    if (prev < 0) {
      if (repeatMode !== 'all') return false;
      prev = queue.length - 1;
    }

    const item = queue[prev];
    if (!item) return false;
    setQueueState((state) => ({ ...state, index: prev }));
    void loadTrack(item.track);
    return true;
  }, [queue, queueIndex, repeatMode, loadTrack]);

  // Restarts the current track when more than 3 seconds in, otherwise goes back
  const skipPrevious = useCallback(() => {
    if (currentTime > 3 || !playPrevious()) seek(0);
  }, [currentTime, playPrevious, seek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (repeatMode === 'one' && currentTrack) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
        return;
      }
      skipNext();
    };

    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [repeatMode, currentTrack, skipNext]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => resume());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => skipPrevious());
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        skipNext();
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seek(details.seekTime);
      });
    } catch {
      // not all handlers supported everywhere
    }
  }, [resume, pause, skipPrevious, skipNext, seek]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    setQueueState((prev) => ({ ...prev, items: [...prev.items, createQueueItem(track, 'ready')] }));
  }, []);

  const insertNext = useCallback((track: Track) => {
    setQueueState((prev) => {
      const items = [...prev.items];
      items.splice(prev.index + 1, 0, createQueueItem(track, 'ready'));
      return { items, index: prev.index };
    });
  }, []);

  const removeFromQueue = useCallback((queueItemId: string) => {
    setQueueState((prev) => {
      const position = prev.items.findIndex((item) => item.id === queueItemId);
      if (position < 0) return prev;
      const items = prev.items.filter((item) => item.id !== queueItemId);
      let index = prev.index;
      if (position < prev.index) index -= 1;
      return { items, index: Math.min(index, items.length - 1) };
    });
  }, []);

  const reorderQueue = useCallback((fromIndex: number, toIndex: number) => {
    setQueueState((prev) => {
      if (toIndex < 0 || toIndex >= prev.items.length) return prev;
      const items = [...prev.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);

      let index = prev.index;
      if (prev.index === fromIndex) index = toIndex;
      else if (fromIndex < prev.index && toIndex >= prev.index) index -= 1;
      else if (fromIndex > prev.index && toIndex <= prev.index) index += 1;
      return { items, index };
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueueState({ items: [], index: -1 });
  }, []);

  const clearUpcoming = useCallback(() => {
    setQueueState((prev) =>
      prev.index >= 0 ? { items: [prev.items[prev.index]], index: 0 } : { items: [], index: -1 }
    );
  }, []);

  const toggleFavorite = useCallback(async (trackId: string): Promise<boolean | null> => {
    const newStatus = await dbToggleFavorite(trackId).catch(() => null);
    if (newStatus === null) return null;
    setCurrentTrack((prev) => (prev && prev.id === trackId ? { ...prev, isFavorite: newStatus } : prev));
    setQueueState((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.track.id === trackId ? { ...item, track: { ...item.track, isFavorite: newStatus } } : item
      ),
    }));
    return newStatus;
  }, []);

  const handleTracksRemoved = useCallback(
    (trackIds: string[]) => {
      if (!trackIds || trackIds.length === 0) return;
      const removedSet = new Set(trackIds);

      if (currentTrack && removedSet.has(currentTrack.id)) {
        stopAudio();
        releaseObjectUrl();
        setCurrentTrack(null);
        setStatus('idle');
        setCurrentTime(0);
        setDuration(0);
        setIsFullPlayerOpen(false);

        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          try {
            navigator.mediaSession.metadata = null;
          } catch {
            // ignore
          }
        }
      }

      setQueueState((prev) => {
        const currentId = prev.items[prev.index]?.id;
        const items = prev.items.filter((item) => !removedSet.has(item.track.id));
        return { items, index: items.findIndex((item) => item.id === currentId) };
      });
    },
    [currentTrack, stopAudio, releaseObjectUrl]
  );

  // Commands read the latest committed state through this ref
  const controlsRef = useRef<PlayerControls | null>(null);

  const controls: PlayerControls = {
    currentTrack,
    status,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    queue,
    queueIndex,
    errorMessage,
    isFullPlayerOpen,
    isOnline,
    playTrack,
    togglePlayPause,
    pause,
    resume,
    seek,
    setVolume,
    setMuted,
    toggleMute,
    skipNext,
    skipPrevious,
    playPrevious,
    toggleShuffle,
    setRepeatMode,
    addToQueue,
    insertNext,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    clearUpcoming,
    openFullPlayer: () => setIsFullPlayerOpen(true),
    closeFullPlayer: () => setIsFullPlayerOpen(false),
    toggleFavorite,
    handleTracksRemoved,
  };

  useEffect(() => {
    controlsRef.current = controls;
  });

  const executeCommand = useCallback(async (input: string): Promise<CommandResult> => {
    const latest = controlsRef.current;
    if (!latest) {
      return { success: false, action: 'invalid', message: 'The player is still starting. Try again in a moment.' };
    }
    return runCommand(input, latest);
  }, []);

  return (
    <AudioPlayerContext.Provider value={{ ...controls, executeCommand }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return ctx;
}
