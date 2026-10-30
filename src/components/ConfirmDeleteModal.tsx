'use client';

import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  trackTitle?: string;
  trackArtist?: string;
  trackCount?: number;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  trackTitle,
  trackArtist,
  trackCount,
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  const isBulk = typeof trackCount === 'number' && trackCount > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      className="fixed inset-0 z-50 bg-[#20252D]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl p-6 shadow-[6px_6px_0px_#20252D] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#F5F2E8]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#F47768]/15 border-2 border-[#F47768] text-[#F47768]">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="confirm-delete-title" className="text-base font-black text-[#20252D]">
                {isBulk ? `Delete ${trackCount} Tracks?` : 'Delete Track?'}
              </h2>
              <p className="text-xs text-[#777777]">Permanent deletion from browser</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close confirmation"
            className="p-1 text-[#777777] hover:text-[#20252D] rounded-xl hover:bg-[#F5F2E8] cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content details */}
        <div className="my-4">
          {isBulk ? (
            <p className="text-xs text-[#20252D] leading-relaxed">
              Are you sure you want to permanently delete these <strong>{trackCount}</strong> tracks?
              This will remove them from your device storage, playlists, favorites, and queue.
            </p>
          ) : (
            <div className="p-3 bg-[#F5F2E8] border border-[#20252D] rounded-2xl mb-3">
              <h4 className="text-xs font-black text-[#20252D] truncate">
                {trackTitle || 'Selected Track'}
              </h4>
              {trackArtist && (
                <p className="text-[11px] text-[#777777] truncate mt-0.5">{trackArtist}</p>
              )}
            </div>
          )}

          <div className="p-3 bg-[#F47768]/10 border border-[#F47768]/30 rounded-2xl flex items-start gap-2 text-xs text-[#20252D]">
            <AlertTriangle className="w-4 h-4 text-[#F47768] shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-[#20252D]">
              This action cannot be undone. The audio blob will be permanently removed from IndexedDB.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#FFFEFA] text-[#20252D] text-xs font-bold rounded-xl border border-[#20252D] hover:bg-[#F5F2E8] transition-colors cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#F47768] text-white text-xs font-bold rounded-xl border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#e06758] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
