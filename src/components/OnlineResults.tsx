import React from 'react';
import { Globe2, Loader2, AlertCircle } from 'lucide-react';
import type { Track } from '@/lib/types';
import type { OnlineSearchState } from '@/lib/useOnlineSearch';
import { OnlineTrackRow } from '@/components/OnlineTrackRow';

interface OnlineResultsProps {
  query: string;
  search: OnlineSearchState;
  localTrackIds: Set<string>;
  onLibraryChanged: () => void;
}

export function OnlineResults({ query, search, localTrackIds, onLibraryChanged }: OnlineResultsProps) {
  if (search.status === 'idle') {
    return (
      <div className="p-6 bg-[#FFFEFA] border-2 border-[#20252D] rounded-3xl text-center shadow-[4px_4px_0px_#20252D]">
        <Globe2 className="w-10 h-10 text-[#777777] mx-auto mb-2" />
        <h4 className="text-sm font-bold text-[#20252D]">Search online music</h4>
        <p className="text-xs text-[#777777] mt-1 max-w-xs mx-auto">
          Type at least two characters in the search bar to look through Jamendo and the Internet Archive.
        </p>
      </div>
    );
  }

  if (search.status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 p-6 text-xs font-bold text-[#777777]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Searching online sources...</span>
      </div>
    );
  }

  if (search.status === 'error') {
    return (
      <p role="alert" className="flex items-start gap-2 p-3 rounded-2xl border-2 border-[#20252D] bg-[#F47768]/15 text-xs font-medium text-[#20252D]">
        <AlertCircle className="w-4 h-4 text-[#B3261E] shrink-0 mt-px" />
        <span>{search.error}</span>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {search.warnings.length > 0 && (
        <ul className="space-y-1">
          {search.warnings.map((warning) => (
            <li key={warning} className="text-[11px] text-[#777777]">
              {warning}
            </li>
          ))}
        </ul>
      )}

      {search.tracks.filter((t) => t.sourceUrl).length === 0 ? (
        <p className="p-4 text-xs text-[#777777] text-center">No online tracks matched "{query.trim()}".</p>
      ) : (
        <div className="space-y-2">
          {search.tracks
            .filter((track: Track) => track.sourceUrl)
            .map((track: Track) => (
            <OnlineTrackRow
              key={track.id}
              track={track}
              isSaved={localTrackIds.has(track.id)}
              onLibraryChanged={onLibraryChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}
