import { create } from 'zustand';
import type { HotkeyChord, ThemePref } from '../lib/settings';
import { DEFAULT_SETTINGS } from '../lib/settings';

interface CentroState {
  // Settings
  hotkey: HotkeyChord;
  theme: ThemePref;
  autostartEnabled: boolean;
  closeToTray: boolean;
  weatherCity: string;
  weatherUnit: 'C' | 'F';

  // Setters
  setHotkey: (h: HotkeyChord) => void;
  setTheme: (t: ThemePref) => void;
  setAutostartEnabled: (b: boolean) => void;
  setCloseToTray: (b: boolean) => void;
  setWeatherCity: (s: string) => void;
  setWeatherUnit: (u: 'C' | 'F') => void;
}

export const useStore = create<CentroState>((set) => ({
  hotkey: DEFAULT_SETTINGS.hotkey,
  theme: DEFAULT_SETTINGS.theme,
  autostartEnabled: DEFAULT_SETTINGS.autostartEnabled,
  closeToTray: DEFAULT_SETTINGS.closeToTray,
  weatherCity: DEFAULT_SETTINGS.weatherCity,
  weatherUnit: DEFAULT_SETTINGS.weatherUnit,
  setHotkey: (h) => set({ hotkey: h }),
  setTheme: (t) => set({ theme: t }),
  setAutostartEnabled: (b) => set({ autostartEnabled: b }),
  setCloseToTray: (b) => set({ closeToTray: b }),
  setWeatherCity: (s) => set({ weatherCity: s }),
  setWeatherUnit: (u) => set({ weatherUnit: u }),
}));
