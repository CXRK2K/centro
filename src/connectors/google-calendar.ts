import { invoke } from '@tauri-apps/api/core';
import { tokenGet, tokenSet, tokenDelete } from '@/lib/tokens';
import type { Connector, ConnectorStatus } from './types';

const TOKEN_KEY = 'google-calendar';

interface StoredTokens {
  access_token: string;
  refresh_token?: string | null;
  expires_at: number; // unix ms
  scope?: string | null;
}

export interface GoogleEvent {
  id: string;
  summary: string;
  start: string;        // ISO string
  end: string;          // ISO string
  allDay: boolean;
  location?: string;
  htmlLink?: string;
}

interface RawTokens {
  access_token: string;
  refresh_token?: string | null;
  expires_in: number;
  scope?: string | null;
}

interface EventsParams {
  from: string; // ISO
  to: string;   // ISO
  calendarId?: string;
}

async function loadTokens(): Promise<StoredTokens | null> {
  const raw = await tokenGet(TOKEN_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredTokens;
  } catch {
    return null;
  }
}

async function saveTokens(t: StoredTokens) {
  await tokenSet(TOKEN_KEY, JSON.stringify(t));
}

async function ensureFresh(t: StoredTokens): Promise<StoredTokens> {
  if (Date.now() < t.expires_at - 60_000) return t;
  if (!t.refresh_token) throw new Error('Refresh token missing — please reconnect.');
  const refreshed = await invoke<RawTokens>('oauth_refresh_google', {
    refreshToken: t.refresh_token,
  });
  const next: StoredTokens = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token ?? t.refresh_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
    scope: refreshed.scope ?? t.scope,
  };
  await saveTokens(next);
  return next;
}

export const googleCalendarConnector: Connector = {
  id: 'google-calendar',
  name: 'Google Calendar',
  description: 'Read-only access to your Google Calendar events.',
  authKind: 'oauth',

  async getStatus(): Promise<ConnectorStatus> {
    try {
      const configured = await invoke<boolean>('cmd_oauth_configured');
      if (!configured) return 'error';
      const t = await loadTokens();
      return t ? 'connected' : 'disconnected';
    } catch {
      return 'error';
    }
  },

  async connect() {
    const result = await invoke<RawTokens>('oauth_start_google');
    const t: StoredTokens = {
      access_token: result.access_token,
      refresh_token: result.refresh_token ?? null,
      expires_at: Date.now() + result.expires_in * 1000,
      scope: result.scope ?? null,
    };
    await saveTokens(t);
  },

  async disconnect() {
    await tokenDelete(TOKEN_KEY);
  },

  async query<R>(op: string, params: any = {}): Promise<R> {
    if (op !== 'events') throw new Error(`Unknown op: ${op}`);
    const p = params as EventsParams;
    const stored = await loadTokens();
    if (!stored) throw new Error('Not connected');
    const fresh = await ensureFresh(stored);

    const calId = encodeURIComponent(p.calendarId || 'primary');
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`);
    url.searchParams.set('timeMin', p.from);
    url.searchParams.set('timeMax', p.to);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '50');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${fresh.access_token}` },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Calendar API ${res.status}: ${body}`);
    }
    const json = await res.json();
    const events: GoogleEvent[] = (json.items ?? []).map((e: any) => {
      const start = e.start?.dateTime ?? e.start?.date;
      const end = e.end?.dateTime ?? e.end?.date;
      const allDay = !e.start?.dateTime;
      return {
        id: e.id,
        summary: e.summary ?? '(no title)',
        start,
        end,
        allDay,
        location: e.location,
        htmlLink: e.htmlLink,
      };
    });
    return events as unknown as R;
  },
};
