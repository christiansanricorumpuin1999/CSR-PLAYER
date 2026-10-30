import type { RepeatMode } from './types';

export type CommandName =
  | 'play'
  | 'pause'
  | 'resume'
  | 'stop'
  | 'skip'
  | 'previous'
  | 'restart'
  | 'seek'
  | 'nowplaying'
  | 'queue'
  | 'clear'
  | 'remove'
  | 'playnext'
  | 'shuffle'
  | 'loop'
  | 'volume'
  | 'mute'
  | 'unmute'
  | 'search'
  | 'favorite'
  | 'favorites'
  | 'history'
  | 'playlist'
  | 'help';

export interface CommandSpec {
  name: CommandName;
  usage: string;
  description: string;
  takesText: boolean;
}

export const COMMAND_SPECS: CommandSpec[] = [
  { name: 'play', usage: '/play <song name or audio URL>', description: 'Play a local track or a direct audio link', takesText: true },
  { name: 'pause', usage: '/pause', description: 'Pause playback', takesText: false },
  { name: 'resume', usage: '/resume', description: 'Resume playback', takesText: false },
  { name: 'stop', usage: '/stop', description: 'Stop and return to the start', takesText: false },
  { name: 'skip', usage: '/skip', description: 'Skip to the next track', takesText: false },
  { name: 'previous', usage: '/previous', description: 'Go to the previous track', takesText: false },
  { name: 'restart', usage: '/restart', description: 'Restart the current track', takesText: false },
  { name: 'seek', usage: '/seek <time>  e.g. 1:30 or 90', description: 'Jump to a position', takesText: true },
  { name: 'nowplaying', usage: '/nowplaying', description: 'Show the current track', takesText: false },
  { name: 'queue', usage: '/queue', description: 'Show the playback queue', takesText: false },
  { name: 'clear', usage: '/clear', description: 'Empty the queue', takesText: false },
  { name: 'remove', usage: '/remove <position>', description: 'Remove a queue entry by its number', takesText: true },
  { name: 'playnext', usage: '/playnext <song name or audio URL>', description: 'Queue a track to play next', takesText: true },
  { name: 'shuffle', usage: '/shuffle', description: 'Toggle shuffle', takesText: false },
  { name: 'loop', usage: '/loop <off|track|queue>', description: 'Set repeat mode', takesText: true },
  { name: 'volume', usage: '/volume <0-100>', description: 'Set the volume percentage', takesText: true },
  { name: 'mute', usage: '/mute', description: 'Mute audio', takesText: false },
  { name: 'unmute', usage: '/unmute', description: 'Unmute audio', takesText: false },
  { name: 'search', usage: '/search <keyword>', description: 'Search your local library', takesText: true },
  { name: 'favorite', usage: '/favorite', description: 'Toggle favorite on the current track', takesText: false },
  { name: 'favorites', usage: '/favorites', description: 'List favorite tracks', takesText: false },
  { name: 'history', usage: '/history', description: 'List recently played tracks', takesText: false },
  { name: 'playlist', usage: '/playlist', description: 'List your playlists', takesText: false },
  { name: 'help', usage: '/help', description: 'Show all commands', takesText: false },
];

export type ParsedCommand =
  | {
      ok: true;
      name: CommandName;
      text: string;
      seconds?: number;
      position?: number;
      loop?: RepeatMode;
      volume?: number;
    }
  | { ok: false; error: string };

const NO_ARGS_COMMANDS = new Set<CommandName>(
  COMMAND_SPECS.filter((spec) => !spec.takesText).map((spec) => spec.name)
);

// Accepts "90", "1:30", or "1:02:05". Returns seconds or null when the value is malformed.
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed);
  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  if (!parts.every((part) => /^\d+$/.test(part))) return null;
  const numbers = parts.map(Number);
  if (numbers.slice(1).some((n) => n >= 60)) return null;
  return numbers.reduce((total, n) => total * 60 + n, 0);
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Type a command. Commands start with /. Try /help.' };
  if (!trimmed.startsWith('/')) {
    return { ok: false, error: 'Commands start with /. Try /play <song name or audio URL> or /help.' };
  }

  const [rawName = '', ...rest] = trimmed.slice(1).split(/\s+/);
  const name = rawName.toLowerCase();
  const text = rest.join(' ').trim();
  const known = COMMAND_SPECS.find((spec) => spec.name === name);

  if (!known) {
    const suggestions = COMMAND_SPECS.filter((spec) => spec.name.startsWith(name)).map((spec) => `/${spec.name}`);
    const hint = suggestions.length ? ` Did you mean ${suggestions.join(', ')}?` : '';
    return { ok: false, error: `Unknown command "/${rawName}".${hint} Type /help for the full list.` };
  }

  const commandName = known.name;

  if (NO_ARGS_COMMANDS.has(commandName) && text) {
    return { ok: false, error: `/${commandName} does not take arguments. Usage: ${known.usage}` };
  }

  switch (commandName) {
    case 'play':
    case 'playnext':
    case 'search':
      if (!text) return { ok: false, error: `Usage: ${known.usage}` };
      return { ok: true, name: commandName, text };

    case 'seek': {
      if (!text) return { ok: false, error: `Usage: ${known.usage}` };
      const seconds = parseTimeInput(text);
      if (seconds === null) return { ok: false, error: 'Time must look like 90 (seconds) or 1:30 (minutes:seconds).' };
      return { ok: true, name: commandName, text, seconds };
    }

    case 'remove': {
      if (!/^\d+$/.test(text) || Number(text) < 1) {
        return { ok: false, error: `Usage: ${known.usage}. The position must be a whole number, starting at 1.` };
      }
      return { ok: true, name: commandName, text, position: Number(text) };
    }

    case 'loop': {
      const mode = text.toLowerCase();
      if (mode === 'off') return { ok: true, name: commandName, text, loop: 'off' };
      if (mode === 'track') return { ok: true, name: commandName, text, loop: 'one' };
      if (mode === 'queue') return { ok: true, name: commandName, text, loop: 'all' };
      return { ok: false, error: `Usage: ${known.usage}` };
    }

    case 'volume': {
      if (!/^\d{1,3}$/.test(text) || Number(text) > 100) {
        return { ok: false, error: `Usage: ${known.usage}. Enter a whole number from 0 to 100.` };
      }
      return { ok: true, name: commandName, text, volume: Number(text) };
    }

    default:
      return { ok: true, name: commandName, text };
  }
}
