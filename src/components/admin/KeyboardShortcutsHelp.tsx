import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Kbd } from '@/components/ui/kbd';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { keys: ['⌘/Ctrl', 'K'], description: 'Quick search guides' },
  { keys: ['⌘/Ctrl', 'N'], description: 'Create new guide' },
  { keys: ['⌘/Ctrl', 'E'], description: 'Edit selected guide' },
  { keys: ['⌘/Ctrl', 'D'], description: 'Go to dashboard' },
  { keys: ['⌘/Ctrl', 'A'], description: 'Go to analytics' },
  { keys: ['⌘/Ctrl', 'S'], description: 'Save current form' },
  { keys: ['⌘/Ctrl', '?'], description: 'Show keyboard shortcuts' },
  { keys: ['Esc'], description: 'Close modal/dialog' },
];

export function KeyboardShortcutsHelp({ open, onOpenChange }: KeyboardShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, i) => (
                  <Kbd key={i}>{key}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
