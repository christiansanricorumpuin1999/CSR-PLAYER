'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Terminal, Send, CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';
import { useAudioPlayer } from '@/lib/audioPlayerStore';
import { getSuggestions } from '@/lib/commandSuggestions';
import { addCommandToHistory, loadCommandHistory, saveCommandHistory } from '@/lib/commandHistory';
import type { CommandResult } from '@/lib/types';

const LISTBOX_ID = 'command-suggestions';
const optionId = (index: number) => `${LISTBOX_ID}-option-${index}`;

export function CommandBar() {
  const { executeCommand } = useAudioPlayer();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CommandResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [history, setHistory] = useState<string[]>(loadCommandHistory);
  const [historyPos, setHistoryPos] = useState(-1);
  const [draft, setDraft] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => getSuggestions(input, history), [input, history]);
  const items = suggestions.items;
  const usage = suggestions.usage;
  const hasContent = items.length > 0 || usage !== null;
  const showDropdown = isOpen && hasContent;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (value: string) => {
    setInput(value);
    setIsOpen(true);
    setHighlight(-1);
    setHistoryPos(-1);
  };

  const applySuggestion = (insert: string) => {
    setInput(insert);
    setHighlight(-1);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const submit = async (raw: string) => {
    const text = raw.trim();
    if (!text || isLoading) return;

    const nextHistory = addCommandToHistory(history, text);
    setHistory(nextHistory);
    saveCommandHistory(nextHistory);
    setHistoryPos(-1);
    setDraft('');
    setIsOpen(false);
    setHighlight(-1);
    setIsLoading(true);

    try {
      const res = await executeCommand(text);
      setResult(res);
      if (res.success) setInput('');
    } catch {
      setResult({ success: false, action: 'error', message: 'Something went wrong while running that command. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const navigateHistory = (direction: 1 | -1) => {
    if (direction === 1) {
      if (historyPos < 0) return;
      const nextPos = historyPos - 1;
      setHistoryPos(nextPos);
      setInput(nextPos < 0 ? draft : history[nextPos]);
      return;
    }
    if (history.length === 0) return;
    const nextPos = Math.min(historyPos + 1, history.length - 1);
    if (historyPos < 0) setDraft(input);
    setHistoryPos(nextPos);
    setInput(history[nextPos]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (showDropdown && items.length > 0) {
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        setHighlight((prev) => (prev + delta + items.length) % items.length);
        return;
      }
      if (e.key === 'ArrowDown' && historyPos < 0) {
        setIsOpen(true);
        return;
      }
      navigateHistory(e.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (e.key === 'Enter') {
      const picked = highlight >= 0 ? items[highlight] : undefined;
      if (showDropdown && picked && picked.insert.trim() !== input.trim()) {
        e.preventDefault();
        applySuggestion(picked.insert);
      }
      return;
    }

    if (e.key === 'Tab' && showDropdown && items.length > 0) {
      e.preventDefault();
      applySuggestion(items[highlight >= 0 ? highlight : 0].insert);
      return;
    }

    if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setHighlight(-1);
      } else if (result) {
        setResult(null);
      }
    }
  };

  const toggleHelp = () => {
    if (!isOpen && !input.trim()) setInput('/');
    setIsOpen((prev) => !prev);
    setHighlight(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
        className="relative flex items-center"
      >
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#777777]">
          <Terminal className="w-4 h-4 text-[#354BCB]" />
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label="Command bar"
          aria-expanded={showDropdown}
          aria-controls={LISTBOX_ID}
          aria-autocomplete="list"
          aria-activedescendant={showDropdown && highlight >= 0 ? optionId(highlight) : undefined}
          autoComplete="off"
          spellCheck={false}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type / for commands, or try /play"
          className="w-full pl-10 pr-24 py-2.5 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl text-base md:text-sm font-medium text-[#20252D] placeholder-[#777777] shadow-[2px_2px_0px_#20252D] focus:outline-hidden focus:ring-2 focus:ring-[#354BCB]/30 transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={toggleHelp}
            title="Command list"
            aria-label="Show available commands"
            className="p-2 md:p-1 text-[#777777] hover:text-[#20252D] rounded-lg hover:bg-[#F5F2E8] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send command"
            className="p-2 md:px-2.5 md:py-1 bg-[#354BCB] text-white rounded-xl text-xs font-bold border border-[#20252D] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2e41b0] transition-colors flex items-center gap-1 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-[#FFFEFA] border-2 border-[#20252D] rounded-2xl p-2 shadow-[4px_4px_0px_#20252D] max-h-72 overflow-y-auto">
          {usage && (
            <div className="px-2.5 py-2 mb-1 rounded-xl bg-[#F5F2E8]">
              <p className="font-mono text-xs font-bold text-[#20252D]">{usage.usage}</p>
              <p className="text-[11px] text-[#777777]">{usage.description}</p>
            </div>
          )}

          {items.length > 0 && (
            <>
              <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                {suggestions.title}
              </div>
              <ul id={LISTBOX_ID} role="listbox" aria-label={suggestions.title} className="space-y-0.5">
                {items.map((item, i) => (
                  <li key={item.key} id={optionId(i)} role="option" aria-selected={i === highlight}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySuggestion(item.insert)}
                      onMouseEnter={() => setHighlight(i)}
                      className={`w-full text-left min-h-11 md:min-h-0 px-2.5 py-2 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        i === highlight ? 'bg-[#354BCB]/10' : 'hover:bg-[#F5F2E8]'
                      }`}
                    >
                      <span className="font-mono text-xs font-bold text-[#354BCB] truncate">{item.label}</span>
                      <span className="hidden sm:inline text-[11px] text-[#777777] shrink-0">{item.description}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {result && !showDropdown && (
        <div
          role="status"
          aria-live="polite"
          className={`absolute top-full left-0 right-0 mt-2 z-30 max-h-72 overflow-y-auto p-3 rounded-2xl border-2 border-[#20252D] shadow-[3px_3px_0px_#20252D] flex items-start gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-1 ${
            result.success ? 'bg-[#FFFEFA] text-[#20252D]' : 'bg-[#F47768]/15 text-[#20252D]'
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-4 h-4 text-[#354BCB] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#B3261E] shrink-0 mt-0.5" />
          )}
          <div className="flex-1 whitespace-pre-line leading-relaxed font-mono">{result.message}</div>
          <button
            type="button"
            onClick={() => setResult(null)}
            aria-label="Dismiss feedback message"
            className="text-[#777777] hover:text-[#20252D] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
