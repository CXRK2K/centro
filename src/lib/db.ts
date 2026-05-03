import Database from '@tauri-apps/plugin-sql';

let dbPromise: Promise<Database> | null = null;

export function db(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load('sqlite:centro.db');
  }
  return dbPromise;
}

export const now = () => Date.now();
