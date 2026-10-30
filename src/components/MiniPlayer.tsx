'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Heart,
  Maximize2,
  ListMusic,
} from 'lucide-react';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { ArtworkImage } from '@/components/ArtworkImage';
import { formatTime } from '@/lib/formatTime';

export function MiniPlayer({ onNavigateQueue }: { onNavigateQueue?: () => void }) {
  const {
    currentTrack,
    status,
    currentTime,
    duration,
    volume,
    isMuted,
    togglePlayPause,
    skipNext,
    skipPrevious,
    seek,
    setVolume,
    toggleMute,
    openFullPlayer,
    toggleFavorite,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const isPlaying = status === 'playing';
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const getSourceBadge = () => {
    switch (currentTrack.source) {
      case 'local':
        return { label: 'LOCAL', bg: 'bg-[#A8E6D8]', text: 'text-[#20252D]' };
      default:
        return { label: 'ONLINE', bg: 'bg-[#B9A6F2]', text: 'text-[#20252D]' };
    }
  };

  const badge = getSourceBadge();

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 bg-[#FFFEFA] border-t-2 border-[#20252D] px-3 py-2.5 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
      {/* Top progress seek line */}
      <div
        className="absolute -top-1.5 left-0 right-0 h-2 bg-[#F5F2E8] hover:h-3 transition-all cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickPos = (e.clientX - rect.left) / rect.width;
          seek(clickPos * duration);
        }}
      >
        <div
          className="h-full bg-[#354BCB] transition-all relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#20252D] border border-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Track Information */}
        <div
          className="flex items-center gap-3 min-w-0 flex-1 max-w-xs md:max-w-sm cursor-pointer"
          onClick={openFullPlayer}
          title="Click to expand player"
        >
          <div className="relative w-12 h-12 rounded-xl border-2 border-[#20252D] bg-[#F5F2E8] overflow-hidden shrink-0 shadow-[2px_2px_0px_#20252D]">
            <ArtworkImage
              src={currentTrack.artworkUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-[#B9A6F2] font-black text-sm text-[#20252D]">
                  {currentTrack.title.slice(0, 2).toUpperCase()}
                </div>
              }
            />
            <span
              className={`absolute bottom-0.5 right-0.5 text-[8px] font-black px-1 rounded-sm border border-[#20252D] ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs md:text-sm font-bold text-[#20252D] truncate">
                {currentTrack.title}
              </h4>
            </div>
            <p className="text-[11px] text-[#777777] truncate">
              {currentTrack.artist || 'Unknown Artist'}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(currentTrack.id);
            }}
            aria-label={currentTrack.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="p-1 text-[#777777] hover:text-[#F47768] transition-colors"
          >
            <Heart
              className={`w-4 h-4 ${
                currentTrack.isFavorite ? 'fill-[#F47768] text-[#F47768]' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Controls & Equalizer */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={skipPrevious}
              aria-label="Previous track"
              className="p-1.5 text-[#20252D] hover:bg-[#F5F2E8] rounded-xl transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-9 h-9 rounded-full bg-[#354BCB] text-white border-2 border-[#20252D] flex items-center justify-center shadow-[2px_2px_0px_#20252D] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={skipNext}
              aria-label="Next track"
              className="p-1.5 text-[#20252D] hover:bg-[#F5F2E8] rounded-xl transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Visual Equalizer */}
            <div
              className="hidden sm:flex items-end gap-1 h-5 px-2 py-1 bg-[#F5F2E8] rounded-lg border border-[#343434]"
              title={isPlaying ? 'Equalizer active' : 'Audio paused'}
            >
              <span
                className={`w-1 bg-[#354BCB] rounded-full ${
                  isPlaying ? 'animate-eq-1' : 'h-1'
                }`}
              />
              <span
                className={`w-1 bg-[#F47768] rounded-full ${
                  isPlaying ? 'animate-eq-2' : 'h-2'
                }`}
              />
              <span
                className={`w-1 bg-[#354BCB] rounded-full ${
                  isPlaying ? 'animate-eq-3' : 'h-1.5'
                }`}
              />
              <span
                className={`w-1 bg-[#F5E94A] rounded-full ${
                  isPlaying ? 'animate-eq-4' : 'h-1'
                }`}
              />
            </div>
          </div>

          {/* Time indicator */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-[#777777]">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Right: Volume & Expand */}
        <div className="flex items-center gap-3">
          {/* Volume slider on desktop */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="text-[#20252D] p-1"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
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
              className="w-16 h-1.5 bg-[#F5F2E8] border border-[#343434] rounded-lg appearance-none cursor-pointer accent-[#354BCB]"
            />
          </div>

          {onNavigateQueue && (
            <button
              type="button"
              onClick={onNavigateQueue}
              aria-label="View Queue"
              className="p-1.5 text-[#20252D] hover:bg-[#F5F2E8] rounded-xl border border-[#20252D] cursor-pointer"
            >
              <ListMusic className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={openFullPlayer}
            aria-label="Expand full screen player"
            className="p-1.5 text-[#20252D] hover:bg-[#F5F2E8] rounded-xl border border-[#20252D] shadow-[1px_1px_0px_#20252D] cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
