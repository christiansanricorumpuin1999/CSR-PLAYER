import type { Track } from '@/lib/types';

const JAMENDO_CLIENT_ID = import.meta.env.VITE_JAMENDO_CLIENT_ID as string | undefined;
const SEARCH_LIMIT = 20;

export interface OnlineSearchResult {
  tracks: Track[];
  warnings: string[];
}

interface JamendoTrack {
  id: number | string;
  name: string;
  artist_name?: string;
  album_name?: string;
  duration?: number;
  audio?: string;
  image?: string;
}

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string | string[];
}

interface ArchiveFile {
  name: string;
  source?: string;
}

interface ArchiveMetadata {
  files?: ArchiveFile[];
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return (await res.json()) as T;
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

async function searchJamendo(query: string, signal?: AbortSignal): Promise<Track[]> {
  if (!JAMENDO_CLIENT_ID) return [];
  const params = new URLSearchParams({
    client_id: JAMENDO_CLIENT_ID,
    format: 'json',
    limit: String(SEARCH_LIMIT),
    namesearch: query,
    audioformat: 'mp3',
  });
  const data = await fetchJson<{ results?: JamendoTrack[] }>(
    `https://api.jamendo.com/v3.0/tracks/?${params.toString()}`,
    signal
  );
  return (data.results ?? [])
    .filter((t) => t.audio)
    .map((t) => ({
      id: `online-jamendo-${t.id}`,
      title: t.name,
      artist: t.artist_name || undefined,
      album: t.album_name || undefined,
      duration: t.duration,
      artworkUrl: t.image || undefined,
      source: 'stream' as const,
      sourceUrl: t.audio,
      addedAt: Date.now(),
      isFavorite: false,
    }));
}

async function toPlayableArchiveTrack(doc: ArchiveDoc, signal?: AbortSignal): Promise<Track | null> {
  const identifier = encodeURIComponent(doc.identifier);
  const meta = await fetchJson<ArchiveMetadata>(`https://archive.org/metadata/${identifier}`, signal);
  const file = meta.files?.find((f) => f.source === 'original' && f.name.toLowerCase().endsWith('.mp3'));
  if (!file) return null;

  const path = file.name.split('/').map(encodeURIComponent).join('/');
  return {
    id: `online-archive-${doc.identifier}`,
    title: doc.title || doc.identifier,
    artist: Array.isArray(doc.creator) ? doc.creator[0] : doc.creator,
    artworkUrl: `https://archive.org/services/img/${identifier}`,
    source: 'stream',
    sourceUrl: `https://archive.org/download/${identifier}/${path}`,
    addedAt: Date.now(),
    isFavorite: false,
  };
}

async function searchArchive(query: string, signal?: AbortSignal): Promise<Track[]> {
  const escaped = query.replace(/"/g, '');
  const params = new URLSearchParams({
    q: `"${escaped}" AND mediatype:audio AND format:MP3`,
    rows: String(SEARCH_LIMIT),
    page: '1',
    output: 'json',
  });
  params.append('fl[]', 'identifier');
  params.append('fl[]', 'title');
  params.append('fl[]', 'creator');
  const data = await fetchJson<{ response?: { docs?: ArchiveDoc[] } }>(
    `https://archive.org/advancedsearch.php?${params.toString()}`,
    signal
  );
  const docs = data.response?.docs ?? [];
  const results = await Promise.allSettled(docs.map((doc) => toPlayableArchiveTrack(doc, signal)));

  const tracks: Track[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) tracks.push(result.value);
    if (result.status === 'rejected' && isAbortError(result.reason)) throw result.reason;
  }
  return tracks;
}

export async function searchOnlineCatalog(query: string, signal?: AbortSignal): Promise<OnlineSearchResult> {
  const [jamendo, archive] = await Promise.allSettled([
    searchJamendo(query, signal),
    searchArchive(query, signal),
  ]);

  if (signal?.aborted) throw new DOMException('Search cancelled', 'AbortError');

  if (jamendo.status === 'rejected' && archive.status === 'rejected') {
    throw new Error('Online sources could not be reached right now. Please try again.');
  }

  const tracks: Track[] = [];
  const warnings: string[] = [];

  if (jamendo.status === 'fulfilled') {
    tracks.push(...jamendo.value);
  } else if (!isAbortError(jamendo.reason)) {
    warnings.push('Jamendo could not be reached right now.');
  }

  if (archive.status === 'fulfilled') {
    tracks.push(...archive.value);
  } else if (!isAbortError(archive.reason)) {
    warnings.push('Internet Archive could not be reached right now.');
  }

  if (!JAMENDO_CLIENT_ID) {
    warnings.push('Jamendo is off: add VITE_JAMENDO_CLIENT_ID to enable it.');
  }

  return { tracks, warnings };
}
