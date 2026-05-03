import { CloudSun } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { openMeteoConnector, weatherCodeLabel, type ForecastResult } from '@/connectors/open-meteo';
import { useStore } from '@/store';
import type { WidgetSpec } from '../types';

function WeatherWidget() {
  const city = useStore((s) => s.weatherCity);
  const unit = useStore((s) => s.weatherUnit);

  const q = useQuery({
    queryKey: ['weather', city, unit],
    queryFn: () => openMeteoConnector.query<ForecastResult>('forecast', { city, unit }),
    staleTime: 10 * 60_000,
  });

  if (q.isLoading) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (q.isError) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
        <span className="text-sm text-destructive">{(q.error as Error).message}</span>
        <span className="text-xs text-muted-foreground">Set the city in Settings.</span>
      </div>
    );
  }
  const f = q.data!;
  const cur = weatherCodeLabel(f.current.weather_code);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-semibold tabular-nums">{Math.round(f.current.temperature)}°</span>
            <span className="text-sm text-muted-foreground">{f.unit}</span>
          </div>
          <div className="text-xs text-muted-foreground">{f.geocode.name}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl">{cur.emoji}</div>
          <div className="text-xs text-muted-foreground">{cur.label}</div>
        </div>
      </div>
      <div className="mt-3 grid flex-1 grid-cols-3 gap-2">
        {f.daily.slice(1, 4).map((d) => {
          const w = weatherCodeLabel(d.weather_code);
          return (
            <div key={d.date} className="rounded-md bg-accent/40 p-2 text-center">
              <div className="text-[11px] uppercase text-muted-foreground">
                {format(parseISO(d.date), 'EEE')}
              </div>
              <div className="text-lg leading-tight">{w.emoji}</div>
              <div className="text-xs tabular-nums">
                {Math.round(d.temp_max)}° / {Math.round(d.temp_min)}°
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const weatherSpec: WidgetSpec = {
  type: 'weather',
  title: 'Weather',
  description: 'Current conditions and 3-day forecast.',
  icon: CloudSun,
  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 2 },
  component: WeatherWidget,
  requiresConnectors: ['open-meteo'],
};
