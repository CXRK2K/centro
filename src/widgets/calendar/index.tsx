import { Calendar as CalIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isSameDay, addDays, startOfDay } from 'date-fns';
import { googleCalendarConnector, type GoogleEvent } from '@/connectors/google-calendar';
import type { WidgetSpec } from '../types';

function CalendarWidget() {
  const statusQ = useQuery({
    queryKey: ['google-calendar', 'status'],
    queryFn: () => googleCalendarConnector.getStatus(),
    refetchInterval: 30_000,
  });

  const eventsQ = useQuery({
    queryKey: ['google-calendar', 'events', new Date().toDateString()],
    enabled: statusQ.data === 'connected',
    queryFn: () => {
      const today = startOfDay(new Date());
      const end = addDays(today, 8);
      return googleCalendarConnector.query<GoogleEvent[]>('events', {
        from: today.toISOString(),
        to: end.toISOString(),
      });
    },
    staleTime: 5 * 60_000,
  });

  if (statusQ.data === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm">
        <p className="font-medium">Configure Google OAuth</p>
        <p className="text-xs text-muted-foreground">
          See <code className="rounded bg-accent/40 px-1">src-tauri/src/oauth_config.rs</code>
        </p>
      </div>
    );
  }
  if (statusQ.data === 'disconnected') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-sm">
        <p className="font-medium">Not connected</p>
        <p className="text-xs text-muted-foreground">
          Open Settings → Connectors → Connect Google Calendar.
        </p>
      </div>
    );
  }
  if (eventsQ.isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (eventsQ.isError) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        {(eventsQ.error as Error).message}
      </div>
    );
  }

  const events = eventsQ.data ?? [];
  const today = startOfDay(new Date());

  // Group by day.
  const byDay = new Map<string, GoogleEvent[]>();
  for (const e of events) {
    const day = format(parseISO(e.start), 'yyyy-MM-dd');
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(e);
  }
  const dayKeys = Array.from(byDay.keys()).sort();

  if (dayKeys.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Nothing scheduled in the next week.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {dayKeys.map((day) => {
        const date = parseISO(day);
        const isToday = isSameDay(date, today);
        return (
          <li key={day}>
            <div className="mb-1 flex items-baseline gap-2">
              <span
                className={
                  'text-xs font-semibold uppercase tracking-wide ' +
                  (isToday ? 'text-primary' : 'text-muted-foreground')
                }
              >
                {isToday ? 'Today' : format(date, 'EEE, MMM d')}
              </span>
            </div>
            <ul className="space-y-1">
              {byDay.get(day)!.map((e) => (
                <li key={e.id} className="rounded-md border border-border/60 bg-background/60 px-2 py-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium leading-tight">{e.summary}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {e.allDay ? 'All day' : format(parseISO(e.start), 'h:mm a')}
                    </span>
                  </div>
                  {e.location && <div className="text-[11px] text-muted-foreground">{e.location}</div>}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
}

export const calendarSpec: WidgetSpec = {
  type: 'calendar',
  title: 'Calendar',
  description: 'Today + the week ahead from Google Calendar.',
  icon: CalIcon,
  defaultSize: { w: 8, h: 4 },
  minSize: { w: 3, h: 3 },
  component: CalendarWidget,
  requiresConnectors: ['google-calendar'],
};
