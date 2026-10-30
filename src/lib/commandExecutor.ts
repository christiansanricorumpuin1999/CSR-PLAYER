import { COMMAND_SPECS, parseCommand, type ParsedCommand } from './commandParser';
import { formatTime } from './formatTime';
import { getAllPlaylists, getAllTracks, getRecentlyPlayedTracks, getTrack, saveTrack } from './db';
import { createStreamTrack } from './streamTrack';
import type { CommandResult, PlayerControls, RepeatMode, Track } from './types';

const SEARCH_LIMIT = 8;
const LIST_LIMIT = 15;
const LOOP_LABELS: Record<RepeatMode, string> = { off: 'off', one: 'track', all: 'queue' };

const ok = (action: string, message: string): CommandResult => ({ success: true, action, message });
const fail = (action: string, message: string): CommandResult => ({ success: false, action, message });

function describeTrack(track: Track): string {
  return track.artist ? `${track.title} by ${track.artist}` : track.title;
}

function scoreTrack(track: Track, needle: string): number {
  const title = track.title.toLowerCase();
  if (title === needle) return 100;
  if (title.startsWith(needle)) return 80;
  if (title.includes(needle)) return 60;
  if (track.artist?.toLowerCase().includes(needle)) return 40;
  if (track.fileName?.toLowerCase().includes(needle)) return 20;
  return 0;
}

async function searchLibrary(query: string): Promise<Track[]> {
  const needle = query.trim().toLowerCase();
  const tracks = await getAllTracks();
  return tracks
    .map((track) => ({ track, score: scoreTrack(track, needle) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title))
    .map((entry) => entry.track);
}

type PlayTargetResult = { ok: true; track: Track } | { ok: false; error: string };

async function resolvePlayTarget(text: string): Promise<PlayTargetResult> {
  if (/^https?:\/\//i.test(text)) {
    const created = createStreamTrack(text);
    if (!created.ok) return created;
    const saved = await getTrack(created.track.id);
    if (saved) return { ok: true, track: saved };
    await saveTrack(created.track);
    return { ok: true, track: created.track };
  }

  const [best] = await searchLibrary(text);
  if (!best) {
    return {
      ok: false,
      error: `No track in your library matches "${text}". Use /search to browse, or paste a direct audio link.`,
    };
  }
  return { ok: true, track: best };
}

async function runPlay(parsed: Extract<ParsedCommand, { ok: true }>, player: PlayerControls): Promise<CommandResult> {
  const target = await resolvePlayTarget(parsed.text);
  if (!target.ok) return fail('play', target.error);

  if (!player.currentTrack) {
    await player.playTrack(target.track);
    return ok('play', `Now playing: ${describeTrack(target.track)}`);
  }

  player.addToQueue(target.track);
  return ok('play', `Added to the queue at position ${player.queue.length + 1}: ${describeTrack(target.track)}`);
}

async function runPlayNext(parsed: Extract<ParsedCommand, { ok: true }>, player: PlayerControls): Promise<CommandResult> {
  const target = await resolvePlayTarget(parsed.text);
  if (!target.ok) return fail('playnext', target.error);

  if (!player.currentTrack) {
    await player.playTrack(target.track);
    return ok('playnext', `Now playing: ${describeTrack(target.track)}`);
  }

  player.insertNext(target.track);
  return ok('playnext', `Will play next: ${describeTrack(target.track)}`);
}

async function runSearch(parsed: Extract<ParsedCommand, { ok: true }>): Promise<CommandResult> {
  const matches = await searchLibrary(parsed.text);
  if (matches.length === 0) return fail('search', `No tracks in your library match "${parsed.text}".`);

  const lines = matches
    .slice(0, SEARCH_LIMIT)
    .map((track, i) => `${i + 1}. ${describeTrack(track)}`);
  const extra = matches.length > SEARCH_LIMIT ? `\n...and ${matches.length - SEARCH_LIMIT} more` : '';
  return ok('search', `Found ${matches.length} track${matches.length === 1 ? '' : 's'}:\n${lines.join('\n')}${extra}\nUse /play with a title to start one.`);
}

async function runFavorites(): Promise<CommandResult> {
  const favorites = (await getAllTracks())
    .filter((track) => track.isFavorite)
    .sort((a, b) => a.title.localeCompare(b.title));
  if (favorites.length === 0) return ok('favorites', 'You have no favorites yet. Use /favorite while a track is loaded.');

  const lines = favorites.slice(0, LIST_LIMIT).map((track, i) => `${i + 1}. ${describeTrack(track)}`);
  const extra = favorites.length > LIST_LIMIT ? `\n...and ${favorites.length - LIST_LIMIT} more` : '';
  return ok('favorites', `Favorites (${favorites.length}):\n${lines.join('\n')}${extra}`);
}

async function runHistory(): Promise<CommandResult> {
  const recent = await getRecentlyPlayedTracks(10);
  if (recent.length === 0) return ok('history', 'No playback history yet.');
  const lines = recent.map((track, i) => `${i + 1}. ${describeTrack(track)}`);
  return ok('history', `Recently played:\n${lines.join('\n')}`);
}

async function runPlaylists(): Promise<CommandResult> {
  const playlists = await getAllPlaylists();
  if (playlists.length === 0) return ok('playlist', 'You have no playlists yet.');
  const lines = playlists.map((p) => `${p.name} (${p.trackIds.length} track${p.trackIds.length === 1 ? '' : 's'})`);
  return ok('playlist', `Playlists:\n${lines.join('\n')}`);
}

function runQueue(player: PlayerControls): CommandResult {
  if (player.queue.length === 0) return ok('queue', 'The queue is empty.');

  const lines = player.queue.slice(0, LIST_LIMIT).map((item, i) => {
    const marker = i === player.queueIndex ? '>' : ' ';
    return `${marker} ${i + 1}. ${describeTrack(item.track)}`;
  });
  const extra = player.queue.length > LIST_LIMIT ? `\n  ...and ${player.queue.length - LIST_LIMIT} more` : '';
  return ok('queue', `Queue (${player.queue.length}):\n${lines.join('\n')}${extra}`);
}

function runNowPlaying(player: PlayerControls): CommandResult {
  const track = player.currentTrack;
  if (!track) return fail('nowplaying', 'Nothing is loaded. Use /play to start a track.');

  const timing = player.duration > 0
    ? `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`
    : formatTime(player.currentTime);
  const state = player.status === 'playing' ? 'Playing' : player.status === 'loading' ? 'Loading' : 'Paused';
  const volume = player.isMuted ? 'Muted' : `Volume ${Math.round(player.volume * 100)}%`;
  const details = [
    `${state} at ${timing}`,
    volume,
    `Loop ${LOOP_LABELS[player.repeatMode]}`,
    `Shuffle ${player.isShuffle ? 'on' : 'off'}`,
  ];
  return ok('nowplaying', `${describeTrack(track)}\n${details.join(' | ')}`);
}

function runVolume(parsed: Extract<ParsedCommand, { ok: true }>, player: PlayerControls): CommandResult {
  const percent = parsed.volume ?? 0;
  player.setVolume(percent / 100);
  const suffix = player.isMuted ? ' Audio is muted; use /unmute to hear it.' : '';
  return ok('volume', `Volume set to ${percent}%.${suffix}`);
}

async function runFavorite(player: PlayerControls): Promise<CommandResult> {
  const track = player.currentTrack;
  if (!track) return fail('favorite', 'Nothing is loaded. Play a track before using /favorite.');
  const next = await player.toggleFavorite(track.id);
  if (next === null) return fail('favorite', 'Could not update favorites for this track.');
  return ok('favorite', next ? 'Added to favorites.' : 'Removed from favorites.');
}

export async function runCommand(input: string, player: PlayerControls): Promise<CommandResult> {
  const parsed = parseCommand(input);
  if (!parsed.ok) return fail('invalid', parsed.error);

  try {
    switch (parsed.name) {
      case 'play':
        return await runPlay(parsed, player);
      case 'playnext':
        return await runPlayNext(parsed, player);
      case 'search':
        return await runSearch(parsed);
      case 'favorites':
        return await runFavorites();
      case 'history':
        return await runHistory();
      case 'playlist':
        return await runPlaylists();
      case 'favorite':
        return await runFavorite(player);

      case 'pause':
        if (!player.currentTrack) return fail('pause', 'Nothing is playing.');
        if (player.status === 'paused') return ok('pause', 'Playback is already paused.');
        player.pause();
        return ok('pause', 'Paused.');

      case 'resume':
        if (!player.currentTrack) return fail('resume', 'Nothing is loaded. Use /play to start a track.');
        if (player.status === 'playing') return ok('resume', 'Playback is already running.');
        player.resume();
        return ok('resume', 'Resumed.');

      case 'stop':
        if (!player.currentTrack) return fail('stop', 'Nothing is playing.');
        player.pause();
        player.seek(0);
        return ok('stop', 'Stopped. Use /resume to play from the beginning.');

      case 'restart':
        if (!player.currentTrack) return fail('restart', 'Nothing is loaded.');
        player.seek(0);
        player.resume();
        return ok('restart', 'Restarted the current track.');

      case 'seek': {
        if (!player.currentTrack) return fail('seek', 'Nothing is playing.');
        const seconds = parsed.seconds ?? 0;
        if (player.duration > 0 && seconds > player.duration) {
          return fail('seek', `That is past the end of the track (${formatTime(player.duration)}).`);
        }
        player.seek(seconds);
        return ok('seek', `Jumped to ${formatTime(seconds)}.`);
      }

      case 'nowplaying':
        return runNowPlaying(player);

      case 'queue':
        return runQueue(player);

      case 'clear': {
        const removed = player.queue.length - (player.queueIndex >= 0 ? 1 : 0);
        if (removed <= 0) return ok('clear', 'The queue is already empty.');
        player.clearUpcoming();
        return ok('clear', `Removed ${removed} track${removed === 1 ? '' : 's'} from the queue. The current track keeps playing.`);
      }

      case 'remove': {
        const position = parsed.position ?? 0;
        if (position > player.queue.length) {
          return fail('remove', `There is no track at position ${position}. The queue has ${player.queue.length}.`);
        }
        const index = position - 1;
        if (index === player.queueIndex) {
          return fail('remove', 'That track is playing now. Use /skip first, then remove it.');
        }
        const item = player.queue[index];
        player.removeFromQueue(item.id);
        return ok('remove', `Removed from the queue: ${describeTrack(item.track)}`);
      }

      case 'shuffle':
        player.toggleShuffle();
        return ok('shuffle', `Shuffle is now ${player.isShuffle ? 'OFF' : 'ON'}.`);

      case 'loop':
        if (!parsed.loop) return fail('loop', 'Usage: /loop off, /loop track, or /loop queue.');
        player.setRepeatMode(parsed.loop);
        return ok('loop', `Loop set to ${LOOP_LABELS[parsed.loop]}.`);

      case 'volume':
        return runVolume(parsed, player);

      case 'mute':
        if (player.isMuted) return ok('mute', 'Audio is already muted.');
        player.setMuted(true);
        return ok('mute', 'Muted.');

      case 'unmute':
        if (!player.isMuted) return ok('unmute', 'Audio is already on.');
        player.setMuted(false);
        return ok('unmute', 'Unmuted.');

      case 'skip':
        if (!player.skipNext()) return fail('skip', 'There is no next track in the queue.');
        return ok('skip', 'Skipped to the next track.');

      case 'previous':
        if (!player.playPrevious()) return fail('previous', 'There is no previous track in the queue.');
        return ok('previous', 'Went back to the previous track.');

      case 'help': {
        const lines = COMMAND_SPECS.map((spec) => `${spec.usage} - ${spec.description}`);
        return ok('help', `Commands:\n${lines.join('\n')}`);
      }
    }
  } catch {
    return fail(parsed.name, 'Something went wrong while reading your library. Please try again.');
  }
}
