'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, File, Loader2 } from 'lucide-react';
import { documentsApi } from '@/lib/api';

interface ExportDialogProps {
  documentId: string;
  documentTitle: string;
}

export function ExportDialog({ documentId, documentTitle }: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | null>(null);
  const [open, setOpen] = useState(false);

  const handleExport = async (format: 'pdf' | 'docx') => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      // Call the export API
      const blob = await documentsApi.download(
        `/${documentId}/export?format=${format}`,
        `${documentTitle}.${format}`
      );

      // Create download link
      const url = window.URL.createObjectURL(blob as any);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentTitle}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Close dialog after successful export
      setTimeout(() => {
        setOpen(false);
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Document</DialogTitle>
          <DialogDescription>
            Choose a format to export your document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-6">
          {/* PDF Export */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">PDF Document</p>
              <p className="text-sm text-muted-foreground">
                Portable Document Format (.pdf)
              </p>
            </div>
            {isExporting && exportFormat === 'pdf' && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </button>

          {/* DOCX Export */}
          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting}
            className="w-full flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
              <File className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Word Document</p>
              <p className="text-sm text-muted-foreground">
                Microsoft Word (.docx)
              </p>
            </div>
            {isExporting && exportFormat === 'docx' && (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
