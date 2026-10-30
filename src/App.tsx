'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AudioPlayerProvider, useAudioPlayer } from '@/lib/audioPlayerStore';
import {
  getAllTracks,
  getAllPlaylists,
  getRecentlyPlayedTracks,
  deleteTrack as dbDeleteTrack,
  deleteMultipleTracks as dbDeleteMultipleTracks,
  deletePlaylist as dbDeletePlaylist,
  removeTrackFromPlaylist,
  getSetting,
  setSetting,
  getStorageEstimate,
} from '@/lib/db';
import { Track, Playlist } from '@/lib/types';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { Sidebar, MobileNavigation } from '@/components/Sidebar';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FullPlayer } from '@/components/FullPlayer';
import { WelcomeModal } from '@/components/WelcomeModal';
import { ImportModal } from '@/components/ImportModal';
import { PlaylistModal } from '@/components/PlaylistModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { HomeView } from '@/components/views/HomeView';
import { LibraryView } from '@/components/views/LibraryView';
import { OnlineView } from '@/components/views/OnlineView';
import { QueueView } from '@/components/views/QueueView';
import { FavoritesView } from '@/components/views/FavoritesView';
import { SettingsView } from '@/components/views/SettingsView';

function SonoraMainApp() {
  const [currentTab, setCurrentTab] = useState('home');
  const [librarySubTab, setLibrarySubTab] = useState<'tracks' | 'playlists' | 'artists' | 'albums'>('tracks');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [storageUsage, setStorageUsage] = useState('0 B');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [trackForPlaylist, setTrackForPlaylist] = useState<Track | null>(null);

  // Deletion and toast state
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  const [bulkDeleteTracks, setBulkDeleteTracks] = useState<Track[] | null>(null);
  const [isDeletingTrack, setIsDeletingTrack] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    togglePlayPause,
    seek,
    currentTime,
    duration,
    setVolume,
    volume,
    toggleMute,
    closeFullPlayer,
    isFullPlayerOpen,
    handleTracksRemoved,
  } = useAudioPlayer();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      const isInput =
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === 'Escape') {
        if (isFullPlayerOpen) closeFullPlayer();
        if (isImportModalOpen) setIsImportModalOpen(false);
        if (isPlaylistModalOpen) setIsPlaylistModalOpen(false);
        return;
      }

      if (isInput) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 5));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 5));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setVolume(Math.min(1, volume + 0.05));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setVolume(Math.max(0, volume - 0.05));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlayPause,
    seek,
    currentTime,
    duration,
    setVolume,
    volume,
    toggleMute,
    isFullPlayerOpen,
    closeFullPlayer,
    isImportModalOpen,
    isPlaylistModalOpen,
  ]);

  // Load data from IndexedDB
  const refreshLibraryData = useCallback(async () => {
    try {
      const allTracks = await getAllTracks();
      const allPlaylists = await getAllPlaylists();
      const recent = await getRecentlyPlayedTracks(6);
      const storage = await getStorageEstimate();

      setTracks(allTracks);
      setPlaylists(allPlaylists);
      setRecentlyPlayed(recent);
      setStorageUsage(storage.usageFormatted);
    } catch {
      // IndexedDB initialization error
    }
  }, []);

  // Check onboarding on mount
  useEffect(() => {
    refreshLibraryData();

    // Check ?autostart=1 or saved setting
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        setIsWelcomeOpen(false);
      } else {
        getSetting('hasCompletedWelcome', false).then((completed) => {
          if (!completed) {
            setIsWelcomeOpen(true);
          }
        });
      }

      // Register PWA Service Worker
      if ('serviceWorker' in navigator && import.meta.env.PROD) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
    }
  }, [refreshLibraryData]);

  const handleEnterWelcome = async () => {
    await setSetting('hasCompletedWelcome', true);
    setIsWelcomeOpen(false);
  };

  const handleExploreOffline = async () => {
    await setSetting('hasCompletedWelcome', true);
    setIsWelcomeOpen(false);
    setCurrentTab('library');
    setLibrarySubTab('tracks');
  };

  const handleReplayWelcome = () => {
    setIsWelcomeOpen(true);
  };

  const handleSelectTab = (tab: string, subTab?: string) => {
    setCurrentTab(tab);
    if (subTab && (subTab === 'tracks' || subTab === 'playlists' || subTab === 'artists' || subTab === 'albums')) {
      setLibrarySubTab(subTab as typeof librarySubTab);
    }
  };

  const handleDeleteTrack = (track: Track) => {
    setTrackToDelete(track);
    setBulkDeleteTracks(null);
  };

  const handleDeleteMultipleTracks = (tracksToDelete: Track[]) => {
    if (!tracksToDelete || tracksToDelete.length === 0) return;
    setBulkDeleteTracks(tracksToDelete);
    setTrackToDelete(null);
  };

  const handleConfirmDelete = async () => {
    setIsDeletingTrack(true);
    try {
      if (trackToDelete) {
        const id = trackToDelete.id;
        const title = trackToDelete.title;
        await dbDeleteTrack(id);
        handleTracksRemoved([id]);
        await refreshLibraryData();
        setToast({
          message: `"${title}" was permanently deleted from your library.`,
          type: 'success',
        });
      } else if (bulkDeleteTracks && bulkDeleteTracks.length > 0) {
        const count = bulkDeleteTracks.length;
        const ids = bulkDeleteTracks.map((t) => t.id);
        await dbDeleteMultipleTracks(ids);
        handleTracksRemoved(ids);
        await refreshLibraryData();
        setToast({
          message: `${count} tracks permanently deleted from your library.`,
          type: 'success',
        });
      }
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to delete track from database.',
        type: 'error',
      });
    } finally {
      setIsDeletingTrack(false);
      setTrackToDelete(null);
      setBulkDeleteTracks(null);
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: string, trackId: string) => {
    try {
      await removeTrackFromPlaylist(playlistId, trackId);
      await refreshLibraryData();
      setToast({
        message: 'Track removed from playlist.',
        type: 'success',
      });
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to remove track from playlist.',
        type: 'error',
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await dbDeletePlaylist(playlistId);
      await refreshLibraryData();
      setToast({
        message: 'Playlist deleted.',
        type: 'success',
      });
    } catch (err: unknown) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to delete playlist.',
        type: 'error',
      });
    }
  };

  const handleOpenPlaylistModalForTrack = (track?: Track) => {
    setTrackForPlaylist(track || null);
    setIsPlaylistModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F2E8] flex flex-col font-sans text-[#20252D]">
      {/* Onboarding Welcome Modal */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onEnter={handleEnterWelcome}
        onExploreOffline={handleExploreOffline}
      />

      {/* Import Audio Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={refreshLibraryData}
      />

      {/* Playlist Manager Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => {
          setIsPlaylistModalOpen(false);
          setTrackForPlaylist(null);
        }}
        playlists={playlists}
        trackToAdd={trackForPlaylist}
        onRefreshPlaylists={refreshLibraryData}
      />

      {/* Top Header */}
      <Header
        onOpenImport={() => setIsImportModalOpen(true)}
        onNavigateTab={(tab) => handleSelectTab(tab)}
        storageUsage={storageUsage}
      />

      {/* Main Layout Area: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          trackCount={tracks.length}
          playlistCount={playlists.length}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
          {currentTab === 'home' && (
            <HomeView
              tracks={tracks}
              playlists={playlists}
              recentlyPlayed={recentlyPlayed}
              onOpenImport={() => setIsImportModalOpen(true)}
              onNavigateTab={(tab) => handleSelectTab(tab)}
              onAddToPlaylist={handleOpenPlaylistModalForTrack}
              onDeleteTrack={handleDeleteTrack}
              storageUsage={storageUsage}
            />
          )}

          {currentTab === 'library' && (
            <LibraryView
              tracks={tracks}
              playlists={playlists}
              initialSubTab={librarySubTab}
              onOpenImport={() => setIsImportModalOpen(true)}
              onOpenPlaylistModal={handleOpenPlaylistModalForTrack}
              onDeleteTrack={handleDeleteTrack}
              onDeleteMultipleTracks={handleDeleteMultipleTracks}
              onDeletePlaylist={handleDeletePlaylist}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              onLibraryChanged={refreshLibraryData}
            />
          )}

          {currentTab === 'online' && <OnlineView />}

          {currentTab === 'queue' && (
            <QueueView onNavigateLibrary={() => setCurrentTab('library')} />
          )}

          {currentTab === 'favorites' && (
            <FavoritesView
              tracks={tracks}
              onOpenImport={() => setIsImportModalOpen(true)}
              onAddToPlaylist={handleOpenPlaylistModalForTrack}
              onDeleteTrack={handleDeleteTrack}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              onReplayWelcome={handleReplayWelcome}
              onRefreshData={refreshLibraryData}
            />
          )}
        </main>
      </div>

      {/* Confirmation Modal for Permanent Deletions */}
      <ConfirmDeleteModal
        isOpen={!!trackToDelete || !!bulkDeleteTracks}
        onClose={() => {
          if (!isDeletingTrack) {
            setTrackToDelete(null);
            setBulkDeleteTracks(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        trackTitle={trackToDelete?.title}
        trackArtist={trackToDelete?.artist}
        trackCount={bulkDeleteTracks ? bulkDeleteTracks.length : 1}
        isDeleting={isDeletingTrack}
      />

      {/* Floating Status / Action Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border-2 border-[#20252D] shadow-[4px_4px_0px_#20252D] text-xs font-bold transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success' ? 'bg-[#7EE081] text-[#20252D]' : 'bg-[#F47768] text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-2 p-0.5 rounded-md hover:bg-black/10 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mini Player */}
      <MiniPlayer onNavigateQueue={() => setCurrentTab('queue')} />

      {/* Expanded Full Player */}
      <FullPlayer />


      {/* Mobile Navigation */}
      <MobileNavigation
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AudioPlayerProvider>
      <SonoraMainApp />
    </AudioPlayerProvider>
  );
}
