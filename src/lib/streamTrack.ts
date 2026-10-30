import type { Track } from './types';

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];

export const SUPPORTED_AUDIO_FORMATS = 'MP3, WAV, OGG, M4A, AAC, or FLAC';

export function isDirectAudioUrl(urlStr: string): boolean {
  try {
    const path = new URL(urlStr).pathname.toLowerCase();
    return AUDIO_EXTENSIONS.some((ext) => path.endsWith(ext));
  } catch {
    return false;
  }
}

// FNV-1a: a stable id per URL so the same link maps to one library entry
function hashUrl(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

function readableFileName(pathname: string): string {
  const raw = pathname.split('/').pop() || '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function createStreamTrack(input: string): { ok: true; track: Track } | { ok: false; error: string } {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { ok: false, error: 'That is not a valid web address.' };
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'Only http:// and https:// audio links are supported.' };
  }

  if (!isDirectAudioUrl(url.toString())) {
    return {
      ok: false,
      error: `That link does not point directly to an audio file. Paste a direct link to a ${SUPPORTED_AUDIO_FORMATS} file.`,
    };
  }

  const fileName = readableFileName(url.pathname);
  const title = fileName.replace(/\.[^.]+$/, '') || url.hostname;

  return {
    ok: true,
    track: {
      id: `stream_${hashUrl(url.toString())}`,
      title,
      artist: url.hostname,
      source: 'stream',
      sourceUrl: url.toString(),
      fileName,
      addedAt: Date.now(),
      isFavorite: false,
    },
  };
}
