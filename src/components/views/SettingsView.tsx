'use client';

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Code2,
  Volume2,
  CheckCircle2,
} from 'lucide-react';
import { getStorageEstimate, clearAllTracks, getAllTracks, getAllPlaylists } from '@/lib/db';
import type { RepeatMode } from '@/lib/types';
import { useAudioPlayer } from '@/lib/audioPlayerStore';

interface SettingsViewProps {
  onReplayWelcome: () => void;
  onRefreshData: () => void;
}

export function SettingsView({ onReplayWelcome, onRefreshData }: SettingsViewProps) {
  const { volume, setVolume, repeatMode, setRepeatMode } = useAudioPlayer();
  const [storageInfo, setStorageInfo] = useState<{
    usageFormatted: string;
    quotaFormatted: string;
    percentage: number;
  }>({
    usageFormatted: '0 B',
    quotaFormatted: '0 B',
    percentage: 0,
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getStorageEstimate().then((res) => {
      setStorageInfo({
        usageFormatted: res.usageFormatted,
        quotaFormatted: res.quotaFormatted,
        percentage: res.percentage,
      });
    });
  }, []);

  const handleClearAll = async () => {
    if (
      confirm(
        'Are you sure you want to completely erase all local tracks, playlists, and history from your browser? This action cannot be undone.'
      )
    ) {
      await clearAllTracks();
      onRefreshData();
      setMessage('All local library data has been permanently cleared.');
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleExportMetadata = async () => {
    try {
      const tracks = await getAllTracks();
      const playlists = await getAllPlaylists();
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tracks: tracks.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album,
          duration: t.duration,
          source: t.source,
          sourceUrl: t.sourceUrl,
          fileName: t.fileName,
          isFavorite: t.isFavorite,
        })),
        playlists,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sonora-library-metadata-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage('Library metadata exported successfully.');
      setTimeout(() => setMessage(null), 3000);
    } catch (err: unknown) {
      setMessage(`Export failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  };

  const handleImportMetadataFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { importMetadataBackup } = await import('@/lib/db');
      const res = await importMetadataBackup(data);
      onRefreshData();
      setMessage(`Successfully imported ${res.importedTracks} tracks and ${res.importedPlaylists} playlists from backup.`);
      setTimeout(() => setMessage(null), 3500);
    } catch (err: unknown) {
      setMessage(`Import failed: ${err instanceof Error ? err.message : 'Invalid JSON file format'}`);
      setTimeout(() => setMessage(null), 3500);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-3xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-[#20252D]">Settings & Privacy</h1>
        <p className="text-xs text-[#777777]">
          Manage browser storage, audio defaults, export metadata, and review open-source policies.
        </p>
      </div>

      {message && (
        <div className="p-3 bg-[#A8E6D8] border-2 border-[#20252D] rounded-2xl text-xs font-bold text-[#20252D] flex items-center gap-2 shadow-[2px_2px_0px_#20252D]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Storage Management Card */}
      <div className="p-5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl shadow-[4px_4px_0px_#20252D] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#354BCB]/10 border border-[#354BCB] text-[#354BCB]">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#20252D]">Storage Usage (IndexedDB)</h3>
            <p className="text-xs text-[#777777]">
              Tracks are stored locally in this browser.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold text-[#20252D]">
            <span>Used: {storageInfo.usageFormatted}</span>
            <span className="text-[#777777]">Quota: {storageInfo.quotaFormatted}</span>
          </div>
          <div className="w-full h-3 bg-[#F5F2E8] border border-[#20252D] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#354BCB]"
              style={{ width: `${Math.max(1, storageInfo.percentage)}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportMetadata}
            className="px-3.5 py-2 bg-[#FFFEFA] text-[#20252D] text-xs font-bold rounded-xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#F5F2E8] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#354BCB]" />
            <span>Export Metadata (JSON)</span>
          </button>

          <label className="px-3.5 py-2 bg-[#FFFEFA] text-[#20252D] text-xs font-bold rounded-xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#F5F2E8] transition-colors flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[#354BCB]" />
            <span>Import Metadata (JSON)</span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportMetadataFile}
            />
          </label>

          <button
            type="button"
            onClick={handleClearAll}
            className="px-3.5 py-2 bg-[#FFFEFA] text-[#F47768] text-xs font-bold rounded-xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#F47768]/10 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Library Data</span>
          </button>
        </div>
      </div>

      {/* Audio Defaults Card */}
      <div className="p-5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl shadow-[4px_4px_0px_#20252D] space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F5E94A] border border-[#20252D] text-[#20252D]">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#20252D]">Audio Settings</h3>
            <p className="text-xs text-[#777777]">Adjust volume & playback preferences.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold text-[#777777] mb-1">
              Current Volume ({Math.round(volume * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Adjust player volume"
              className="w-full h-2 bg-[#F5F2E8] border border-[#20252D] rounded-lg appearance-none cursor-pointer accent-[#354BCB]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#777777] mb-1">
              Repeat Mode
            </label>
            <select
              value={repeatMode}
              onChange={(e) => setRepeatMode(e.target.value as RepeatMode)}
              className="w-full px-3 py-1.5 bg-[#F5F2E8] border-2 border-[#20252D] rounded-xl text-xs font-bold text-[#20252D] cursor-pointer"
            >
              <option value="off">Off (Play straight through)</option>
              <option value="all">Repeat All</option>
              <option value="one">Repeat One Track</option>
            </select>
          </div>
        </div>
      </div>

      {/* Onboarding & Welcome Replay Card */}
      <div className="p-5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl shadow-[4px_4px_0px_#20252D] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-[#20252D]">Replay Welcome Screen</h3>
          <p className="text-xs text-[#777777]">
            Review the onboarding information and principles of SONORA.
          </p>
        </div>
        <button
          type="button"
          onClick={onReplayWelcome}
          className="px-3.5 py-2 bg-[#FFFEFA] text-[#20252D] text-xs font-bold rounded-xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#F5F2E8] flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#354BCB]" />
          <span>Replay Welcome</span>
        </button>
      </div>

      {/* Privacy Notice Card */}
      <div className="p-5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl shadow-[4px_4px_0px_#20252D] space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#354BCB]" />
          <h3 className="text-sm font-extrabold text-[#20252D]">Privacy & Security Notice</h3>
        </div>
        <p className="text-xs text-[#777777] leading-relaxed">
          SONORA operates entirely client-side. Local audio files imported from your device are never transmitted or uploaded to external servers. Metadata and preferences are stored exclusively in your browser's IndexedDB. No passwords, emails, tracking cookies, or remote analytics are used.
        </p>
        <p className="text-xs text-[#777777] leading-relaxed">
          Online audio plays only from direct links you paste into the command bar (MP3, WAV, OGG, M4A, AAC, or FLAC). The host of that file receives your browser's request, as with any audio on a web page. CSR-PLAYER does not extract audio from video or music platforms.
        </p>
      </div>

      {/* About & Open Source */}
      <div className="p-5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl shadow-[4px_4px_0px_#20252D] space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#20252D]" />
          <h3 className="text-sm font-extrabold text-[#20252D]">Open Source</h3>
        </div>
        <p className="text-xs text-[#777777]">
          SONORA is released under the open-source MIT License. Built with Next.js, TypeScript, Tailwind CSS, and Lucide icons.
        </p>
      </div>
    </div>
  );
}
