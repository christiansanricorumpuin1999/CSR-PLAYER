'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Upload,
  Play,
  Trash2,
  FolderPlus,
  Music2,
  User,
  Disc,
  ArrowLeft,
} from 'lucide-react';
import { Track, Playlist } from '@/lib/types';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { TrackItem } from '../TrackItem';
import { OnlineResults } from '@/components/OnlineResults';
import { useOnlineSearch } from '@/lib/useOnlineSearch';

interface LibraryViewProps {
  tracks: Track[];
  playlists: Playlist[];
  onOpenImport: () => void;
  onOpenPlaylistModal: (track?: Track) => void;
  onDeleteTrack: (track: Track) => void;
  onDeleteMultipleTracks: (tracks: Track[]) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveFromPlaylist?: (playlistId: string, trackId: string) => void;
  onLibraryChanged: () => void;
  initialSubTab?: 'tracks' | 'playlists' | 'artists' | 'albums';
}

export function LibraryView({
  tracks,
  playlists,
  onOpenImport,
  onOpenPlaylistModal,
  onDeleteTrack,
  onDeleteMultipleTracks,
  onDeletePlaylist,
  onRemoveFromPlaylist,
  onLibraryChanged,
  initialSubTab = 'tracks',
}: LibraryViewProps) {
  const { playTrack } = useAudioPlayer();
  const [activeSubTab, setActiveSubTab] = useState<'tracks' | 'playlists' | 'artists' | 'albums'>(initialSubTab);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'artist' | 'duration' | 'addedAt'>('addedAt');
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [sourceFilter, setSourceFilter] = useState<'local' | 'online' | 'all'>('local');
  const showLocal = sourceFilter !== 'online';
  const showOnline = sourceFilter !== 'local';
  const online = useOnlineSearch(searchQuery, showOnline && activeSubTab === 'tracks');
  const localTrackIds = useMemo(() => new Set(tracks.map((t) => t.id)), [tracks]);

  // Filtered and sorted tracks
  const processedTracks = useMemo(() => {
    let result = [...tracks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.artist && t.artist.toLowerCase().includes(q)) ||
          (t.album && t.album.toLowerCase().includes(q)) ||
          (t.fileName && t.fileName.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'artist') return (a.artist || '').localeCompare(b.artist || '');
      if (sortBy === 'duration') return (b.duration || 0) - (a.duration || 0);
      return (b.addedAt || 0) - (a.addedAt || 0);
    });

    return result;
  }, [tracks, searchQuery, sortBy]);

  // Group by Artist
  const artistGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const t of tracks) {
      const artist = t.artist || 'Unknown Artist';
      if (!map.has(artist)) map.set(artist, []);
      map.get(artist)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tracks]);

  // Group by Album
  const albumGroups = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const t of tracks) {
      const album = t.album || 'Unknown Album';
      if (!map.has(album)) map.set(album, []);
      map.get(album)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [tracks]);

  const handleSelectAll = () => {
    if (selectedTrackIds.size === processedTracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(processedTracks.map((t) => t.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTrackIds.size === 0) return;
    const selected = tracks.filter((t) => selectedTrackIds.has(t.id));
    if (selected.length > 0) {
      onDeleteMultipleTracks(selected);
      setSelectedTrackIds(new Set());
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      {/* Top Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#20252D]">Music Library</h1>
          <p className="text-xs text-[#777777]">
            {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} stored locally in IndexedDB
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenImport}
            className="px-4 py-2 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#2e41b0] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Import Audio</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPlaylistModal()}
            className="px-4 py-2 bg-[#FFFEFA] text-[#20252D] text-xs font-bold rounded-xl border border-[#20252D] hover:bg-[#F5F2E8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-[#F47768]" />
            <span>New Playlist</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs pills */}
      <div className="flex items-center gap-2 border-b-2 border-[#20252D] pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('tracks')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeSubTab === 'tracks'
              ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
              : 'bg-[#FFFEFA] text-[#20252D] border-transparent hover:bg-[#F5F2E8]'
          }`}
        >
          All Tracks ({tracks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('playlists')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeSubTab === 'playlists'
              ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
              : 'bg-[#FFFEFA] text-[#20252D] border-transparent hover:bg-[#F5F2E8]'
          }`}
        >
          Playlists ({playlists.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('artists')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeSubTab === 'artists'
              ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
              : 'bg-[#FFFEFA] text-[#20252D] border-transparent hover:bg-[#F5F2E8]'
          }`}
        >
          Artists ({artistGroups.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('albums')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
            activeSubTab === 'albums'
              ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
              : 'bg-[#FFFEFA] text-[#20252D] border-transparent hover:bg-[#F5F2E8]'
          }`}
        >
          Albums ({albumGroups.length})
        </button>
      </div>

      {/* Subtab: All Tracks */}
      {activeSubTab === 'tracks' && (
        <div className="space-y-4">
          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists, albums, files..."
                className="w-full pl-9 pr-3 py-2 bg-[#FFFEFA] border-2 border-[#20252D] rounded-xl text-xs font-medium text-[#20252D] placeholder-[#777777] shadow-[2px_2px_0px_#20252D] focus:outline-hidden"
              />
            </div>

            <div role="group" aria-label="Music source" className="flex items-center gap-1 bg-[#FFFEFA] border-2 border-[#20252D] p-1 rounded-xl shadow-[2px_2px_0px_#20252D]">
              {(['local', 'online', 'all'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={sourceFilter === option}
                  onClick={() => setSourceFilter(option)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                    sourceFilter === option ? 'bg-[#354BCB] text-white' : 'text-[#20252D] hover:bg-[#F5F2E8]'
                  }`}
                >
                  {option === 'local' ? 'Local' : option === 'online' ? 'Online' : 'All'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#FFFEFA] border-2 border-[#20252D] px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-[2px_2px_0px_#20252D]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#354BCB]" />
                <span className="text-[#777777] text-[10px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-transparent font-bold text-[#20252D] focus:outline-hidden cursor-pointer"
                >
                  <option value="addedAt">Recently Added</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="artist">Artist</option>
                  <option value="duration">Duration</option>
                </select>
              </div>

              {processedTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => playTrack(processedTracks[0], processedTracks)}
                  className="px-3.5 py-2 bg-[#F47768] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#e06758] flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Play All</span>
                </button>
              )}
            </div>
          </div>

          {/* Bulk select action bar if tracks selected */}
          {selectedTrackIds.size > 0 && (
            <div className="p-2.5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-xl flex items-center justify-between text-xs font-bold shadow-[2px_2px_0px_#20252D]">
              <div className="flex items-center gap-2">
                <span>{selectedTrackIds.size} selected</span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#354BCB] hover:underline cursor-pointer"
                >
                  {selectedTrackIds.size === processedTracks.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3 py-1 bg-[#F47768] text-white rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}

          {/* Track list or Empty state */}
          {showLocal && processedTracks.length === 0 && !showOnline ? (
            <div className="p-8 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center shadow-[4px_4px_0px_#20252D]">
              <Music2 className="w-10 h-10 text-[#777777] mx-auto mb-2" />
              <h4 className="text-sm font-bold text-[#20252D]">
                {searchQuery ? 'No tracks matched your search' : 'No music in library'}
              </h4>
              <p className="text-xs text-[#777777] mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? 'Try searching with another keyword or clear the search bar.'
                  : 'Import local audio files to start listening.'}
              </p>
              {!searchQuery && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onOpenImport}
                    className="px-4 py-2 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] cursor-pointer"
                  >
                    Import Audio
                  </button>
                </div>
              )}
            </div>
          ) : showLocal && processedTracks.length > 0 ? (
            <div className="space-y-2">
              {processedTracks.map((track) => (
                <div key={track.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTrackIds.has(track.id)}
                    onChange={(e) => {
                      const next = new Set(selectedTrackIds);
                      if (e.target.checked) next.add(track.id);
                      else next.delete(track.id);
                      setSelectedTrackIds(next);
                    }}
                    aria-label={`Select ${track.title}`}
                    className="w-4 h-4 rounded-md border-2 border-[#20252D] accent-[#354BCB] cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <TrackItem
                      track={track}
                      allTracks={processedTracks}
                      onDeleteTrack={onDeleteTrack}
                      onAddToPlaylist={onOpenPlaylistModal}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {showOnline && (
            <OnlineResults
              query={searchQuery}
              search={online}
              localTrackIds={localTrackIds}
              onLibraryChanged={onLibraryChanged}
            />
          )}
        </div>
      )}

      {/* Subtab: Playlists */}
      {activeSubTab === 'playlists' && (
        <div className="space-y-4">
          {selectedPlaylistId ? (
            (() => {
              const currentPl = playlists.find((p) => p.id === selectedPlaylistId);
              if (!currentPl) {
                return (
                  <div className="p-8 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center">
                    <p className="text-xs text-[#777777]">Playlist not found.</p>
                    <button
                      type="button"
                      onClick={() => setSelectedPlaylistId(null)}
                      className="mt-3 px-3 py-1.5 bg-[#354BCB] text-white text-xs font-bold rounded-xl"
                    >
                      Back to Playlists
                    </button>
                  </div>
                );
              }
              const plTracks = tracks.filter((t) => currentPl.trackIds.includes(t.id));
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedPlaylistId(null)}
                      className="px-3 py-1.5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-[#F5F2E8] cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Playlists</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {plTracks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => playTrack(plTracks[0], plTracks)}
                          className="px-3.5 py-1.5 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Play All ({plTracks.length})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePlaylist(currentPl.id);
                          setSelectedPlaylistId(null);
                        }}
                        className="px-3 py-1.5 bg-[#FFFEFA] text-[#F47768] text-xs font-bold rounded-xl border border-[#F47768] hover:bg-[#F47768]/10 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Playlist</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]">
                    <h2 className="text-lg font-black text-[#20252D]">{currentPl.name}</h2>
                    <p className="text-xs text-[#777777] mt-0.5">
                      {plTracks.length} {plTracks.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>

                  {plTracks.length === 0 ? (
                    <div className="p-8 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center">
                      <Music2 className="w-8 h-8 text-[#777777] mx-auto mb-2" />
                      <p className="text-xs text-[#777777]">No tracks in this playlist yet.</p>
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('tracks')}
                        className="mt-3 px-3 py-1.5 bg-[#354BCB] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Browse Tracks to Add
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plTracks.map((track) => (
                        <TrackItem
                          key={track.id}
                          track={track}
                          allTracks={plTracks}
                          onDeleteTrack={onDeleteTrack}
                          onAddToPlaylist={onOpenPlaylistModal}
                          onRemoveFromPlaylist={
                            onRemoveFromPlaylist
                              ? (trackId) => onRemoveFromPlaylist(currentPl.id, trackId)
                              : undefined
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onOpenPlaylistModal()}
                  className="px-3.5 py-1.5 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Create Playlist</span>
                </button>
              </div>

              {playlists.length === 0 ? (
                <div className="p-8 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center shadow-[4px_4px_0px_#20252D]">
                  <FolderPlus className="w-10 h-10 text-[#777777] mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-[#20252D]">No playlists created yet</h4>
                  <p className="text-xs text-[#777777] mt-1">
                    Organize your imported tracks into custom playlists.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {playlists.map((pl) => {
                    const plTracks = tracks.filter((t) => pl.trackIds.includes(t.id));
                    return (
                      <div
                        key={pl.id}
                        className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D] flex flex-col justify-between hover:translate-y-[-1px] transition-transform"
                      >
                        <div
                          className="cursor-pointer"
                          onClick={() => setSelectedPlaylistId(pl.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="w-7 h-7 rounded-lg bg-[#F5E94A] border border-[#20252D] flex items-center justify-center text-[#20252D]">
                              <Music2 className="w-4 h-4" />
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePlaylist(pl.id);
                              }}
                              aria-label={`Delete playlist ${pl.name}`}
                              className="p-1 text-[#777777] hover:text-[#F47768] rounded-md transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <h3 className="font-extrabold text-sm text-[#20252D]">{pl.name}</h3>
                          <p className="text-xs text-[#777777] mt-0.5">
                            {plTracks.length} {plTracks.length === 1 ? 'track' : 'tracks'} (click to view)
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#F5F2E8] flex justify-between items-center">
                          <button
                            type="button"
                            onClick={() => setSelectedPlaylistId(pl.id)}
                            className="text-xs font-bold text-[#354BCB] hover:underline cursor-pointer"
                          >
                            View Tracks
                          </button>
                          <button
                            type="button"
                            disabled={plTracks.length === 0}
                            onClick={() => playTrack(plTracks[0], plTracks)}
                            className="px-3 py-1.5 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Play</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Subtab: Artists */}
      {activeSubTab === 'artists' && (
        <div className="space-y-4">
          {artistGroups.length === 0 ? (
            <div className="p-8 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center">
              <p className="text-xs text-[#777777]">No artists found in library yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {artistGroups.map(([artistName, artistTracks]) => (
                <div
                  key={artistName}
                  className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#B9A6F2] border border-[#20252D] flex items-center justify-center font-bold text-xs text-[#20252D]">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs truncate text-[#20252D]">{artistName}</h3>
                      <p className="text-[11px] text-[#777777]">
                        {artistTracks.length} {artistTracks.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => playTrack(artistTracks[0], artistTracks)}
                      aria-label={`Play songs by ${artistName}`}
                      className="p-2 rounded-xl bg-[#F5F2E8] border border-[#20252D] hover:bg-[#354BCB] hover:text-white transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab: Albums */}
      {activeSubTab === 'albums' && (
        <div className="space-y-4">
          {albumGroups.length === 0 ? (
            <div className="p-8 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center">
              <p className="text-xs text-[#777777]">No albums found in library yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {albumGroups.map(([albumName, albumTracks]) => (
                <div
                  key={albumName}
                  className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F5E94A] border border-[#20252D] flex items-center justify-center font-bold text-xs text-[#20252D]">
                      <Disc className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs truncate text-[#20252D]">{albumName}</h3>
                      <p className="text-[11px] text-[#777777]">
                        {albumTracks.length} {albumTracks.length === 1 ? 'track' : 'tracks'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => playTrack(albumTracks[0], albumTracks)}
                      aria-label={`Play album ${albumName}`}
                      className="p-2 rounded-xl bg-[#F5F2E8] border border-[#20252D] hover:bg-[#354BCB] hover:text-white transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
