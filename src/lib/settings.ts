// Settings persisted in the SQLite `settings` table (key/value).

import { db, now } from './db';

export type ThemePref = 'light' | 'dark' | 'system';

export interface HotkeyChord {
  mods: string; // e.g. "ctrl+shift" (Mac uses "cmd+shift")
  key: string;  // e.g. "Space"
}

export interface Settings {
  hotkey: HotkeyChord;
  theme: ThemePref;
  autostartEnabled: boolean;
  closeToTray: boolean;
  weatherCity: string;
  weatherUnit: 'C' | 'F';
}

const isMac =
  typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || '');

export const DEFAULT_SETTINGS: Settings = {
  hotkey: { mods: isMac ? 'cmd+shift' : 'ctrl+shift', key: 'Space' },
  theme: 'system',
  autostartEnabled: false,
  closeToTray: true,
  weatherCity: 'Washington DC',
  weatherUnit: 'F',
};

async function getRaw(key: string): Promise<string | null> {
  const rows = await (await db()).select<{ value: string }[]>(
    'SELECT value FROM settings WHERE key = $1',
    [key]
  );
  return rows[0]?.value ?? null;
}

async function setRaw(key: string, value: string): Promise<void> {
  await (await db()).execute(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, now()]
  );
}

export async function initSettings(): Promise<Settings> {
  const out: Settings = { ...DEFAULT_SETTINGS };
  const keys: (keyof Settings)[] = [
    'hotkey',
    'theme',
    'autostartEnabled',
    'closeToTray',
    'weatherCity',
    'weatherUnit',
  ];
  for (const k of keys) {
    const raw = await getRaw(k);
    if (raw == null) continue;
    try {
      (out as any)[k] = JSON.parse(raw);
    } catch {
      // ignore corrupt value, keep default
    }
  }
  return out;
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K]
): Promise<void> {
  await setRaw(key, JSON.stringify(value));
}
