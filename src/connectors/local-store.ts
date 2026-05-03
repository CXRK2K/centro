import { v4 as uuid } from 'uuid';
import { db, now } from '@/lib/db';
import type { Connector } from './types';

export interface Task {
  id: string;
  text: string;
  done: boolean;
  due_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Note {
  id: string;
  body: string;
  created_at: number;
  updated_at: number;
}

interface ListTasksParams {
  includeDone?: boolean;
  limit?: number;
}

interface ListNotesParams {
  limit?: number;
}

interface AddTaskParams { text: string }
interface ToggleTaskParams { id: string; done: boolean }
interface DeleteTaskParams { id: string }
interface AddNoteParams { body: string }
interface DeleteNoteParams { id: string }

export const localStoreConnector: Connector = {
  id: 'local-store',
  name: 'Local Store',
  description: 'Tasks and notes stored in a private SQLite database on this device.',
  authKind: 'none',

  async getStatus() {
    return 'connected';
  },
  async connect() {},
  async disconnect() {},

  async query<R>(op: string, params: any = {}): Promise<R> {
    const d = await db();
    switch (op) {
      case 'tasks.list': {
        const p = params as ListTasksParams;
        const limit = p.limit ?? 50;
        const where = p.includeDone ? '' : 'WHERE done = 0';
        const rows = await d.select<Task[]>(
          `SELECT * FROM tasks ${where} ORDER BY done ASC, created_at DESC LIMIT $1`,
          [limit]
        );
        return rows as unknown as R;
      }
      case 'tasks.add': {
        const p = params as AddTaskParams;
        const t: Task = {
          id: uuid(),
          text: p.text,
          done: false,
          due_at: null,
          created_at: now(),
          updated_at: now(),
        };
        await d.execute(
          `INSERT INTO tasks (id, text, done, due_at, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [t.id, t.text, 0, null, t.created_at, t.updated_at]
        );
        return t as unknown as R;
      }
      case 'tasks.toggle': {
        const p = params as ToggleTaskParams;
        await d.execute(
          `UPDATE tasks SET done = $1, updated_at = $2 WHERE id = $3`,
          [p.done ? 1 : 0, now(), p.id]
        );
        return undefined as unknown as R;
      }
      case 'tasks.delete': {
        const p = params as DeleteTaskParams;
        await d.execute(`DELETE FROM tasks WHERE id = $1`, [p.id]);
        return undefined as unknown as R;
      }
      case 'notes.list': {
        const p = params as ListNotesParams;
        const limit = p.limit ?? 20;
        const rows = await d.select<Note[]>(
          `SELECT * FROM notes ORDER BY created_at DESC LIMIT $1`,
          [limit]
        );
        return rows as unknown as R;
      }
      case 'notes.add': {
        const p = params as AddNoteParams;
        const n: Note = {
          id: uuid(),
          body: p.body,
          created_at: now(),
          updated_at: now(),
        };
        await d.execute(
          `INSERT INTO notes (id, body, created_at, updated_at) VALUES ($1, $2, $3, $4)`,
          [n.id, n.body, n.created_at, n.updated_at]
        );
        return n as unknown as R;
      }
      case 'notes.delete': {
        const p = params as DeleteNoteParams;
        await d.execute(`DELETE FROM notes WHERE id = $1`, [p.id]);
        return undefined as unknown as R;
      }
      default:
        throw new Error(`Unknown op: ${op}`);
    }
  },
};
