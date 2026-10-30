const STORAGE_KEY = 'csr-player.command-history';
export const COMMAND_HISTORY_LIMIT = 50;

export function loadCommandHistory(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === 'string').slice(0, COMMAND_HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function saveCommandHistory(entries: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, COMMAND_HISTORY_LIMIT)));
  } catch {
    // Storage can be unavailable in private browsing; history then lasts for this session only
  }
}

export function addCommandToHistory(entries: string[], command: string): string[] {
  return [command, ...entries.filter((entry) => entry !== command)].slice(0, COMMAND_HISTORY_LIMIT);
}
