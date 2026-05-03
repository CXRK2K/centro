import { invoke } from '@tauri-apps/api/core';
import type { HotkeyChord } from './settings';

export async function rebindHotkey(chord: HotkeyChord): Promise<void> {
  await invoke('rebind_shortcut', { mods: chord.mods, key: chord.key });
}

export function chordLabel(chord: HotkeyChord): string {
  const parts = chord.mods
    .split('+')
    .map((m) => m.trim())
    .filter(Boolean)
    .map((m) => {
      const lower = m.toLowerCase();
      if (lower === 'cmd' || lower === 'meta' || lower === 'super') return '⌘';
      if (lower === 'ctrl' || lower === 'control') return 'Ctrl';
      if (lower === 'shift') return '⇧';
      if (lower === 'alt' || lower === 'option') return '⌥';
      return m;
    });
  parts.push(chord.key);
  return parts.join(' + ');
}

/** Capture a key chord from a keyboard event. */
export function chordFromEvent(e: KeyboardEvent): HotkeyChord | null {
  const mods: string[] = [];
  if (e.metaKey) mods.push('cmd');
  if (e.ctrlKey) mods.push('ctrl');
  if (e.shiftKey) mods.push('shift');
  if (e.altKey) mods.push('alt');

  const key = e.key;
  // Reject pure-modifier presses.
  if (
    key === 'Meta' ||
    key === 'Control' ||
    key === 'Shift' ||
    key === 'Alt' ||
    key === 'Dead'
  ) {
    return null;
  }
  // Need at least one modifier so it doesn't conflict with normal typing.
  if (mods.length === 0) return null;

  let normalized = key;
  if (key === ' ') normalized = 'Space';
  else if (key.length === 1) normalized = key.toUpperCase();

  return { mods: mods.join('+'), key: normalized };
}
