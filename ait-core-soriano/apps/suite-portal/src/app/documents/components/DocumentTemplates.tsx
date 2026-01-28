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
import { FileText, FileCheck, FileSpreadsheet, Presentation } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  content: string;
}

const templates: Template[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with an empty document',
    icon: <FileText className="w-6 h-6" />,
    content: '<p>Start typing your document...</p>',
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for meeting minutes',
    icon: <FileCheck className="w-6 h-6" />,
    content: `
      <h1>Meeting Notes</h1>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Attendees:</strong></p>
      <ul>
        <li>Person 1</li>
        <li>Person 2</li>
      </ul>
      <h2>Agenda</h2>
      <ol>
        <li>Topic 1</li>
        <li>Topic 2</li>
      </ol>
      <h2>Discussion Points</h2>
      <p></p>
      <h2>Action Items</h2>
      <ul data-type="taskList">
        <li data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Action item 1</p></div></li>
        <li data-type="taskItem"><label><input type="checkbox"><span></span></label><div><p>Action item 2</p></div></li>
      </ul>
    `,
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Template for project proposals',
    icon: <Presentation className="w-6 h-6" />,
    content: `
      <h1>Project Proposal</h1>
      <p><strong>Project Name:</strong></p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Prepared by:</strong></p>
      <h2>Executive Summary</h2>
      <p></p>
      <h2>Background</h2>
      <p></p>
      <h2>Objectives</h2>
      <ul>
        <li>Objective 1</li>
        <li>Objective 2</li>
      </ul>
      <h2>Scope</h2>
      <p></p>
      <h2>Timeline</h2>
      <p></p>
      <h2>Budget</h2>
      <p></p>
      <h2>Conclusion</h2>
      <p></p>
    `,
  },
  {
    id: 'report',
    name: 'Report',
    description: 'Professional report template',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    content: `
      <h1>Report Title</h1>
      <p><strong>Author:</strong></p>
      <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <h2>Abstract</h2>
      <p></p>
      <h2>Introduction</h2>
      <p></p>
      <h2>Methodology</h2>
      <p></p>
      <h2>Results</h2>
      <p></p>
      <h2>Discussion</h2>
      <p></p>
      <h2>Conclusion</h2>
      <p></p>
      <h2>References</h2>
      <ol>
        <li></li>
      </ol>
    `,
  },
];

interface DocumentTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

export function DocumentTemplates({ onSelectTemplate }: DocumentTemplatesProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelectTemplate = (template: Template) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="w-4 h-4 mr-2" />
          From Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-designed template to speed up your work
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelectTemplate(template)}
              className="flex flex-col items-start gap-3 p-4 border rounded-lg hover:bg-accent transition-colors text-left group"
            >
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                {template.icon}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
