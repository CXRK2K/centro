import { localStoreConnector } from './local-store';
import { openMeteoConnector } from './open-meteo';
import { googleCalendarConnector } from './google-calendar';
import type { Connector } from './types';

export const connectors: Record<string, Connector> = {
  [localStoreConnector.id]: localStoreConnector,
  [openMeteoConnector.id]: openMeteoConnector,
  [googleCalendarConnector.id]: googleCalendarConnector,
};

export const allConnectors: Connector[] = Object.values(connectors);

export function getConnector(id: string): Connector {
  const c = connectors[id];
  if (!c) throw new Error(`Unknown connector: ${id}`);
  return c;
}
