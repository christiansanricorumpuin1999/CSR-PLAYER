export interface ParsedMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  artworkBlob?: Blob;
  year?: string;
  hasEmbeddedMetadata: boolean;
}

/**
 * Extracts ID3v2 tags (TIT2, TPE1, TALB, APIC) from an ArrayBuffer
 */
export function parseID3v2(buffer: ArrayBuffer): Partial<ParsedMetadata> {
  const view = new DataView(buffer);
  if (view.byteLength < 10) return {};

  // Check 'ID3' magic
  if (view.getUint8(0) !== 0x49 || view.getUint8(1) !== 0x44 || view.getUint8(2) !== 0x33) {
    return {};
  }

  const version = view.getUint8(3); // e.g., 3 for ID3v2.3, 4 for ID3v2.4
  if (version !== 3 && version !== 4) return {};

  // Synchsafe size of header
  const size =
    ((view.getUint8(6) & 0x7f) << 21) |
    ((view.getUint8(7) & 0x7f) << 14) |
    ((view.getUint8(8) & 0x7f) << 7) |
    (view.getUint8(9) & 0x7f);

  let offset = 10;
  const end = Math.min(offset + size, view.byteLength);

  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let artworkBlob: Blob | undefined;

  const decoderUtf8 = new TextDecoder('utf-8');
  const decoderIso = new TextDecoder('iso-8859-1');
  const decoderUtf16 = new TextDecoder('utf-16le');

  const decodeString = (bytes: Uint8Array, encodingByte: number): string => {
    let str = '';
    if (encodingByte === 0) {
      str = decoderIso.decode(bytes);
    } else if (encodingByte === 1 || encodingByte === 2) {
      // utf-16 with BOM or without
      str = decoderUtf16.decode(bytes);
    } else if (encodingByte === 3) {
      str = decoderUtf8.decode(bytes);
    } else {
      str = decoderUtf8.decode(bytes);
    }
    return str.replace(/\0+$/, '').trim();
  };

  while (offset + 10 <= end) {
    // Read 4-byte frame ID
    const frameIdBytes = new Uint8Array(buffer, offset, 4);
    const frameId = String.fromCharCode(...frameIdBytes);
    // If empty padding reached
    if (frameIdBytes[0] === 0) break;

    let frameSize = 0;
    if (version === 4) {
      // synchsafe in v2.4
      frameSize =
        ((view.getUint8(offset + 4) & 0x7f) << 21) |
        ((view.getUint8(offset + 5) & 0x7f) << 14) |
        ((view.getUint8(offset + 6) & 0x7f) << 7) |
        (view.getUint8(offset + 7) & 0x7f);
    } else {
      // standard 32-bit int in v2.3
      frameSize = view.getUint32(offset + 4, false);
    }

    if (frameSize <= 0 || offset + 10 + frameSize > buffer.byteLength) {
      break;
    }

    const frameDataOffset = offset + 10;
    const encodingByte = view.getUint8(frameDataOffset);
    const dataBytes = new Uint8Array(buffer, frameDataOffset + 1, Math.max(0, frameSize - 1));

    if (frameId === 'TIT2') {
      title = decodeString(dataBytes, encodingByte);
    } else if (frameId === 'TPE1') {
      artist = decodeString(dataBytes, encodingByte);
    } else if (frameId === 'TALB') {
      album = decodeString(dataBytes, encodingByte);
    } else if (frameId === 'APIC') {
      // Attached picture: [encoding][mime null-terminated][pic-type 1b][desc null-terminated][data]
      try {
        let mimeEnd = frameDataOffset + 1;
        while (mimeEnd < frameDataOffset + frameSize && view.getUint8(mimeEnd) !== 0) {
          mimeEnd++;
        }
        const mimeBytes = new Uint8Array(buffer, frameDataOffset + 1, mimeEnd - (frameDataOffset + 1));
        let mime = decoderIso.decode(mimeBytes) || 'image/jpeg';
        if (mime === '-->') mime = 'image/jpeg';

        let picOffset = mimeEnd + 2; // skip mime null and 1 byte picture type
        // Skip description
        if (encodingByte === 1 || encodingByte === 2) {
          // 2-byte null terminator for utf-16
          while (picOffset + 1 < frameDataOffset + frameSize) {
            if (view.getUint8(picOffset) === 0 && view.getUint8(picOffset + 1) === 0) {
              picOffset += 2;
              break;
            }
            picOffset += 2;
          }
        } else {
          while (picOffset < frameDataOffset + frameSize && view.getUint8(picOffset) !== 0) {
            picOffset++;
          }
          picOffset += 1;
        }

        if (picOffset < frameDataOffset + frameSize) {
          const imgBytes = new Uint8Array(buffer, picOffset, frameDataOffset + frameSize - picOffset);
          artworkBlob = new Blob([imgBytes], { type: mime });
        }
      } catch {
        // failed reading artwork
      }
    }

    offset += 10 + frameSize;
  }

  return { title, artist, album, artworkBlob };
}

/**
 * Clean fallback title from filename
 */
export function cleanTitleFromFilename(fileName: string): string {
  // Strip extension
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');
  // Replace underscores and excessive spaces
  return withoutExt.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Get accurate audio duration via HTMLAudioElement
 */
export function getAudioDuration(file: Blob): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(0);
      return;
    }
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';

    const cleanUp = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
    };

    const onLoaded = () => {
      const dur = audio.duration;
      cleanUp();
      resolve(isNaN(dur) || !isFinite(dur) ? 0 : Math.round(dur));
    };

    const onError = () => {
      cleanUp();
      resolve(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;

    // Timeout safety 3 seconds
    setTimeout(() => {
      cleanUp();
      resolve(0);
    }, 3000);
  });
}

/**
 * Main metadata parser for user-imported audio files
 */
export async function parseAudioFile(file: File): Promise<ParsedMetadata> {
  let title: string | undefined;
  let artist: string | undefined;
  let album: string | undefined;
  let artworkBlob: Blob | undefined;
  let hasEmbeddedMetadata = false;

  try {
    // Read first 256KB to inspect headers
    const headerSlice = file.slice(0, Math.min(256 * 1024, file.size));
    const buffer = await headerSlice.arrayBuffer();
    const id3 = parseID3v2(buffer);

    if (id3.title) {
      title = id3.title;
      hasEmbeddedMetadata = true;
    }
    if (id3.artist) {
      artist = id3.artist;
      hasEmbeddedMetadata = true;
    }
    if (id3.album) {
      album = id3.album;
      hasEmbeddedMetadata = true;
    }
    if (id3.artworkBlob) {
      artworkBlob = id3.artworkBlob;
    }
  } catch {
    // header parse failure
  }

  // Fallback to filename if title is empty
  if (!title || title.trim() === '') {
    title = cleanTitleFromFilename(file.name);
  }

  // Get real duration
  const duration = await getAudioDuration(file);

  return {
    title,
    artist: artist?.trim() || undefined,
    album: album?.trim() || undefined,
    duration,
    artworkBlob,
    hasEmbeddedMetadata,
  };
}
