import { COMMAND_SPECS, type CommandSpec } from './commandParser';

export interface CommandSuggestion {
  key: string;
  insert: string;
  label: string;
  description: string;
}

export interface SuggestionSet {
  title: string;
  items: CommandSuggestion[];
  usage: CommandSpec | null;
}

const RECENT_LIMIT = 8;

export function getSuggestions(input: string, history: string[]): SuggestionSet {
  const text = input.trimStart();

  if (text === '') {
    return {
      title: 'Recent commands',
      usage: null,
      items: history.slice(0, RECENT_LIMIT).map((command) => ({
        key: `recent-${command}`,
        insert: command,
        label: command,
        description: 'Run again',
      })),
    };
  }

  if (!text.startsWith('/')) {
    return { title: '', items: [], usage: null };
  }

  const body = text.slice(1);
  const name = (body.split(/\s+/)[0] ?? '').toLowerCase();
  const exact = COMMAND_SPECS.find((spec) => spec.name === name) ?? null;

  if (/\s/.test(body)) {
    return { title: 'Usage', items: [], usage: exact };
  }

  return {
    title: 'Commands',
    usage: exact,
    items: COMMAND_SPECS.filter((spec) => spec.name.startsWith(name)).map((spec) => ({
      key: spec.name,
      insert: `/${spec.name}${spec.takesText ? ' ' : ''}`,
      label: spec.usage,
      description: spec.description,
    })),
  };
}
