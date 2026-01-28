import { z } from 'zod';

// Task Priority
export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

// Task Status
export const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
  CANCELLED: 'cancelled',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// Task Schema
export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'in_review', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  projectId: z.string().uuid().optional(),
  boardId: z.string().uuid().optional(),
  columnId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  reporterId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  estimatedHours: z.number().nonnegative().optional(),
  actualHours: z.number().nonnegative().optional(),
  tags: z.array(z.string()).default([]),
  labels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
  })).default([]),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string().url(),
    size: z.number(),
  })).default([]),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean(),
  })).default([]),
  order: z.number().int().default(0),
  metadata: z.record(z.any()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

// Create Task DTO
export const CreateTaskSchema = TaskSchema.pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  projectId: true,
  assigneeId: true,
  dueDate: true,
  tags: true,
  checklist: true,
}).partial({
  description: true,
  status: true,
  priority: true,
  projectId: true,
  assigneeId: true,
  dueDate: true,
  tags: true,
  checklist: true,
});

export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

// Task Board
export interface TaskBoard {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  ownerId: string;
  columns: BoardColumn[];
  settings: BoardSettings;
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  color?: string;
  order: number;
  limit?: number;
  taskIds: string[];
}

export interface BoardSettings {
  defaultColumn: string;
  enableWipLimits: boolean;
  enableSubtasks: boolean;
  cardFields: string[];
}

// Task Comment
export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

// Task Activity
export interface TaskActivity {
  id: string;
  taskId: string;
  userId: string;
  action: 'created' | 'updated' | 'status_changed' | 'assigned' | 'commented' | 'attached';
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

// AI Task Suggestions
export interface AITaskSuggestion {
  type: 'priority' | 'dueDate' | 'assignee' | 'subtasks' | 'similar';
  suggestion: string;
  confidence: number;
  data?: unknown;
}
