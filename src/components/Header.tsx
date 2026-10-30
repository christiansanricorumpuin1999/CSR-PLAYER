'use client';

import React, { useEffect, useState } from 'react';
import { Disc3, Wifi, WifiOff, HardDrive, Plus } from 'lucide-react';
import { CommandBar } from './CommandBar';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { getStorageEstimate } from '@/lib/db';

interface HeaderProps {
  onOpenImport: () => void;
  onNavigateTab: (tab: string) => void;
  storageUsage?: string;
}

export function Header({ onOpenImport, onNavigateTab, storageUsage }: HeaderProps) {
  const { isOnline } = useAudioPlayer();
  const [storageInfo, setStorageInfo] = useState<{ usageFormatted: string; percentage: number } | null>(null);

  useEffect(() => {
    getStorageEstimate().then((res) => {
      setStorageInfo({
        usageFormatted: res.usageFormatted,
        percentage: res.percentage,
      });
    });
  }, [storageUsage]);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#F5F2E8]/95 backdrop-blur-md border-b-2 border-[#20252D] px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand & Badges */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <button
            type="button"
            onClick={() => onNavigateTab('home')}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-[#354BCB] border-2 border-[#20252D] flex items-center justify-center text-white shadow-[2px_2px_0px_#20252D] group-hover:rotate-12 transition-transform">
              <Disc3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[#20252D]">CSR-PLAYER</span>
                <span className="px-1.5 py-0.2 rounded-sm text-[10px] font-bold bg-[#F5E94A] text-[#20252D] border border-[#20252D]">
                  OPEN
                </span>
              </div>
              <p className="text-[10px] font-semibold text-[#777777] hidden sm:block">Offline-First Player</p>
            </div>
          </button>

          {/* Status indicators */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span
                title="Online Mode Connected"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFEFA] border border-[#20252D] text-[#354BCB]"
              >
                <Wifi className="w-3 h-3 text-[#354BCB]" />
                <span className="hidden sm:inline">ONLINE</span>
              </span>
            ) : (
              <span
                title="Offline Mode Active — Local library is ready"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#A8E6D8] border border-[#20252D] text-[#20252D]"
              >
                <WifiOff className="w-3 h-3" />
                <span>OFFLINE</span>
              </span>
            )}

            {storageInfo && (
              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                title={`Storage used: ${storageInfo.usageFormatted}`}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFFEFA] border border-[#20252D] text-[#20252D] hover:bg-[#F5F2E8] cursor-pointer"
              >
                <HardDrive className="w-3 h-3 text-[#777777]" />
                <span>{storageInfo.usageFormatted}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenImport}
              className="md:hidden flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#354BCB] text-white text-xs font-bold border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          </div>
        </div>

        {/* Center: Discord-style Command Bar */}
        <div className="w-full md:max-w-md lg:max-w-xl">
          <CommandBar />
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#354BCB] text-white text-xs font-bold border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#20252D] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Import Audio</span>
          </button>
        </div>
      </div>
    </header>
  );
}
