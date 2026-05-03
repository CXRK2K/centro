import type { LucideIcon } from 'lucide-react';

export interface WidgetProps {
  /** Stable instance id (key in layout). */
  instanceId: string;
}

export interface WidgetSpec {
  /** Widget type identifier (e.g. 'time', 'tasks'). */
  type: string;
  /** Human-readable name. */
  title: string;
  /** Short description shown in the Add Widget picker. */
  description: string;
  /** Icon displayed in chrome + picker. */
  icon: LucideIcon;
  /** Default cell size when added. */
  defaultSize: { w: number; h: number };
  /** Minimum cell size. */
  minSize: { w: number; h: number };
  /** The component rendered inside the WidgetFrame. */
  component: React.FC<WidgetProps>;
  /** Connectors that must be configured before the widget is useful. */
  requiresConnectors?: string[];
}
