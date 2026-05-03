import { X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WidgetSpec } from './types';

interface Props {
  spec: WidgetSpec;
  onRemove: () => void;
  children: React.ReactNode;
}

export function WidgetFrame({ spec, onRemove, children }: Props) {
  const Icon = spec.icon;
  return (
    <Card className="flex h-full w-full flex-col overflow-hidden">
      <CardHeader className={cn('widget-drag-handle flex-row items-center justify-between space-y-0 py-2 cursor-grab active:cursor-grabbing select-none')}>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {spec.title}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          aria-label={`Remove ${spec.title}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pt-0">{children}</CardContent>
    </Card>
  );
}
