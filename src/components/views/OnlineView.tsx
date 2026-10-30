'use client';

import React, { useState } from 'react';
import { Link2, Play, CheckCircle2, AlertCircle, HardDrive, FileAudio, Radio } from 'lucide-react';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { COMMAND_SPECS } from '@/lib/commandParser';
import { SUPPORTED_AUDIO_FORMATS } from '@/lib/streamTrack';
import type { CommandResult } from '@/lib/types';

const SOURCES = [
  {
    key: 'local',
    title: 'Your library',
    icon: HardDrive,
    iconBg: 'bg-[#A8E6D8]',
    available: true,
    description: `Imported files (${SUPPORTED_AUDIO_FORMATS}) play offline. Use /play with a song title.`,
  },
  {
    key: 'direct',
    title: 'Direct audio links',
    icon: FileAudio,
    iconBg: 'bg-[#B9A6F2]',
    available: true,
    description: 'Paste a link that points straight to an audio file. The server hosting it must allow playback from other websites.',
  },
  {
    key: 'catalog',
    title: 'Online catalog',
    icon: Radio,
    iconBg: 'bg-[#F5E94A]',
    available: false,
    description: 'Searching an online music catalog needs a provider connection. It is not connected yet.',
  },
] as const;

export function OnlineView() {
  const { executeCommand } = useAudioPlayer();
  const [linkInput, setLinkInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);

  const handlePlayLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = linkInput.trim();
    if (!url || isRunning) return;

    setIsRunning(true);
    try {
      const res = await executeCommand(`/play ${url}`);
      setResult(res);
      if (res.success) setLinkInput('');
    } catch {
      setResult({ success: false, action: 'error', message: 'Something went wrong while playing that link. Please try again.' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-[#20252D]">Music Bot</h1>
        <p className="text-xs text-[#777777]">
          Control playback with slash commands in the command bar at the top of the app.
        </p>
      </div>

      <div className="p-6 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl shadow-[4px_4px_0px_#20252D] space-y-4">
        <form onSubmit={handlePlayLink} className="space-y-3">
          <label htmlFor="direct-audio-link" className="block text-xs font-bold uppercase tracking-wider text-[#777777]">
            Play a direct audio link
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="direct-audio-link"
              type="url"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              placeholder="https://example.com/song.mp3"
              className="flex-1 px-4 py-2.5 bg-[#F5F2E8] border-2 border-[#20252D] rounded-2xl text-base sm:text-sm font-medium text-[#20252D] placeholder-[#777777] focus:outline-hidden"
              required
            />
            <button
              type="submit"
              disabled={!linkInput.trim() || isRunning}
              className="px-6 py-2.5 bg-[#354BCB] text-white text-sm font-bold rounded-2xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#2e41b0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRunning ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isRunning ? 'Checking link...' : 'Play Link'}</span>
            </button>
          </div>
        </form>

        {result && (
          <div
            role="status"
            className={`flex items-start gap-2 p-3 rounded-2xl border-2 border-[#20252D] text-xs font-medium whitespace-pre-line ${
              result.success ? 'bg-[#F5F2E8] text-[#20252D]' : 'bg-[#F47768]/15 text-[#20252D]'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 text-[#354BCB] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#B3261E] shrink-0 mt-0.5" />
            )}
            <span>{result.message}</span>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#777777] mb-3">Music sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SOURCES.map((source) => (
            <div key={source.key} className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`p-1.5 rounded-lg border border-[#20252D] text-[#20252D] ${source.iconBg}`}>
                  <source.icon className="w-4 h-4" />
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-[#20252D] ${
                    source.available ? 'bg-[#A8E6D8] text-[#20252D]' : 'bg-[#FFFEFA] text-[#777777]'
                  }`}
                >
                  {source.available ? 'Available' : 'Not connected'}
                </span>
              </div>
              <h4 className="font-extrabold text-xs text-[#20252D]">{source.title}</h4>
              <p className="mt-1 text-[11px] text-[#777777] leading-relaxed">{source.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#777777] mb-3">Commands</h3>
        <div className="p-4 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl shadow-[3px_3px_0px_#20252D]">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {COMMAND_SPECS.map((spec) => (
              <li key={spec.name} className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#354BCB] truncate">
                  <Link2 className="w-3 h-3 shrink-0 text-[#777777]" />
                  <span className="truncate">{spec.usage}</span>
                </p>
                <p className="text-[11px] text-[#777777] mt-0.5">{spec.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
