import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { allWidgets } from '@/widgets/registry';

interface Props {
  onAdd: (type: string) => void;
}

export function AddWidgetDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add a widget</DialogTitle>
          <DialogDescription>Pick a widget to add to your dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {allWidgets.map((w) => {
            const Icon = w.icon;
            return (
              <button
                key={w.type}
                onClick={() => {
                  onAdd(w.type);
                  setOpen(false);
                }}
                className="flex items-start gap-3 rounded-md border border-border p-3 text-left transition-colors hover:bg-accent/40"
              >
                <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{w.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
