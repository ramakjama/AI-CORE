"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Copy, Move, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraggableElementProps {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'code' | 'video';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onUpdate: (id: string, updates: Partial<DraggableElementProps>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function DraggableElement({
  id,
  type,
  content,
  x,
  y,
  width,
  height,
  onUpdate,
  onDelete,
  onDuplicate,
  selected = false,
  onSelect,
}: DraggableElementProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const elementRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      return;
    }
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - x,
      y: e.clientY - y,
    });
    onSelect?.(id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width,
      height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        onUpdate(id, { x: newX, y: newY });
      }

      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const newWidth = Math.max(50, resizeStart.width + deltaX);
        const newHeight = Math.max(50, resizeStart.height + deltaY);
        onUpdate(id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, id, onUpdate]);

  const renderContent = () => {
    switch (type) {
      case 'text':
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) =>
              onUpdate(id, { content: (e.target as HTMLDivElement).innerText })
            }
            className="w-full h-full p-2 outline-none"
          >
            {content}
          </div>
        );

      case 'image':
        return (
          <img
            src={content}
            alt="Element"
            className="w-full h-full object-cover"
          />
        );

      case 'shape':
        return (
          <div
            className="w-full h-full bg-primary/20 border-2 border-primary rounded"
            style={{ backgroundColor: content }}
          />
        );

      case 'code':
        return (
          <pre className="w-full h-full p-2 bg-muted text-sm overflow-auto">
            <code>{content}</code>
          </pre>
        );

      case 'video':
        return (
          <video src={content} controls className="w-full h-full">
            Your browser does not support video.
          </video>
        );

      default:
        return <div className="w-full h-full">{content}</div>;
    }
  };

  return (
    <motion.div
      ref={elementRef}
      drag={isDragging}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
      }}
      className={cn(
        'cursor-move border-2 transition-colors',
        selected ? 'border-primary' : 'border-transparent hover:border-muted-foreground',
        isDragging && 'cursor-grabbing',
        isResizing && 'cursor-nwse-resize'
      )}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(id);
      }}
    >
      {renderContent()}

      {/* Resize Handle */}
      {selected && (
        <>
          <div
            className="resize-handle absolute bottom-0 right-0 w-4 h-4 bg-primary border border-background cursor-nwse-resize"
            onMouseDown={handleResizeMouseDown}
          />

          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-10 left-0 bg-card border border-border rounded shadow-lg flex items-center gap-1 p-1"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(id);
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
