'use client';

import React, { useState } from 'react';
import { Trash2, X, Check, ListMusic, Plus } from 'lucide-react';
import { Playlist, Track } from '@/lib/types';
import { addTrackToPlaylist, savePlaylist, deletePlaylist } from '@/lib/db';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  trackToAdd?: Track | null;
  onRefreshPlaylists: () => void;
}

export function PlaylistModal({
  isOpen,
  onClose,
  playlists,
  trackToAdd,
  onRefreshPlaylists,
}: PlaylistModalProps) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: newPlaylistName.trim(),
      trackIds: trackToAdd ? [trackToAdd.id] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await savePlaylist(newPlaylist);
    setNewPlaylistName('');
    setFeedback(`Created playlist "${newPlaylist.name}"`);
    onRefreshPlaylists();
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleAddToExisting = async (playlist: Playlist) => {
    if (!trackToAdd) return;
    await addTrackToPlaylist(playlist.id, trackToAdd.id);
    setFeedback(`Added "${trackToAdd.title}" to "${playlist.name}"`);
    onRefreshPlaylists();
    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1500);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete playlist "${name}"? Tracks will remain in your library.`)) {
      await deletePlaylist(id);
      onRefreshPlaylists();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-dialog-title"
      className="fixed inset-0 z-50 bg-[#20252D]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl p-6 shadow-[6px_6px_0px_#20252D] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F2E8]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F5E94A] border border-[#20252D] text-[#20252D]">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h2 id="playlist-dialog-title" className="text-base font-black text-[#20252D]">
                {trackToAdd ? 'Add to Playlist' : 'Manage Playlists'}
              </h2>
              {trackToAdd && (
                <p className="text-xs text-[#777777] truncate max-w-[220px]">
                  Track: {trackToAdd.title}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-[#777777] hover:text-[#20252D] rounded-xl hover:bg-[#F5F2E8] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#A8E6D8] border border-[#20252D] text-xs font-bold text-[#20252D] flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Create new playlist form */}
        <form onSubmit={handleCreatePlaylist} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New playlist name..."
            className="flex-1 px-3 py-2 bg-[#F5F2E8] border-2 border-[#20252D] rounded-xl text-xs font-bold text-[#20252D] placeholder-[#777777] focus:outline-hidden"
          />
          <button
            type="submit"
            disabled={!newPlaylistName.trim()}
            className="px-3.5 py-2 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] disabled:opacity-40 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
          </button>
        </form>

        {/* Playlists list */}
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#777777]">
              No playlists created yet. Create your first playlist above.
            </div>
          ) : (
            playlists.map((pl) => (
              <div
                key={pl.id}
                className="flex items-center justify-between p-2.5 bg-[#FFFEFA] border border-[#20252D] rounded-2xl hover:bg-[#F5F2E8] transition-colors"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => (trackToAdd ? handleAddToExisting(pl) : null)}
                >
                  <h4 className="text-xs font-bold text-[#20252D]">{pl.name}</h4>
                  <p className="text-[10px] text-[#777777]">
                    {pl.trackIds.length} {pl.trackIds.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {trackToAdd && (
                    <button
                      type="button"
                      onClick={() => handleAddToExisting(pl)}
                      className="px-2.5 py-1 bg-[#354BCB] text-white text-[11px] font-bold rounded-lg border border-[#20252D] cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(pl.id, pl.name)}
                    aria-label={`Delete playlist ${pl.name}`}
                    className="p-1.5 text-[#777777] hover:text-[#F47768] rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
