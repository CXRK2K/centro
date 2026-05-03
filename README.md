# Centro

A personal dashboard for your morning. Auto-launches at startup with tasks, calendar, notes, weather, and a clock on a drag-and-drop grid. Cross-platform (Windows + macOS), local-first, MIT-licensed.

![Centro screenshot](docs/screenshot.png)

## Features (v0.1.0)

- **Drag-and-drop grid** with persisted layouts.
- **5 widgets out of the box** — Time, Tasks, Notes, Weather (Open-Meteo, no account), Calendar (Google Calendar, read-only).
- **Connector model** — every widget asks a connector for data, so swapping data sources is easy later.
- **Local-first storage** — tasks and notes live in a private SQLite file on your device. Tokens go in your OS keychain. No telemetry, no servers.
- **Launch at login** + **system tray** + **configurable global hotkey** (default `⌘/Ctrl + ⇧ + Space`).
- **Light / dark / system** theme.

## Install

### Download a release (recommended)

Grab the installer for your platform from [Releases](https://github.com/CXRK2K/centro/releases):

- **macOS** — download `Centro_<version>_universal.dmg`, drag Centro into Applications. The first launch may complain because the app is unsigned: right-click → Open → Open.
- **Windows** — download `Centro_<version>_x64_en-US.msi`, run it. SmartScreen may warn — click *More info* → *Run anyway*.

### Build from source

Requirements: Node 20+ (Corepack enabled), Rust 1.77+, plus the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```bash
git clone https://github.com/CXRK2K/centro.git
cd centro
pnpm install
pnpm tauri dev          # development, hot-reload renderer
pnpm tauri build        # produce platform installer
```

## Setup: Google Calendar (optional)

The Calendar widget is opt-in. Until you configure OAuth credentials it shows a friendly *Configure Google OAuth* message; the rest of Centro works fine without it.

One-time, ~10 minutes:

1. <https://console.cloud.google.com> → create a project named **Centro**.
2. Enable the **Google Calendar API**.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → application type **Desktop app**.
4. Open `src-tauri/src/oauth_config.rs` and replace the two `REPLACE_ME` constants with your client ID and secret.
5. Rebuild Centro. Open Settings → Connectors → **Connect Google Calendar**. The browser opens for one-time authorization.

The "client secret" for installed apps is not actually a secret — Google ships it in their docs and Centro uses PKCE to protect the auth flow. Tokens never leave your machine; they're stored in the OS keychain (macOS Keychain / Windows Credential Manager).

## Customize

- **Add or remove widgets** — toolbar at top of the dashboard.
- **Move / resize** — drag the title bar to move; drag the bottom-right corner to resize.
- **Theme, hotkey, autostart, weather city, units** — Settings page.
- **Friends or family** can install their own copy and they'll get all the same features. The local SQLite file lives at `~/.centro/centro.db`.

## Roadmap (post v0.1.0)

- News + RSS widget
- Glassy / ambient theme
- Per-widget settings dialogs auto-rendered from Zod schemas
- Multiple dashboard pages
- Desktop-widget mode (always-on-bottom)
- Code signing + Tauri auto-updater
- Plugin SDK so anyone can author a widget
- Obsidian vault watcher, Todoist / Microsoft To Do, finance widgets

## Architecture

- **Tauri 2** Rust shell handles autostart, tray, global shortcut, SQLite, OAuth loopback, and OS keychain.
- **React 18 + TypeScript + Vite** renderer with **shadcn/ui + Tailwind**.
- **react-grid-layout** for the drag-drop grid.
- **TanStack Query** for connector data fetching.
- **Zustand** for client state.

Two key abstractions:

```ts
// Add a widget — drop a folder under src/widgets/<name>/, export a WidgetSpec.
interface WidgetSpec {
  type: string;
  title: string;
  description: string;
  icon: LucideIcon;
  defaultSize: { w: number; h: number };
  minSize: { w: number; h: number };
  component: React.FC<WidgetProps>;
  requiresConnectors?: string[];
}

// Add a data source — implement a Connector.
interface Connector {
  id: string;
  name: string;
  description: string;
  authKind: 'none' | 'apikey' | 'oauth';
  getStatus(): Promise<ConnectorStatus>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<R>(op: string, params?: unknown): Promise<R>;
}
```

## License

MIT — see [LICENSE](LICENSE).
