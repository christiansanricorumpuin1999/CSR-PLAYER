'use client';

import React from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Disc3,
  ExternalLink,
} from 'lucide-react';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { formatTime } from '@/lib/formatTime';
import { ArtworkImage } from '@/components/ArtworkImage';

export function FullPlayer() {
  const {
    currentTrack,
    status,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isFullPlayerOpen,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    setRepeatMode,
    closeFullPlayer,
    toggleFavorite,
    errorMessage,
  } = useAudioPlayer();

  if (!isFullPlayerOpen || !currentTrack) return null;

  const isPlaying = status === 'playing';
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const cycleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-track-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeFullPlayer();
      }}
      className="fixed inset-0 z-50 bg-[#20252D]/70 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="relative w-full max-w-lg bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl p-6 shadow-[8px_8px_0px_#20252D] flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={closeFullPlayer}
            aria-label="Collapse player"
            className="p-2 rounded-2xl bg-[#F5F2E8] border border-[#20252D] text-[#20252D] hover:bg-[#eae4d3] transition-colors cursor-pointer"
          >
            <ChevronDown className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F5E94A] text-[#20252D] border border-[#20252D]">
              NOW PLAYING
            </span>
            {currentTrack.source === 'local' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#A8E6D8] text-[#20252D] border border-[#20252D]">
                OFFLINE AUDIO
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(currentTrack.id)}
            aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-2 rounded-2xl bg-[#F5F2E8] border border-[#20252D] text-[#20252D] hover:text-[#F47768] transition-colors cursor-pointer"
          >
            <Heart
              className={`w-5 h-5 ${
                currentTrack.isFavorite ? 'fill-[#F47768] text-[#F47768]' : ''
              }`}
            />
          </button>
        </div>

        {/* Artwork area */}
        <div className="my-2 flex-1 flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-3xl border-2 border-[#20252D] bg-[#F5F2E8] overflow-hidden shadow-[6px_6px_0px_#20252D] flex items-center justify-center group">
            {currentTrack.artworkUrl ? (
              <ArtworkImage
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-[#B9A6F2] text-[#20252D] font-black text-xl">
                    {currentTrack.title.slice(0, 2).toUpperCase()}
                  </div>
                }
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#B9A6F2] text-[#20252D] p-6 text-center">
                <div
                  className={`w-24 h-24 rounded-full bg-[#FFFEFA] border-2 border-[#20252D] flex items-center justify-center mb-3 shadow-[2px_2px_0px_#20252D] ${
                    isPlaying ? 'animate-spin' : ''
                  }`}
                  style={{ animationDuration: '8s' }}
                >
                  <Disc3 className="w-12 h-12 text-[#354BCB]" />
                </div>
                <span className="text-xl font-black uppercase tracking-wider">
                  {currentTrack.title.slice(0, 3)}
                </span>
              </div>
            )}

            {/* Decorative vinyl groove ring overlay */}
            <div className="absolute inset-4 rounded-full border border-[#20252D]/10 pointer-events-none" />
            <div className="absolute inset-12 rounded-full border border-[#20252D]/10 pointer-events-none" />

            {/* Playful Sticker Badge */}
            <div className="absolute bottom-3 left-3 bg-[#F5E94A] border border-[#20252D] text-[#20252D] px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider rotate-[-4deg] shadow-[2px_2px_0px_#20252D]">
              {currentTrack.source === 'local' ? '100% OFFLINE' : 'STREAM'}
            </div>
          </div>
        </div>

        {/* Track details */}
        <div className="mt-4 text-center">
          <h2
            id="player-track-title"
            className="text-xl md:text-2xl font-black text-[#20252D] tracking-tight truncate px-2"
          >
            {currentTrack.title}
          </h2>
          <p className="text-sm font-semibold text-[#777777] mt-0.5 truncate">
            {currentTrack.artist || 'Unknown Artist'}
            {currentTrack.album ? ` • ${currentTrack.album}` : ''}
          </p>

          {currentTrack.source === 'stream' && currentTrack.sourceUrl && (
            <div className="mt-1 flex justify-center">
              <a
                href={currentTrack.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#354BCB] font-bold hover:underline"
              >
                <span>Open source link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
          {errorMessage && (
            <p role="alert" className="mt-2 text-xs font-semibold text-[#B3261E]">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Timeline seekbar */}
        <div className="mt-5 space-y-1">
          <div
            className="relative w-full h-3 bg-[#F5F2E8] border border-[#20252D] rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPos = (e.clientX - rect.left) / rect.width;
              seek(clickPos * duration);
            }}
          >
            <div
              className="h-full bg-[#354BCB] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[#777777]">
            <span>{formatTime(currentTime)}</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Main playback control buttons */}
        <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={toggleShuffle}
            aria-label="Toggle shuffle"
            className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
              isShuffle
                ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
                : 'bg-[#FFFEFA] text-[#20252D] border-transparent hover:bg-[#F5F2E8]'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={skipPrevious}
            aria-label="Previous track"
            className="p-3 rounded-2xl bg-[#FFFEFA] border-2 border-[#20252D] text-[#20252D] hover:bg-[#F5F2E8] shadow-[2px_2px_0px_#20252D] transition-transform active:scale-95 cursor-pointer"
          >
            <SkipBack className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-16 h-16 rounded-full bg-[#354BCB] text-white border-2 border-[#20252D] flex items-center justify-center shadow-[4px_4px_0px_#20252D] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>

          <button
            type="button"
            onClick={skipNext}
            aria-label="Next track"
            className="p-3 rounded-2xl bg-[#FFFEFA] border-2 border-[#20252D] text-[#20252D] hover:bg-[#F5F2E8] shadow-[2px_2px_0px_#20252D] transition-transform active:scale-95 cursor-pointer"
          >
            <SkipForward className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={cycleRepeat}
            aria-label={`Repeat mode: ${repeatMode}`}
            className={`p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
              repeatMode !== 'off'
                ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
                : 'bg-[#FFFEFA] text-[#20252D] border-transparent hover:bg-[#F5F2E8]'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Volume controls */}
        <div className="mt-6 flex items-center justify-center gap-3 px-4">
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="p-1.5 text-[#20252D] hover:bg-[#F5F2E8] rounded-xl transition-colors cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume slider"
            className="w-full max-w-xs h-2 bg-[#F5F2E8] border border-[#20252D] rounded-lg appearance-none cursor-pointer accent-[#354BCB]"
          />
        </div>
      </div>
    </div>
  );
}
