export type TrackSource = 'local' | 'stream';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number; // in seconds
  artworkUrl?: string; // object URL or external URL
  artworkBlob?: Blob;
  source: TrackSource;
  sourceUrl?: string;
  localBlob?: Blob;
  mimeType?: string;
  fileName?: string;
  fileSize?: number;
  folderPath?: string;
  addedAt: number;
  lastPlayedAt?: number;
  isFavorite: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface QueueItem {
  id: string;
  track: Track;
  status: 'resolving' | 'ready' | 'playing' | 'failed';
  error?: string;
}

export type RepeatMode = 'off' | 'one' | 'all';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface CommandResult {
  success: boolean;
  action: string;
  message: string;
}

export interface PlayerControls {
  currentTrack: Track | null;
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  queue: QueueItem[];
  queueIndex: number;
  errorMessage?: string;
  isFullPlayerOpen: boolean;
  isOnline: boolean;

  playTrack: (track: Track, newQueue?: Track[]) => Promise<void>;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  skipNext: () => boolean;
  skipPrevious: () => void;
  playPrevious: () => boolean;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
  addToQueue: (track: Track) => void;
  insertNext: (track: Track) => void;
  removeFromQueue: (queueItemId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  clearUpcoming: () => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  toggleFavorite: (trackId: string) => Promise<boolean | null>;
  handleTracksRemoved: (trackIds: string[]) => void;
}
