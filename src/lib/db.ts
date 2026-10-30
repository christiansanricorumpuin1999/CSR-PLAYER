import { Playlist, Track } from './types';

const DB_NAME = 'sonora_music_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDb(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only available in browser environment'));
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Tracks store
      if (!db.objectStoreNames.contains('tracks')) {
        const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
        trackStore.createIndex('title', 'title', { unique: false });
        trackStore.createIndex('artist', 'artist', { unique: false });
        trackStore.createIndex('album', 'album', { unique: false });
        trackStore.createIndex('isFavorite', 'isFavorite', { unique: false });
        trackStore.createIndex('addedAt', 'addedAt', { unique: false });
        trackStore.createIndex('lastPlayedAt', 'lastPlayedAt', { unique: false });
      }

      // Playlists store
      if (!db.objectStoreNames.contains('playlists')) {
        db.createObjectStore('playlists', { keyPath: 'id' });
      }

      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Play history
      if (!db.objectStoreNames.contains('history')) {
        const historyStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        historyStore.createIndex('trackId', 'trackId', { unique: false });
        historyStore.createIndex('playedAt', 'playedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Track operations
export async function saveTrack(track: Track): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite');
    const store = tx.objectStore('tracks');
    // Ensure artworkUrl is not stored directly if it was a temporary blob URL;
    // We store the artworkBlob and rebuild the URL when loaded
    const toStore = { ...track };
    delete toStore.artworkUrl;
    const req = store.put(toStore);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function saveMultipleTracks(tracks: Track[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite');
    const store = tx.objectStore('tracks');
    for (const track of tracks) {
      const toStore = { ...track };
      delete toStore.artworkUrl;
      store.put(toStore);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readonly');
    const store = tx.objectStore('tracks');
    const req = store.getAll();
    req.onsuccess = () => {
      const tracks: Track[] = (req.result || []).map((t: Track) => {
        // If artworkBlob exists, create an object URL
        if (t.artworkBlob && !t.artworkUrl) {
          try {
            t.artworkUrl = URL.createObjectURL(t.artworkBlob);
          } catch {
            // ignore
          }
        }
        return t;
      });
      resolve(tracks);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getTrack(id: string): Promise<Track | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readonly');
    const store = tx.objectStore('tracks');
    const req = store.get(id);
    req.onsuccess = () => {
      const track: Track | undefined = req.result;
      if (track && track.artworkBlob && !track.artworkUrl) {
        try {
          track.artworkUrl = URL.createObjectURL(track.artworkBlob);
        } catch {
          // ignore
        }
      }
      resolve(track || null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteTrack(id: string): Promise<{ success: boolean; title?: string }> {
  if (!id || typeof id !== 'string') {
    throw new Error('Missing or invalid track ID');
  }

  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['tracks', 'playlists', 'history'], 'readwrite');
    const trackStore = tx.objectStore('tracks');
    const playlistStore = tx.objectStore('playlists');
    const historyStore = tx.objectStore('history');

    let deletedTitle: string | undefined;

    // Fetch track before deletion to retrieve title and revoke object URL
    const getReq = trackStore.get(id);
    getReq.onsuccess = () => {
      const track: Track | undefined = getReq.result;
      if (track) {
        deletedTitle = track.title;
        if (track.artworkUrl && track.artworkUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(track.artworkUrl);
          } catch {
            // ignore
          }
        }
      }
      trackStore.delete(id);
    };

    // Remove track ID from all playlists
    const playlistReq = playlistStore.getAll();
    playlistReq.onsuccess = () => {
      const playlists = (playlistReq.result || []) as Playlist[];
      for (const p of playlists) {
        if (p.trackIds && p.trackIds.includes(id)) {
          p.trackIds = p.trackIds.filter((tId) => tId !== id);
          p.updatedAt = Date.now();
          playlistStore.put(p);
        }
      }
    };

    // Clean up play history entries for this track
    try {
      const historyIndex = historyStore.index('trackId');
      const histReq = historyIndex.openKeyCursor(IDBKeyRange.only(id));
      histReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          historyStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
    } catch {
      // index not supported or empty
    }

    tx.oncomplete = () => resolve({ success: true, title: deletedTitle });
    tx.onerror = () => reject(tx.error || new Error('Failed to delete track from database.'));
  });
}

export async function deleteMultipleTracks(ids: string[]): Promise<{ count: number; titles: string[] }> {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { count: 0, titles: [] };
  }

  const validIds = ids.filter((id) => typeof id === 'string' && id.trim().length > 0);
  if (validIds.length === 0) return { count: 0, titles: [] };

  const idSet = new Set(validIds);
  const db = await getDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(['tracks', 'playlists', 'history'], 'readwrite');
    const trackStore = tx.objectStore('tracks');
    const playlistStore = tx.objectStore('playlists');
    const historyStore = tx.objectStore('history');

    const deletedTitles: string[] = [];

    for (const id of validIds) {
      const getReq = trackStore.get(id);
      getReq.onsuccess = () => {
        const track: Track | undefined = getReq.result;
        if (track) {
          deletedTitles.push(track.title);
          if (track.artworkUrl && track.artworkUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(track.artworkUrl);
            } catch {
              // ignore
            }
          }
        }
        trackStore.delete(id);
      };
    }

    const playlistReq = playlistStore.getAll();
    playlistReq.onsuccess = () => {
      const playlists = (playlistReq.result || []) as Playlist[];
      for (const p of playlists) {
        if (p.trackIds && p.trackIds.some((tId) => idSet.has(tId))) {
          p.trackIds = p.trackIds.filter((tId) => !idSet.has(tId));
          p.updatedAt = Date.now();
          playlistStore.put(p);
        }
      }
    };

    for (const id of validIds) {
      try {
        const historyIndex = historyStore.index('trackId');
        const histReq = historyIndex.openKeyCursor(IDBKeyRange.only(id));
        histReq.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest).result;
          if (cursor) {
            historyStore.delete(cursor.primaryKey);
            cursor.continue();
          }
        };
      } catch {
        // ignore
      }
    }

    tx.oncomplete = () => resolve({ count: validIds.length, titles: deletedTitles });
    tx.onerror = () => reject(tx.error || new Error('Failed to delete tracks from database.'));
  });
}

export async function clearAllTracks(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['tracks', 'playlists', 'history'], 'readwrite');
    tx.objectStore('tracks').clear();
    tx.objectStore('playlists').clear();
    tx.objectStore('history').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function toggleFavorite(id: string): Promise<boolean> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tracks', 'readwrite');
    const store = tx.objectStore('tracks');
    const req = store.get(id);
    req.onsuccess = () => {
      const track: Track = req.result;
      if (!track) {
        reject(new Error('Track not found'));
        return;
      }
      track.isFavorite = !track.isFavorite;
      store.put(track);
      resolve(track.isFavorite);
    };
    req.onerror = () => reject(req.error);
  });
}

// Playlist operations
export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readonly');
    const store = tx.objectStore('playlists');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.put(playlist);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.get(playlistId);
    req.onsuccess = () => {
      const playlist: Playlist = req.result;
      if (!playlist) return reject(new Error('Playlist not found'));
      if (!playlist.trackIds.includes(trackId)) {
        playlist.trackIds.push(trackId);
        playlist.updatedAt = Date.now();
        store.put(playlist);
      }
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playlists', 'readwrite');
    const store = tx.objectStore('playlists');
    const req = store.get(playlistId);
    req.onsuccess = () => {
      const playlist: Playlist = req.result;
      if (!playlist) return reject(new Error('Playlist not found'));
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
      playlist.updatedAt = Date.now();
      store.put(playlist);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
}

// History & Recently Played
export async function recordHistory(trackId: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['history', 'tracks'], 'readwrite');
  const historyStore = tx.objectStore('history');
  const trackStore = tx.objectStore('tracks');

  const now = Date.now();
  historyStore.add({ trackId, playedAt: now });

  const getReq = trackStore.get(trackId);
  getReq.onsuccess = () => {
    const track: Track = getReq.result;
    if (track) {
      track.lastPlayedAt = now;
      trackStore.put(track);
    }
  };
}

export async function getRecentlyPlayedTracks(limit = 10): Promise<Track[]> {
  const tracks = await getAllTracks();
  return tracks
    .filter((t) => typeof t.lastPlayedAt === 'number' && t.lastPlayedAt > 0)
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0))
    .slice(0, limit);
}

// Settings
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result !== undefined && req.result.value !== undefined) {
          resolve(req.result.value);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function setSetting<T>(key: string, value: T): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const req = store.put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Storage info
export async function getStorageEstimate(): Promise<{
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentage: number;
}> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const est = await navigator.storage.estimate();
      const usage = est.usage || 0;
      const quota = est.quota || 0;
      const formatBytes = (b: number) => {
        if (b === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      const percentage = quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0;
      return {
        usageBytes: usage,
        quotaBytes: quota,
        usageFormatted: formatBytes(usage),
        quotaFormatted: formatBytes(quota),
        percentage,
      };
    } catch {
      // ignore
    }
  }

  return {
    usageBytes: 0,
    quotaBytes: 0,
    usageFormatted: 'N/A',
    quotaFormatted: 'N/A',
    percentage: 0,
  };
}

type BackupTrack = {
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  source?: string;
  sourceUrl?: string;
  fileName?: string;
  addedAt?: number;
  isFavorite?: unknown;
};

type BackupPlaylist = {
  id?: string;
  name?: string;
  trackIds?: string[];
  createdAt?: number;
  updatedAt?: number;
};

type MetadataBackup = {
  tracks?: BackupTrack[];
  playlists?: BackupPlaylist[];
};

export async function importMetadataBackup(data: MetadataBackup): Promise<{ importedTracks: number; importedPlaylists: number }> {
  let importedTracks = 0;
  let importedPlaylists = 0;

  if (data && Array.isArray(data.tracks)) {
    const existingTracks = await getAllTracks();
    const existingIds = new Set(existingTracks.map((t) => t.id));
    const toAdd: Track[] = [];

    for (const t of data.tracks) {
      if (t.id && t.title && !existingIds.has(t.id)) {
        toAdd.push({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration || 0,
          source: (t.source || 'external') as Track['source'],
          sourceUrl: t.sourceUrl,
          fileName: t.fileName,
          addedAt: t.addedAt || Date.now(),
          isFavorite: Boolean(t.isFavorite),
        });
      }
    }

    if (toAdd.length > 0) {
      await saveMultipleTracks(toAdd);
      importedTracks = toAdd.length;
    }
  }

  if (data && Array.isArray(data.playlists)) {
    for (const p of data.playlists) {
      if (p.id && p.name && Array.isArray(p.trackIds)) {
        await savePlaylist({
          id: p.id,
          name: p.name,
          trackIds: p.trackIds,
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || Date.now(),
        });
        importedPlaylists++;
      }
    }
  }

  return { importedTracks, importedPlaylists };
}

