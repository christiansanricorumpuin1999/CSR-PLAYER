'use client';

import React from 'react';
import { Disc3, FolderHeart, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onEnter: () => void;
  onExploreOffline: () => void;
}

export function WelcomeModal({ isOpen, onEnter, onExploreOffline }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-heading"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#20252D]/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl p-6 md:p-8 shadow-[6px_6px_0px_#20252D] animate-in fade-in zoom-in-95 duration-200">
        {/* Top Badges */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F5E94A] text-[#20252D] border border-[#20252D]">
            <Sparkles className="w-3.5 h-3.5" />
            No Account Needed
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#A8E6D8] text-[#20252D] border border-[#20252D]">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Local First
          </span>
        </div>

        {/* Brand graphic & Title */}
        <div className="text-center my-4">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#354BCB] border-2 border-[#20252D] flex items-center justify-center text-white mb-4 shadow-[3px_3px_0px_#20252D]">
            <Disc3 className="w-10 h-10 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h1 id="welcome-heading" className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#20252D]">
            CSR-PLAYER
          </h1>
          <p className="mt-2 text-lg font-medium text-[#20252D]">
            Your music. Your space. Welcome to CSR-PLAYER.
          </p>
          <p className="mt-1 text-sm text-[#777777] max-w-md mx-auto">
            An open-source, offline-first personal music player. Import your local audio collection, enjoy seamless playback without accounts, or resolve official online streams.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
          <div className="bg-[#F5F2E8] border border-[#343434] p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#354BCB]" />
              <h3 className="font-bold text-sm text-[#20252D]">Local Library</h3>
            </div>
            <p className="text-xs text-[#777777]">
              Stored privately in your browser's IndexedDB. Never uploaded to any server.
            </p>
          </div>

          <div className="bg-[#F5F2E8] border border-[#343434] p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F47768]" />
              <h3 className="font-bold text-sm text-[#20252D]">Real Integrations</h3>
            </div>
            <p className="text-xs text-[#777777]">
              Discord-style <code className="font-mono bg-[#B9A6F2]/30 px-1 rounded text-[#20252D]">/play</code> commands for your offline library and direct audio links.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onEnter}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#354BCB] text-white font-bold text-base border-2 border-[#20252D] shadow-[3px_3px_0px_#20252D] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_#20252D] transition-all cursor-pointer"
          >
            <span>Enter CSR-PLAYER</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onExploreOffline}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#FFFEFA] text-[#20252D] font-bold text-sm border-2 border-[#20252D] hover:bg-[#F5F2E8] transition-colors cursor-pointer"
          >
            <FolderHeart className="w-4 h-4 text-[#354BCB]" />
            <span>Explore offline mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}
