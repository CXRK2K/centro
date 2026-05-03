import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Connector, ConnectorStatus } from '@/connectors/types';

export function ConnectorRow({ connector }: { connector: Connector }) {
  const [status, setStatus] = useState<ConnectorStatus | 'loading'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const s = await connector.getStatus();
      setStatus(s);
    } catch (e) {
      setStatus('error');
    }
  };

  useEffect(() => {
    refresh();
  }, [connector.id]);

  const handle = async (action: 'connect' | 'disconnect') => {
    setBusy(true);
    setError(null);
    try {
      if (action === 'connect') await connector.connect();
      else await connector.disconnect();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const isConnected = status === 'connected';
  const variantFor = (s: typeof status) =>
    s === 'connected' ? 'success' : s === 'error' ? 'destructive' : s === 'loading' ? 'secondary' : 'outline';

  return (
    <div className="flex items-center justify-between gap-4 rounded-md border border-border/60 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{connector.name}</span>
          <Badge variant={variantFor(status) as any}>
            {status === 'loading' ? '…' : status}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">{connector.description}</p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      {connector.authKind !== 'none' && (
        <div className="shrink-0">
          {isConnected ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => handle('disconnect')}>
              {busy ? '…' : 'Disconnect'}
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => handle('connect')}>
              {busy ? '…' : 'Connect'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
