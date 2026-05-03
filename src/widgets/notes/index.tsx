import { useState, KeyboardEvent } from 'react';
import { StickyNote, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { localStoreConnector, type Note } from '@/connectors/local-store';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { WidgetSpec } from '../types';

function NotesWidget() {
  const qc = useQueryClient();
  const [body, setBody] = useState('');

  const notesQuery = useQuery({
    queryKey: ['notes'],
    queryFn: () => localStoreConnector.query<Note[]>('notes.list', { limit: 20 }),
  });

  const addM = useMutation({
    mutationFn: (b: string) => localStoreConnector.query('notes.add', { body: b }),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => localStoreConnector.query('notes.delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const submit = () => {
    const b = body.trim();
    if (b) addM.mutate(b);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <Textarea
        placeholder="Quick capture… (⌘/Ctrl + Enter to save)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKey}
        onMouseDown={(e) => e.stopPropagation()}
        className="min-h-[64px] resize-none"
      />
      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        {notesQuery.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {notesQuery.data?.length === 0 && (
          <li className="text-sm text-muted-foreground">No notes yet — capture above.</li>
        )}
        {notesQuery.data?.map((n) => (
          <li
            key={n.id}
            className="group rounded-md border border-border/60 bg-background/60 p-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => deleteM.mutate(n.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatDistanceToNow(n.created_at, { addSuffix: true })}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const notesSpec: WidgetSpec = {
  type: 'notes',
  title: 'Notes',
  description: 'Quick capture for fleeting thoughts.',
  icon: StickyNote,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 3 },
  component: NotesWidget,
  requiresConnectors: ['local-store'],
};
