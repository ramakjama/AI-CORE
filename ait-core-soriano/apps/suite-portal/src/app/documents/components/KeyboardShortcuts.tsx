'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

const shortcuts = [
  {
    category: 'Text Formatting',
    items: [
      { keys: ['Ctrl', 'B'], description: 'Bold' },
      { keys: ['Ctrl', 'I'], description: 'Italic' },
      { keys: ['Ctrl', 'U'], description: 'Underline' },
      { keys: ['Ctrl', 'Shift', 'X'], description: 'Strikethrough' },
    ],
  },
  {
    category: 'Headings',
    items: [
      { keys: ['Ctrl', 'Alt', '1'], description: 'Heading 1' },
      { keys: ['Ctrl', 'Alt', '2'], description: 'Heading 2' },
      { keys: ['Ctrl', 'Alt', '3'], description: 'Heading 3' },
    ],
  },
  {
    category: 'Lists',
    items: [
      { keys: ['Ctrl', 'Shift', '8'], description: 'Bullet list' },
      { keys: ['Ctrl', 'Shift', '9'], description: 'Numbered list' },
      { keys: ['Ctrl', 'Shift', '7'], description: 'Code block' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'S'], description: 'Save (automatic)' },
      { keys: ['Ctrl', 'K'], description: 'Insert link' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl', 'A'], description: 'Select all' },
      { keys: ['Ctrl', 'F'], description: 'Search' },
      { keys: ['Esc'], description: 'Close dialogs' },
    ],
  },
];

export function KeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Keyboard className="w-4 h-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <span className="text-sm">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
                            {key}
                          </kbd>
                          {keyIndex < item.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> On Mac, use ⌘ (Cmd) instead of Ctrl
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
