export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface TaskComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };
  dueDate?: string;
  tags: string[];
  checklist: ChecklistItem[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: string;
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee?: string[];
  project?: string;
  tags?: string[];
  search?: string;
}

export type ViewMode = 'kanban' | 'list' | 'calendar';
