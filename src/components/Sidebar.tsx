'use client';

import React from 'react';
import {
  Home,
  Music2,
  Globe2,
  ListMusic,
  Heart,
  Settings,
  FolderPlus,
} from 'lucide-react';
import { useAudioPlayer } from '@/lib/audioPlayerStore';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string, subTab?: string) => void;
  trackCount: number;
  playlistCount: number;
}

export function Sidebar({ currentTab, onSelectTab, trackCount, playlistCount }: SidebarProps) {
  const { queue } = useAudioPlayer();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, badge: null },
    { id: 'library', label: 'Library', icon: Music2, badge: trackCount > 0 ? trackCount : null },
    { id: 'online', label: 'Online Resolver', icon: Globe2, badge: 'Official' },
    { id: 'queue', label: 'Play Queue', icon: ListMusic, badge: queue.length > 0 ? queue.length : null },
    { id: 'favorites', label: 'Favorites', icon: Heart, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#FFFEFA] border-r-2 border-[#20252D] min-h-[calc(100vh-65px)] p-4 justify-between">
      <div className="space-y-6">
        {/* Navigation list */}
        <div>
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Menu
          </p>
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold border-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#354BCB] text-white border-[#20252D] shadow-[2px_2px_0px_#20252D]'
                      : 'bg-transparent text-[#20252D] border-transparent hover:bg-[#F5F2E8] hover:border-[#20252D]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#20252D]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isActive
                          ? 'bg-[#FFFEFA] text-[#354BCB] border-[#FFFEFA]'
                          : 'bg-[#F5F2E8] text-[#20252D] border-[#20252D]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Collections */}
        <div className="pt-2 border-t border-[#F5F2E8]">
          <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Local Collections
          </p>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => onSelectTab('library', 'playlists')}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#20252D] hover:bg-[#F5F2E8] rounded-xl transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderPlus className="w-3.5 h-3.5 text-[#354BCB]" />
                <span>Playlists</span>
              </div>
              <span className="text-[11px] text-[#777777]">{playlistCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Editorial Badge */}
      <div className="p-3 bg-[#F5F2E8] border border-[#343434] rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#A8E6D8] border border-[#20252D]" />
          <p className="text-[11px] font-bold text-[#20252D]">Offline Ready</p>
        </div>
        <p className="text-[10px] text-[#777777] leading-tight">
          Your audio files stay securely inside this browser. Zero cloud tracking.
        </p>
      </div>
    </aside>
  );
}

export function MobileNavigation({
  currentTab,
  onSelectTab,
}: {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Library', icon: Music2 },
    { id: 'online', label: 'Online', icon: Globe2 },
    { id: 'queue', label: 'Queue', icon: ListMusic },
    { id: 'favorites', label: 'Fav', icon: Heart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFEFA] border-t-2 border-[#20252D] px-2 py-2 flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
              isActive ? 'text-[#354BCB] font-extrabold' : 'text-[#777777] font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg ${
                isActive ? 'bg-[#354BCB]/10 border border-[#354BCB]' : ''
              }`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-[10px]">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
