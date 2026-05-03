// Wrapper for the Rust-side keyring-backed token storage.
import { invoke } from '@tauri-apps/api/core';

export async function tokenSet(name: string, value: string): Promise<void> {
  await invoke('token_set', { name, value });
}

export async function tokenGet(name: string): Promise<string | null> {
  return (await invoke<string | null>('token_get', { name })) ?? null;
}

export async function tokenDelete(name: string): Promise<void> {
  await invoke('token_delete', { name });
}
