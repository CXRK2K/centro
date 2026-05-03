// Grid layout helpers + persistence.
import type { Layout } from 'react-grid-layout';
import { db, now } from './db';

export const GRID_COLS = 12;
export const GRID_ROW_HEIGHT = 60;
export const GRID_MARGIN: [number, number] = [12, 12];

/** Default layout used on first launch. Matches the plan exactly. */
export const DEFAULT_LAYOUT: Layout[] = [
  { i: 'time-1',     x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: 'calendar-1', x: 4, y: 0, w: 8, h: 4, minW: 3, minH: 3 },
  { i: 'tasks-1',    x: 0, y: 2, w: 6, h: 4, minW: 3, minH: 3 },
  { i: 'notes-1',    x: 6, y: 4, w: 6, h: 4, minW: 3, minH: 3 },
  { i: 'weather-1',  x: 0, y: 6, w: 4, h: 2, minW: 2, minH: 2 },
];

/** Map of grid id -> widget type. Stored alongside layout. */
export type WidgetInstanceMap = Record<string, string>;

export const DEFAULT_INSTANCES: WidgetInstanceMap = {
  'time-1': 'time',
  'calendar-1': 'calendar',
  'tasks-1': 'tasks',
  'notes-1': 'notes',
  'weather-1': 'weather',
};

interface PersistedLayout {
  layout: Layout[];
  instances: WidgetInstanceMap;
}

export async function loadLayout(): Promise<PersistedLayout> {
  const rows = await (await db()).select<{ data: string }[]>(
    "SELECT data FROM layouts WHERE id = 'default'"
  );
  if (!rows[0]) {
    return { layout: DEFAULT_LAYOUT, instances: DEFAULT_INSTANCES };
  }
  try {
    const parsed = JSON.parse(rows[0].data);
    return {
      layout: parsed.layout ?? DEFAULT_LAYOUT,
      instances: parsed.instances ?? DEFAULT_INSTANCES,
    };
  } catch {
    return { layout: DEFAULT_LAYOUT, instances: DEFAULT_INSTANCES };
  }
}

export async function saveLayout(p: PersistedLayout): Promise<void> {
  await (await db()).execute(
    `INSERT INTO layouts (id, data, updated_at) VALUES ('default', $1, $2)
     ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`,
    [JSON.stringify(p), now()]
  );
}

/** Find the next free position for a new widget at the given size. Simple stack-from-top approach. */
export function nextFreeCell(
  layout: Layout[],
  size: { w: number; h: number }
): { x: number; y: number } {
  const maxY = layout.reduce((m, it) => Math.max(m, it.y + it.h), 0);
  return { x: 0, y: maxY };
}
