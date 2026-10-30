'use client';

import React from 'react';
import { Heart, Play } from 'lucide-react';
import { Track } from '@/lib/types';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { TrackItem } from '../TrackItem';

interface FavoritesViewProps {
  tracks: Track[];
  onOpenImport: () => void;
  onAddToPlaylist: (track: Track) => void;
  onDeleteTrack: (track: Track) => void;
}

export function FavoritesView({
  tracks,
  onAddToPlaylist,
  onDeleteTrack,
}: FavoritesViewProps) {
  const { playTrack } = useAudioPlayer();
  const favoriteTracks = tracks.filter((t) => t.isFavorite);

  const handlePlayFavorites = () => {
    if (favoriteTracks.length > 0) {
      playTrack(favoriteTracks[0], favoriteTracks);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#20252D] flex items-center gap-2">
            <span>Favorite Tracks</span>
            <Heart className="w-5 h-5 fill-[#F47768] text-[#F47768]" />
          </h1>
          <p className="text-xs text-[#777777]">
            {favoriteTracks.length} {favoriteTracks.length === 1 ? 'track' : 'tracks'} favorited
          </p>
        </div>

        {favoriteTracks.length > 0 && (
          <button
            type="button"
            onClick={handlePlayFavorites}
            className="px-4 py-2 bg-[#F47768] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#e06758] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Play Favorites</span>
          </button>
        )}
      </div>

      {favoriteTracks.length === 0 ? (
        <div className="p-8 sm:p-12 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center shadow-[4px_4px_0px_#20252D]">
          <div className="w-16 h-16 rounded-full bg-[#F47768]/20 border-2 border-[#20252D] flex items-center justify-center mx-auto mb-3 text-[#F47768]">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-[#20252D]">No favorites yet</h3>
          <p className="text-xs text-[#777777] mt-1 max-w-sm mx-auto">
            Tap the heart icon on any song in your library or now playing screen to add it to your favorites.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {favoriteTracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              allTracks={favoriteTracks}
              onDeleteTrack={onDeleteTrack}
              onAddToPlaylist={onAddToPlaylist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
