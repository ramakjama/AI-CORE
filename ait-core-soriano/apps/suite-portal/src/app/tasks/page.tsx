'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Filter,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Search,
  SlidersHorizontal,
  Tag,
  User,
  Clock,
  CheckSquare,
  Paperclip,
  MessageSquare,
  MoreVertical,
  X,
  ChevronDown,
  Edit,
  Trash2,
  Copy,
  Archive,
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { tasksApi } from '@/lib/api';
import { cn, getInitials } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Task, TaskPriority, TaskStatus, ViewMode, Project, TaskFilters } from '@/types/tasks';

// Priority colors and labels
const priorityConfig = {
  low: { color: 'bg-blue-500', label: 'Baja', variant: 'info' as const },
  medium: { color: 'bg-yellow-500', label: 'Media', variant: 'warning' as const },
  high: { color: 'bg-orange-500', label: 'Alta', variant: 'destructive' as const },
  urgent: { color: 'bg-red-500', label: 'Urgente', variant: 'destructive' as const },
};

// Status configuration
const statusConfig: Record<TaskStatus, { label: string; color: string }> = {
  todo: { label: 'Por Hacer', color: 'bg-slate-500' },
  in_progress: { label: 'En Progreso', color: 'bg-blue-500' },
  done: { label: 'Completado', color: 'bg-green-500' },
};

// Sortable Task Card Component
interface SortableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function SortableTaskCard({ task, onEdit, onDelete }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const priorityInfo = priorityConfig[task.priority];
  const completedItems = task.checklist.filter((item) => item.completed).length;
  const totalItems = task.checklist.length;

  const getDueDateColor = () => {
    if (!task.dueDate) return 'text-muted-foreground';
    const dueDate = parseISO(task.dueDate);
    if (isPast(dueDate) && !isToday(dueDate)) return 'text-red-500';
    if (isToday(dueDate)) return 'text-orange-500';
    if (isTomorrow(dueDate)) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const formatDueDate = () => {
    if (!task.dueDate) return null;
    const dueDate = parseISO(task.dueDate);
    if (isToday(dueDate)) return 'Hoy';
    if (isTomorrow(dueDate)) return 'Mañana';
    return format(dueDate, 'dd MMM', { locale: es });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing',
        'dark:bg-slate-900 dark:border-slate-800'
      )}
    >
      {/* Priority Indicator */}
      <div className={cn('absolute left-0 top-0 h-full w-1 rounded-l-lg', priorityInfo.color)} />

      {/* Header */}
      <div className="mb-3 flex items-start justify-between pl-2">
        <h3 className="flex-1 font-medium text-sm leading-tight pr-2">{task.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive className="mr-2 h-4 w-4" />
              Archivar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2 pl-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1 pl-2">
          {task.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pl-2">
        <div className="flex items-center gap-3">
          {/* Checklist Progress */}
          {totalItems > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Tareas completadas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{task.attachments.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Archivos adjuntos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Comments */}
          {task.comments.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{task.comments.length}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Comentarios</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={cn('flex items-center gap-1', getDueDateColor())}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDueDate()}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fecha límite</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Assignee */}
        {task.assignee && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignee.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>{task.assignee.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
}

// Kanban Column Component
interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function KanbanColumn({ status, tasks, onEdit, onDelete }: KanbanColumnProps) {
  const config = statusConfig[status];

  return (
    <div className="flex h-full min-w-[320px] flex-col rounded-lg border bg-muted/30 dark:bg-slate-900/50">
      {/* Column Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <div className={cn('h-2 w-2 rounded-full', config.color)} />
          <h2 className="font-semibold">{config.label}</h2>
          <Badge variant="secondary" className="ml-2">
            {tasks.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-4">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// Task Form Dialog
interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  projects: Project[];
}

function TaskFormDialog({ open, onOpenChange, task, projects }: TaskFormDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium' as TaskPriority,
    status: task?.status || 'todo' as TaskStatus,
    dueDate: task?.dueDate || '',
    projectId: task?.projectId || '',
    tags: task?.tags.join(', ') || '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksApi.patch(`/tasks/${task?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };

    if (task) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Nombre de la tarea"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los detalles de la tarea..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridad</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value as TaskPriority })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value as TaskStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Por Hacer</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="done">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha Límite</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Proyecto</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin proyecto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Etiquetas separadas por comas"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {task ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Filters Sidebar
interface FiltersSidebarProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  projects: Project[];
}

function FiltersSidebar({ filters, onFiltersChange, projects }: FiltersSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 dark:bg-slate-900/50 p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <User className="h-4 w-4" />
          Mis Tareas
        </h3>
        <div className="space-y-2 text-sm">
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors">
            Asignadas a mí
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors">
            Creadas por mí
          </button>
          <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors">
            Todas las tareas
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Proyectos
        </h3>
        <div className="space-y-2 text-sm">
          {projects.map((project) => (
            <button
              key={project.id}
              className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
              onClick={() => onFiltersChange({ ...filters, project: project.id })}
            >
              {project.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Prioridad
            </label>
            <div className="space-y-1">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox />
                  <span>{config.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Estado
            </label>
            <div className="space-y-1">
              {Object.entries(statusConfig).map(([key, config]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox />
                  <span>{config.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Tasks Page
export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.get('/tasks', { params: filters }),
  });

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => tasksApi.get('/projects'),
  });

  const tasks: Task[] = tasksData?.data || [];
  const projects: Project[] = projectsData?.data || [];

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(
      (task) =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [tasks, searchQuery]);

  // Group tasks by status for Kanban view
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };

    filteredTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [filteredTasks]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped on a different column
    const overStatus = over.id as TaskStatus;
    if (activeTask.status !== overStatus) {
      // Update task status
      queryClient.setQueryData(['tasks', filters], (old: any) => {
        const updatedTasks = old.data.map((task: Task) =>
          task.id === activeTask.id ? { ...task, status: overStatus } : task
        );
        return { ...old, data: updatedTasks };
      });

      // API call to update task
      tasksApi.patch(`/tasks/${activeTask.id}`, { status: overStatus });
    }
  };

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.delete(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (taskId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
      deleteMutation.mutate(taskId);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsFormOpen(true);
  };

  if (tasksLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* Search */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Button */}
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center rounded-lg border p-1">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Create Task Button */}
            <Button onClick={handleCreateTask}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <FiltersSidebar filters={filters} onFiltersChange={setFilters} projects={projects} />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'kanban' && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex h-full gap-4 overflow-x-auto p-6">
                {(['todo', 'in_progress', 'done'] as TaskStatus[]).map((status) => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasksByStatus[status]}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeId ? (
                  <TaskCard
                    task={tasks.find((t) => t.id === activeId)!}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {viewMode === 'list' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto space-y-2">
                {filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
              </div>
            </div>
          )}

          {viewMode === 'calendar' && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <CalendarIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Vista de Calendario</h3>
                <p className="text-muted-foreground">
                  La vista de calendario estará disponible próximamente
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Form Dialog */}
      <TaskFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={selectedTask}
        projects={projects}
      />
    </div>
  );
}
