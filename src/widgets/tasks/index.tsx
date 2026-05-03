import { useState, KeyboardEvent } from 'react';
import { CheckSquare, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { localStoreConnector, type Task } from '@/connectors/local-store';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { WidgetSpec } from '../types';

function TasksWidget() {
  const qc = useQueryClient();
  const [text, setText] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['tasks', { includeDone: false }],
    queryFn: () => localStoreConnector.query<Task[]>('tasks.list', { includeDone: false, limit: 50 }),
  });

  const addM = useMutation({
    mutationFn: (t: string) => localStoreConnector.query('tasks.add', { text: t }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleM = useMutation({
    mutationFn: (vars: { id: string; done: boolean }) =>
      localStoreConnector.query('tasks.toggle', vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteM = useMutation({
    mutationFn: (id: string) => localStoreConnector.query('tasks.delete', { id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const submit = () => {
    const t = text.trim();
    if (t) addM.mutate(t);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit();
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="Add a task and press Enter…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onMouseDown={(e) => e.stopPropagation()}
        />
      </div>
      <ul className="flex-1 space-y-1 overflow-y-auto pr-1">
        {tasksQuery.isLoading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {tasksQuery.data?.length === 0 && (
          <li className="text-sm text-muted-foreground">All clear. Add a task above.</li>
        )}
        {tasksQuery.data?.map((t) => (
          <li
            key={t.id}
            className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/40"
          >
            <Checkbox
              checked={!!t.done}
              onCheckedChange={(v) => toggleM.mutate({ id: t.id, done: !!v })}
              onClick={(e) => e.stopPropagation()}
            />
            <span className={'flex-1 text-sm ' + (t.done ? 'line-through text-muted-foreground' : '')}>
              {t.text}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={() => deleteM.mutate(t.id)}
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export const tasksSpec: WidgetSpec = {
  type: 'tasks',
  title: 'Tasks',
  description: 'A simple checklist stored on this device.',
  icon: CheckSquare,
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 3, h: 3 },
  component: TasksWidget,
  requiresConnectors: ['local-store'],
};
