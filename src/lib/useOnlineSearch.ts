import { useEffect, useState } from 'react';
import type { Track } from '@/lib/types';
import { searchOnlineCatalog } from '@/lib/onlineCatalog';

export interface OnlineSearchState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  tracks: Track[];
  warnings: string[];
  error: string | null;
}

const IDLE: OnlineSearchState = { status: 'idle', tracks: [], warnings: [], error: null };
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

export function useOnlineSearch(query: string, enabled: boolean): OnlineSearchState {
  const [state, setState] = useState<OnlineSearchState>(IDLE);

  useEffect(() => {
    const trimmed = query.trim();
    if (!enabled || trimmed.length < MIN_QUERY_LENGTH) {
      setState(IDLE);
      return;
    }

    const controller = new AbortController();
    setState((prev) => ({ ...prev, status: 'loading', error: null }));

    const timer = window.setTimeout(async () => {
      try {
        const result = await searchOnlineCatalog(trimmed, controller.signal);
        setState({ status: 'ready', tracks: result.tracks, warnings: result.warnings, error: null });
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        setState({
          status: 'error',
          tracks: [],
          warnings: [],
          error: err instanceof Error ? err.message : 'Online search failed. Please try again.',
        });
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return state;
}
