import { timeSpec } from './time';
import { tasksSpec } from './tasks';
import { notesSpec } from './notes';
import { weatherSpec } from './weather';
import { calendarSpec } from './calendar';
import type { WidgetSpec } from './types';

export const widgets: Record<string, WidgetSpec> = {
  [timeSpec.type]: timeSpec,
  [tasksSpec.type]: tasksSpec,
  [notesSpec.type]: notesSpec,
  [weatherSpec.type]: weatherSpec,
  [calendarSpec.type]: calendarSpec,
};

export const allWidgets: WidgetSpec[] = Object.values(widgets);

export function getWidget(type: string): WidgetSpec | undefined {
  return widgets[type];
}
