'use client';

import React from 'react';
import {
  Sparkles,
  Music2,
  FolderPlus,
  Play,
  HardDrive,
  Upload,
  Globe2,
  Disc3,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Track, Playlist } from '@/lib/types';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { TrackItem } from '../TrackItem';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  recentlyPlayed: Track[];
  onOpenImport: () => void;
  onNavigateTab: (tab: string) => void;
  onAddToPlaylist: (track: Track) => void;
  onDeleteTrack: (track: Track) => void;
  storageUsage: string;
}

export function HomeView({
  tracks,
  playlists,
  recentlyPlayed,
  onOpenImport,
  onNavigateTab,
  onAddToPlaylist,
  onDeleteTrack,
  storageUsage,
}: HomeViewProps) {
  const { playTrack, isOnline } = useAudioPlayer();

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* Editorial Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#354BCB] text-white border-2 border-[#20252D] p-6 sm:p-8 shadow-[6px_6px_0px_#20252D]">
        {/* Background decorative vinyl shapes */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full border-8 border-white/10 pointer-events-none" />
        <div className="absolute right-16 -bottom-16 w-56 h-56 rounded-full border-8 border-white/10 pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#F5E94A] text-[#20252D] border border-[#20252D] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Local & Open-Source Music Sanctuary</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Your personal music library.
          </h1>
          <p className="mt-2 text-sm text-white/90 leading-relaxed">
            Offline-first, zero cloud tracking, and genuine player controls. Import your audio files or resolve official online streams with Discord-style commands.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFFEFA] text-[#20252D] font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#F5F2E8] transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#354BCB]" />
              <span>Import Music</span>
            </button>

            {tracks.length > 0 && (
              <button
                type="button"
                onClick={handlePlayAll}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F47768] text-white font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#e06758] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>Play All ({tracks.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('online')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl border border-white/40 hover:bg-white/30 transition-all cursor-pointer"
            >
              <Globe2 className="w-4 h-4" />
              <span>Resolve Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => onNavigateTab('library')}
          className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D] cursor-pointer hover:bg-[#F5F2E8] transition-colors"
        >
          <div className="flex items-center justify-between text-[#777777] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tracks</span>
            <Music2 className="w-4 h-4 text-[#354BCB]" />
          </div>
          <p className="text-2xl font-black text-[#20252D]">{tracks.length}</p>
        </div>

        <div
          onClick={() => onNavigateTab('library')}
          className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D] cursor-pointer hover:bg-[#F5F2E8] transition-colors"
        >
          <div className="flex items-center justify-between text-[#777777] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Playlists</span>
            <FolderPlus className="w-4 h-4 text-[#F47768]" />
          </div>
          <p className="text-2xl font-black text-[#20252D]">{playlists.length}</p>
        </div>

        <div
          onClick={() => onNavigateTab('settings')}
          className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D] cursor-pointer hover:bg-[#F5F2E8] transition-colors"
        >
          <div className="flex items-center justify-between text-[#777777] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Storage</span>
            <HardDrive className="w-4 h-4 text-[#777777]" />
          </div>
          <p className="text-2xl font-black text-[#20252D]">{storageUsage}</p>
        </div>

        <div className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]">
          <div className="flex items-center justify-between text-[#777777] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Network</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-[#354BCB]" />
            ) : (
              <WifiOff className="w-4 h-4 text-[#A8E6D8]" />
            )}
          </div>
          <p className="text-xl font-black text-[#20252D]">
            {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>

      {/* Main Content Sections: Recently Played or Empty State */}
      {tracks.length === 0 ? (
        <div className="p-8 sm:p-12 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center shadow-[4px_4px_0px_#20252D]">
          <div className="w-16 h-16 rounded-full bg-[#B9A6F2]/30 border-2 border-[#20252D] flex items-center justify-center mx-auto mb-3 text-[#354BCB]">
            <Disc3 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-[#20252D]">
            No music in your library yet
          </h3>
          <p className="text-xs text-[#777777] mt-1 max-w-sm mx-auto">
            Import your local MP3, WAV, FLAC, or M4A audio files to experience real offline playback without accounts.
          </p>
          <div className="mt-5">
            <button
              type="button"
              onClick={onOpenImport}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#354BCB] text-white font-extrabold text-sm rounded-2xl border-2 border-[#20252D] shadow-[3px_3px_0px_#20252D] hover:bg-[#2e41b0] cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import your first track</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[#20252D]">
                {recentlyPlayed.length > 0 ? 'Recently Played' : 'Library Highlights'}
              </h2>
              <p className="text-xs text-[#777777]">
                {recentlyPlayed.length > 0
                  ? 'Tracks you recently listened to'
                  : 'Quick access to your imported audio'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('library')}
              className="text-xs font-bold text-[#354BCB] hover:underline cursor-pointer"
            >
              View all ({tracks.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {(recentlyPlayed.length > 0 ? recentlyPlayed : tracks.slice(0, 6)).map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                allTracks={tracks}
                onDeleteTrack={onDeleteTrack}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
