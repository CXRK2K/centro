import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import { useStore } from './store';
import { initSettings } from './lib/settings';

type Page = 'dashboard' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const setHotkey = useStore((s) => s.setHotkey);
  const setTheme = useStore((s) => s.setTheme);
  const setAutostartEnabled = useStore((s) => s.setAutostartEnabled);
  const setCloseToTray = useStore((s) => s.setCloseToTray);
  const setWeatherCity = useStore((s) => s.setWeatherCity);
  const setWeatherUnit = useStore((s) => s.setWeatherUnit);
  const [bootstrapped, setBootstrapped] = useState(false);

  // One-time settings hydration on boot.
  useEffect(() => {
    (async () => {
      const s = await initSettings();
      setHotkey(s.hotkey);
      setTheme(s.theme);
      setAutostartEnabled(s.autostartEnabled);
      setCloseToTray(s.closeToTray);
      setWeatherCity(s.weatherCity);
      setWeatherUnit(s.weatherUnit);
      setBootstrapped(true);
    })();
  }, [setHotkey, setTheme, setAutostartEnabled, setCloseToTray, setWeatherCity, setWeatherUnit]);

  // Tray "Settings" menu item navigates here.
  useEffect(() => {
    const unlisten = listen('centro:open-settings', () => setPage('settings'));
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  if (!bootstrapped) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
            C
          </div>
          <span className="text-lg font-semibold">Centro</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavButton active={page === 'dashboard'} onClick={() => setPage('dashboard')}>
            Dashboard
          </NavButton>
          <NavButton active={page === 'settings'} onClick={() => setPage('settings')}>
            Settings
          </NavButton>
        </nav>
      </header>
      <main className="px-6 py-4">
        {page === 'dashboard' ? <Dashboard /> : <Settings />}
      </main>
    </div>
  );
}

function NavButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors ' +
        (active
          ? 'bg-secondary text-secondary-foreground'
          : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground')
      }
    >
      {children}
    </button>
  );
}
