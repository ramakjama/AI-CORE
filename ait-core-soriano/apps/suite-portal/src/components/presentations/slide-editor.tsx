"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlideEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export function SlideEditor({ content, onChange, className }: SlideEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<string>('');

  useEffect(() => {
    if (editorRef.current && !isEditing) {
      editorRef.current.innerHTML = content;
    }
  }, [content, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 0);
  };

  const handleBlur = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    setIsEditing(false);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };

  const insertLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-14 left-0 right-0 bg-card border border-border rounded-lg shadow-lg p-2 flex items-center gap-1 z-10"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('underline')}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyLeft')}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyCenter')}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('justifyRight')}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertUnorderedList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => execCommand('insertOrderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="sm" onClick={insertLink} title="Insert Link">
            <Link className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={insertImage}
            title="Insert Image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <select
            onChange={(e) => execCommand('formatBlock', e.target.value)}
            className="h-8 px-2 text-sm border border-border rounded bg-background"
          >
            <option value="p">Normal</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
          </select>

          <select
            onChange={(e) => execCommand('fontSize', e.target.value)}
            className="h-8 px-2 text-sm border border-border rounded bg-background ml-1"
          >
            <option value="3">Normal</option>
            <option value="1">Small</option>
            <option value="5">Large</option>
            <option value="7">Extra Large</option>
          </select>
        </motion.div>
      )}

      <div
        ref={editorRef}
        contentEditable={isEditing}
        onClick={handleEdit}
        onBlur={handleBlur}
        onInput={handleInput}
        className={cn(
          'min-h-[500px] p-8 outline-none cursor-text',
          !isEditing && 'cursor-pointer hover:bg-accent/5 transition-colors'
        )}
        suppressContentEditableWarning
      />
    </div>
  );
}
