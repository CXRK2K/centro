export type ConnectorStatus = 'disconnected' | 'connected' | 'error';
export type AuthKind = 'none' | 'apikey' | 'oauth';

export interface ConnectorMeta {
  id: string;
  name: string;
  description: string;
  authKind: AuthKind;
}

export interface Connector extends ConnectorMeta {
  /** Read live status (e.g. checks for stored token). */
  getStatus(): Promise<ConnectorStatus>;
  /** Trigger the connect flow (OAuth, etc.). */
  connect(): Promise<void>;
  /** Forget any stored credentials. */
  disconnect(): Promise<void>;
  /** Generic query operation. */
  query<R>(op: string, params?: unknown): Promise<R>;
}
