import { useEffect, useState } from 'react';
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as autostartIsEnabled,
} from '@tauri-apps/plugin-autostart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HotkeyInput } from '@/components/HotkeyInput';
import { ConnectorRow } from '@/components/ConnectorRow';
import { allConnectors } from '@/connectors/registry';
import { saveSetting } from '@/lib/settings';
import { rebindHotkey } from '@/lib/hotkey';
import { useStore } from '@/store';

const APP_VERSION = '0.1.0';

export default function Settings() {
  const {
    hotkey, setHotkey,
    theme, setTheme,
    autostartEnabled, setAutostartEnabled,
    closeToTray, setCloseToTray,
    weatherCity, setWeatherCity,
    weatherUnit, setWeatherUnit,
  } = useStore();

  const [cityDraft, setCityDraft] = useState(weatherCity);
  const [autostartError, setAutostartError] = useState<string | null>(null);

  // Keep autostart store value in sync with the actual OS state on mount.
  useEffect(() => {
    (async () => {
      try {
        const real = await autostartIsEnabled();
        if (real !== autostartEnabled) {
          setAutostartEnabled(real);
          await saveSetting('autostartEnabled', real);
        }
      } catch {
        /* ignore — autostart plugin may not be available in dev */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onToggleAutostart = async (next: boolean) => {
    setAutostartError(null);
    try {
      if (next) await enableAutostart();
      else await disableAutostart();
      setAutostartEnabled(next);
      await saveSetting('autostartEnabled', next);
    } catch (e) {
      setAutostartError((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <Select
              value={theme}
              onValueChange={(v) => {
                const t = v as typeof theme;
                setTheme(t);
                saveSetting('theme', t);
              }}
            >
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Startup &amp; window</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Launch at login</Label>
              <p className="text-xs text-muted-foreground">Open Centro when you log in.</p>
            </div>
            <Switch checked={autostartEnabled} onCheckedChange={onToggleAutostart} />
          </div>
          {autostartError && <p className="text-xs text-destructive">{autostartError}</p>}
          <div className="flex items-center justify-between">
            <div>
              <Label>Close to tray</Label>
              <p className="text-xs text-muted-foreground">
                Hide the window instead of quitting when you click the close button.
              </p>
            </div>
            <Switch
              checked={closeToTray}
              onCheckedChange={(v) => {
                setCloseToTray(v);
                saveSetting('closeToTray', v);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Global hotkey</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Press to toggle the dashboard window from anywhere.
          </p>
          <HotkeyInput
            value={hotkey}
            onChange={async (chord) => {
              setHotkey(chord);
              await saveSetting('hotkey', chord);
              try {
                await rebindHotkey(chord);
              } catch (e) {
                console.error('rebind failed', e);
              }
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Weather</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="city">City</Label>
            <div className="mt-1 flex gap-2">
              <Input
                id="city"
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                placeholder="e.g. Washington DC"
              />
              <Button
                onClick={async () => {
                  const v = cityDraft.trim();
                  if (!v) return;
                  setWeatherCity(v);
                  await saveSetting('weatherCity', v);
                }}
              >
                Save
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label>Units</Label>
            <Select
              value={weatherUnit}
              onValueChange={(v) => {
                const u = v as 'C' | 'F';
                setWeatherUnit(u);
                saveSetting('weatherUnit', u);
              }}
            >
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="F">Fahrenheit</SelectItem>
                <SelectItem value="C">Celsius</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Connectors</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {allConnectors.map((c) => (
            <ConnectorRow key={c.id} connector={c} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>About</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="tabular-nums">{APP_VERSION}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">License</span>
            <span>MIT</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GitHub</span>
            <a
              href="https://github.com/CXRK2K/centro"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              CXRK2K/centro
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
