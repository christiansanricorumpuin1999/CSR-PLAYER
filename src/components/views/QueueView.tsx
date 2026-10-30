'use client';

import React from 'react';
import {
  ListMusic,
  Trash2,
  Shuffle,
  Play,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { formatTime } from '@/lib/formatTime';

export function QueueView({ onNavigateLibrary }: { onNavigateLibrary: () => void }) {
  const {
    queue,
    queueIndex,
    isShuffle,
    playTrack,
    clearQueue,
    removeFromQueue,
    reorderQueue,
    toggleShuffle,
  } = useAudioPlayer();

  const handleClear = () => {
    if (confirm('Clear all tracks from the playback queue?')) {
      clearQueue();
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#20252D]">Playback Queue</h1>
          <p className="text-xs text-[#777777]">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'} lined up for playback
          </p>
        </div>

        {queue.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                isShuffle
                  ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
                  : 'bg-[#FFFEFA] text-[#20252D] border-[#20252D] hover:bg-[#F5F2E8]'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Shuffle {isShuffle ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-1.5 bg-[#FFFEFA] text-[#F47768] text-xs font-bold rounded-xl border-2 border-[#20252D] hover:bg-[#F47768]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Queue</span>
            </button>
          </div>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="p-8 sm:p-12 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center shadow-[4px_4px_0px_#20252D]">
          <div className="w-16 h-16 rounded-full bg-[#B9A6F2]/30 border-2 border-[#20252D] flex items-center justify-center mx-auto mb-3 text-[#354BCB]">
            <ListMusic className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-[#20252D]">Queue is empty</h3>
          <p className="text-xs text-[#777777] mt-1 max-w-sm mx-auto">
            Add tracks from your local library, or type <code className="font-mono bg-[#F5F2E8] px-1 rounded text-[#20252D]">/add &lt;url&gt;</code> in the command bar above.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={onNavigateLibrary}
              className="px-4 py-2 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] cursor-pointer"
            >
              Go to Library
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((item, index) => {
            const isPlayingThis = index === queueIndex;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all ${
                  isPlayingThis
                    ? 'bg-[#354BCB]/10 border-[#354BCB] shadow-[2px_2px_0px_#354BCB]'
                    : 'bg-[#FFFEFA] border-[#20252D] hover:bg-[#F5F2E8]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-6 text-center text-xs font-mono font-bold text-[#777777]">
                    {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => playTrack(item.track)}
                    aria-label={`Play ${item.track.title}`}
                    className={`w-8 h-8 rounded-lg border border-[#20252D] flex items-center justify-center shrink-0 cursor-pointer ${
                      isPlayingThis
                        ? 'bg-[#354BCB] text-white'
                        : 'bg-[#F5F2E8] text-[#20252D] hover:bg-[#354BCB] hover:text-white'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 ml-0.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <h4
                      className={`text-xs sm:text-sm font-bold truncate ${
                        isPlayingThis ? 'text-[#354BCB]' : 'text-[#20252D]'
                      }`}
                    >
                      {item.track.title}
                    </h4>
                    <p className="text-[11px] text-[#777777] truncate">
                      {item.track.artist || 'Unknown Artist'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-[#777777] mr-1 hidden sm:inline">
                    {item.track.duration ? formatTime(item.track.duration) : '--:--'}
                  </span>

                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => reorderQueue(index, index - 1)}
                    aria-label="Move track up in queue"
                    className="p-1 text-[#777777] hover:text-[#20252D] disabled:opacity-30 rounded cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={index === queue.length - 1}
                    onClick={() => reorderQueue(index, index + 1)}
                    aria-label="Move track down in queue"
                    className="p-1 text-[#777777] hover:text-[#20252D] disabled:opacity-30 rounded cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeFromQueue(item.id)}
                    aria-label={`Remove ${item.track.title} from queue`}
                    className="p-1 text-[#777777] hover:text-[#F47768] rounded cursor-pointer ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
