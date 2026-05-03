import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import type { WidgetSpec } from '../types';

function TimeWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-1 py-2">
      <div className="text-5xl font-semibold tabular-nums tracking-tight">
        {format(now, 'h:mm')}
        <span className="ml-1 text-2xl text-muted-foreground">{format(now, 'a')}</span>
      </div>
      <div className="text-sm text-muted-foreground">{format(now, 'EEEE, MMMM d')}</div>
    </div>
  );
}

export const timeSpec: WidgetSpec = {
  type: 'time',
  title: 'Time',
  description: 'Live clock and date.',
  icon: Clock,
  defaultSize: { w: 4, h: 2 },
  minSize: { w: 2, h: 2 },
  component: TimeWidget,
};
