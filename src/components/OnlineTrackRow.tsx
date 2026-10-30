import React, { useState } from 'react';
import { Play, ListPlus, Download, Check, Loader2 } from 'lucide-react';
import type { Track } from '@/lib/types';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { saveOnlineTrackToLibrary } from '@/lib/onlineLibrary';
import { formatTime } from '@/lib/formatTime';
import { ArtworkImage } from '@/components/ArtworkImage';

interface OnlineTrackRowProps {
  track: Track;
  isSaved: boolean;
  onLibraryChanged: () => void;
}

type BusyAction = 'play' | 'queue' | 'save' | null;

export function OnlineTrackRow({ track, isSaved, onLibraryChanged }: OnlineTrackRowProps) {
  const { playTrack, addToQueue } = useAudioPlayer();
  const [busy, setBusy] = useState<BusyAction>(null);

  const run = async (action: Exclude<BusyAction, null>, fn: () => Promise<void>) => {
    setBusy(action);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handlePlay = () =>
    run('play', async () => {
      await playTrack(track);
    });

  const handleQueue = () =>
    run('queue', async () => {
      addToQueue(track);
    });

  const handleSave = () =>
    run('save', async () => {
      await saveOnlineTrackToLibrary(track);
      onLibraryChanged();
    });

  const iconButton =
    'p-2 rounded-xl border-2 border-[#20252D] bg-[#FFFEFA] text-[#20252D] hover:bg-[#F5F2E8] disabled:opacity-50 transition-colors cursor-pointer';

  return (
    <div className="p-3 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]">
      <div className="flex items-center gap-3 min-w-0">
        <ArtworkImage
          src={track.artworkUrl}
          alt={track.title}
          className="w-12 h-12 rounded-xl border border-[#20252D] object-cover shrink-0"
          fallback={
            <div className="w-12 h-12 rounded-xl border border-[#20252D] bg-[#F5F2E8] flex items-center justify-center text-[10px] font-bold shrink-0">
              {track.title.slice(0, 2).toUpperCase()}
            </div>
          }
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-extrabold text-[#20252D] truncate">{track.title}</p>
          <p className="text-[11px] text-[#777777] truncate">
            {track.artist || 'Unknown Artist'}
            {track.duration ? ` • ${formatTime(track.duration)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={handlePlay} disabled={busy !== null} aria-label={`Play ${track.title}`} className={iconButton}>
            {busy === 'play' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          </button>
          <button type="button" onClick={handleQueue} disabled={busy !== null} aria-label={`Add ${track.title} to queue`} className={iconButton}>
            {busy === 'queue' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListPlus className="w-4 h-4" />}
          </button>
          {isSaved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#A8E6D8] border-2 border-[#20252D] text-[10px] font-black uppercase text-[#20252D]">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              disabled={busy !== null}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#354BCB] text-white text-[10px] font-black uppercase border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#2e41b0] disabled:opacity-50 transition-colors cursor-pointer"
            >
              {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Save to Library</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
