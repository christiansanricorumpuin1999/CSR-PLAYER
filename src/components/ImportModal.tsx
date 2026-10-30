'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FolderUp,
  FileAudio,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { parseAudioFile } from '@/lib/metadataParser';
import { getAllTracks, saveMultipleTracks } from '@/lib/db';
import { Track } from '@/lib/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportModal({ isOpen, onClose, onImportComplete }: ImportModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; filename: string } | null>(null);
  const [result, setResult] = useState<{
    added: number;
    duplicates: number;
    errors: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setResult(null);

    const fileArray = Array.from(files).filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const validExts = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'weba'];
      return file.type.startsWith('audio/') || (ext && validExts.includes(ext));
    });

    if (fileArray.length === 0) {
      setIsProcessing(false);
      setResult({
        added: 0,
        duplicates: 0,
        errors: ['No valid audio files found in selection.'],
      });
      return;
    }

    const existingTracks = await getAllTracks();
    const existingFingerprints = new Set(
      existingTracks.map((t) => `${t.fileName || t.title}_${t.fileSize || 0}`)
    );

    const newTracks: Track[] = [];
    const errors: string[] = [];
    let duplicates = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setProgress({
        current: i + 1,
        total: fileArray.length,
        filename: file.name,
      });

      const fingerprint = `${file.name}_${file.size}`;
      if (existingFingerprints.has(fingerprint)) {
        duplicates++;
        continue;
      }

      try {
        const metadata = await parseAudioFile(file);
        const trackId = `loc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const track: Track = {
          id: trackId,
          title: metadata.title || file.name,
          artist: metadata.artist,
          album: metadata.album,
          duration: metadata.duration || 0,
          artworkBlob: metadata.artworkBlob,
          source: 'local',
          localBlob: file,
          mimeType: file.type || 'audio/mpeg',
          fileName: file.name,
          fileSize: file.size,
          folderPath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || '',
          addedAt: Date.now(),
          isFavorite: false,
        };

        newTracks.push(track);
        existingFingerprints.add(fingerprint);
      } catch (err: unknown) {
        errors.push(`Failed to parse "${file.name}": ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    if (newTracks.length > 0) {
      await saveMultipleTracks(newTracks);
    }

    setIsProcessing(false);
    setProgress(null);
    setResult({
      added: newTracks.length,
      duplicates,
      errors,
    });

    if (newTracks.length > 0) {
      onImportComplete();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      className="fixed inset-0 z-50 bg-[#20252D]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl p-6 shadow-[6px_6px_0px_#20252D] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#F5F2E8]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#354BCB]/10 border border-[#354BCB] text-[#354BCB]">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-dialog-title" className="text-lg font-black text-[#20252D]">
                Import Music Files
              </h2>
              <p className="text-xs text-[#777777]">
                Files are stored 100% locally in browser IndexedDB.
              </p>
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

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-4 border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
            isDragging
              ? 'border-[#354BCB] bg-[#354BCB]/10 scale-[1.01]'
              : 'border-[#20252D] bg-[#F5F2E8]/60 hover:bg-[#F5F2E8]'
          }`}
        >
          <UploadCloud className="w-12 h-12 mx-auto text-[#354BCB] mb-2" />
          <h4 className="text-sm font-bold text-[#20252D]">
            Drag & drop your audio tracks here
          </h4>
          <p className="text-xs text-[#777777] mt-1 max-w-xs mx-auto">
            Supports MP3, WAV, FLAC, OGG, M4A, AAC. Audio metadata & artwork are read automatically.
          </p>

          {/* Action buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] shadow-[2px_2px_0px_#20252D] hover:bg-[#2e41b0] transition-colors cursor-pointer disabled:opacity-50"
            >
              Select Audio Files
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-[#FFFEFA] text-[#20252D] text-xs font-bold rounded-xl border border-[#20252D] hover:bg-[#F5F2E8] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <FolderUp className="w-3.5 h-3.5 text-[#354BCB]" />
              <span>Import Entire Folder</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
            }}
          />

          <input
            ref={folderInputRef}
            type="file"
            multiple
            // @ts-expect-error webkitdirectory is a non-standard attribute missing from React's types
            webkitdirectory="true"
            directory="true"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) processFiles(e.target.files);
            }}
          />
        </div>

        {/* Processing Progress */}
        {isProcessing && progress && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FFFEFA] border border-[#20252D]">
            <div className="flex items-center justify-between text-xs font-bold text-[#20252D] mb-1.5">
              <span>Importing {progress.current} of {progress.total}...</span>
              <span className="font-mono text-[#354BCB]">
                {Math.round((progress.current / progress.total) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-[#F5F2E8] rounded-full overflow-hidden border border-[#343434]">
              <div
                className="h-full bg-[#354BCB] transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            <p className="text-[11px] text-[#777777] mt-1 truncate">
              {progress.filename}
            </p>
          </div>
        )}

        {/* Import Results Summary */}
        {result && (
          <div className="mt-4 p-4 rounded-2xl bg-[#FFFEFA] border-2 border-[#20252D] shadow-[2px_2px_0px_#20252D]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-[#354BCB]" />
              <h4 className="font-black text-sm text-[#20252D]">Import Complete</h4>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[#20252D]">
                <strong className="text-[#354BCB]">{result.added}</strong> new tracks added to your local library.
              </p>
              {result.duplicates > 0 && (
                <p className="text-[#777777]">
                  {result.duplicates} duplicate tracks skipped.
                </p>
              )}
              {result.errors.length > 0 && (
                <div className="mt-2 text-[#F47768] space-y-0.5">
                  {result.errors.slice(0, 3).map((err, idx) => (
                    <p key={idx} className="flex items-center gap-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#354BCB] text-white text-xs font-bold rounded-xl border border-[#20252D] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
