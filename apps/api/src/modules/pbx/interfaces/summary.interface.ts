export interface ICallSummary {
  id: string;
  callId: string;
  transcriptionId: string;
  summary: string;
  reason: string;
  topics: string[];
  agreements: string[];
  actionItems: IActionItem[];
  nextSteps: string[];
  resolution: string;
  resolutionStatus: ResolutionStatus;
  sentiment: string;
  keyPoints: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface IActionItem {
  id: string;
  description: string;
  assignedTo?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}

export enum ResolutionStatus {
  RESOLVED = 'resolved',
  PARTIALLY_RESOLVED = 'partially_resolved',
  UNRESOLVED = 'unresolved',
  ESCALATED = 'escalated',
  CALLBACK_REQUIRED = 'callback_required',
}

export interface ISummaryOptions {
  includeActionItems: boolean;
  includeNextSteps: boolean;
  includeTopics: boolean;
  maxLength?: number;
  language?: string;
}
