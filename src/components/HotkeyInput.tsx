import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { chordFromEvent, chordLabel } from '@/lib/hotkey';
import type { HotkeyChord } from '@/lib/settings';

interface Props {
  value: HotkeyChord;
  onChange: (next: HotkeyChord) => void;
}

export function HotkeyInput({ value, onChange }: Props) {
  const [recording, setRecording] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return;
    e.preventDefault();
    e.stopPropagation();
    const chord = chordFromEvent(e.nativeEvent);
    if (!chord) {
      setHint('Hold a modifier (⌘ / Ctrl / ⇧ / ⌥) plus a key');
      return;
    }
    setHint(null);
    onChange(chord);
    setRecording(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        readOnly
        value={recording ? 'Press a chord…' : chordLabel(value)}
        onKeyDown={onKeyDown}
        onBlur={() => setRecording(false)}
        autoFocus={recording}
        className="max-w-[260px] font-mono"
      />
      <Button size="sm" variant="outline" onClick={() => setRecording(true)}>
        {recording ? 'Listening…' : 'Rebind'}
      </Button>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}
