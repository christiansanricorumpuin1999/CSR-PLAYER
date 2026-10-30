'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Heart,
  Trash2,
  MoreVertical,
  ListPlus,
  FolderPlus,
  ExternalLink,
} from 'lucide-react';
import { Track } from '@/lib/types';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { ArtworkImage } from '@/components/ArtworkImage';
import { formatTime } from '@/lib/formatTime';

interface TrackItemProps {
  track: Track;
  allTracks?: Track[];
  onDeleteTrack?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onRemoveFromPlaylist?: (trackId: string) => void;
  showDelete?: boolean;
}

export function TrackItem({
  track,
  allTracks,
  onDeleteTrack,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  showDelete = true,
}: TrackItemProps) {
  const { currentTrack, status, playTrack, togglePlayPause, toggleFavorite, addToQueue } =
    useAudioPlayer();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const isCurrent = currentTrack?.id === track.id;
  const isPlaying = isCurrent && status === 'playing';

  const handlePlayClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track, allTracks);
    }
  };

  const getSourceBadge = () => {
    switch (track.source) {
      case 'local':
        return { label: 'LOCAL', color: 'bg-[#A8E6D8] text-[#20252D]' };
      default:
        return { label: 'WEB', color: 'bg-[#B9A6F2] text-[#20252D]' };
    }
  };

  const badge = getSourceBadge();

  return (
    <div
      className={`group relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all ${
        isCurrent
          ? 'bg-[#354BCB]/5 border-[#354BCB] shadow-[2px_2px_0px_#354BCB]'
          : 'bg-[#FFFEFA] border-[#20252D] hover:bg-[#F5F2E8] shadow-[2px_2px_0px_#20252D]'
      }`}
    >
      {/* Left: Play button, Artwork, Title & Artist */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={handlePlayClick}
          aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className={`w-9 h-9 rounded-xl border-2 border-[#20252D] flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
            isCurrent
              ? 'bg-[#354BCB] text-white shadow-[2px_2px_0px_#20252D]'
              : 'bg-[#F5F2E8] text-[#20252D] group-hover:bg-[#354BCB] group-hover:text-white'
          }`}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Thumbnail Artwork */}
        <div className="relative w-10 h-10 rounded-xl border border-[#20252D] bg-[#F5F2E8] overflow-hidden shrink-0">
          <ArtworkImage
            src={track.artworkUrl}
            alt={track.title}
            className="w-full h-full object-cover"
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-[#B9A6F2] text-xs font-black text-[#20252D]">
                {track.title.slice(0, 2).toUpperCase()}
              </div>
            }
          />
          <span
            className={`absolute bottom-0.5 right-0.5 text-[7px] font-black px-1 rounded-sm border border-[#20252D] ${badge.color}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className={`text-xs sm:text-sm font-bold truncate ${
                isCurrent ? 'text-[#354BCB]' : 'text-[#20252D]'
              }`}
            >
              {track.title}
            </h4>
          </div>
          <p className="text-[11px] text-[#777777] truncate">
            {track.artist || 'Unknown Artist'}
            {track.album ? ` • ${track.album}` : ''}
          </p>
        </div>
      </div>

      {/* Right: Duration, Favorite, Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline-block text-xs font-mono text-[#777777]">
          {track.duration && track.duration > 0 ? formatTime(track.duration) : '--:--'}
        </span>

        <button
          type="button"
          onClick={() => toggleFavorite(track.id)}
          aria-label={track.isFavorite ? 'Remove favorite' : 'Add favorite'}
          className="p-1.5 text-[#777777] hover:text-[#F47768] transition-colors cursor-pointer"
        >
          <Heart
            className={`w-4 h-4 ${
              track.isFavorite ? 'fill-[#F47768] text-[#F47768]' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={() => addToQueue(track)}
          title="Add to Play Queue"
          aria-label={`Add ${track.title} to play queue`}
          className="p-1.5 text-[#777777] hover:text-[#354BCB] transition-colors cursor-pointer"
        >
          <ListPlus className="w-4 h-4" />
        </button>

        {/* Dropdown menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            aria-label="Track options menu"
            className="p-1.5 text-[#777777] hover:text-[#20252D] rounded-lg transition-colors cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 z-30 w-44 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl p-1.5 shadow-[4px_4px_0px_#20252D]">
              {onAddToPlaylist && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onAddToPlaylist(track);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#20252D] hover:bg-[#F5F2E8] rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#354BCB]" />
                  <span>Add to playlist</span>
                </button>
              )}

              {onRemoveFromPlaylist && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onRemoveFromPlaylist(track.id);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#20252D] hover:bg-[#F5F2E8] rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-[#777777]" />
                  <span>Remove from playlist</span>
                </button>
              )}

              {track.sourceUrl && (
                <a
                  href={track.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowMenu(false)}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#20252D] hover:bg-[#F5F2E8] rounded-xl flex items-center gap-2"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#777777]" />
                  <span>Open source link</span>
                </a>
              )}

              {showDelete && onDeleteTrack && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteTrack(track);
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-[#F47768] hover:bg-[#F47768]/10 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete from library</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
