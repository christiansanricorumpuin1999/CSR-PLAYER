import { getTrack, saveTrack } from '@/lib/db';
import type { Track } from '@/lib/types';

async function downloadBlob(url: string): Promise<Blob> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("This track's host does not allow downloads from this site, so it cannot be saved offline.");
  }
  if (!res.ok) throw new Error(`The audio could not be downloaded (status ${res.status}).`);
  return res.blob();
}

export async function saveOnlineTrackToLibrary(track: Track): Promise<void> {
  if (await getTrack(track.id)) return;

  if (!track.sourceUrl) throw new Error('This track has no audio link.');

  const audio = await downloadBlob(track.sourceUrl);
  if (audio.size === 0) throw new Error('The downloaded audio file is empty.');

  let artworkBlob: Blob | undefined;
  if (track.artworkUrl) {
    try {
      const art = await fetch(track.artworkUrl);
      if (art.ok) artworkBlob = await art.blob();
    } catch {
      artworkBlob = undefined;
    }
  }

  await saveTrack({
    ...track,
    source: 'local',
    sourceUrl: undefined,
    localBlob: audio,
    mimeType: audio.type || undefined,
    fileName: `${track.title}.mp3`,
    fileSize: audio.size,
    artworkBlob,
    artworkUrl: undefined,
    isFavorite: false,
    addedAt: Date.now(),
  });
}
