/**
 * Task Service
 * Task management and operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Task,
  Subtask,
  TaskDependency,
  TaskStatus,
  Priority,
  DependencyType,
  CreateTaskInput,
  TaskComment
} from '../types';

// In-memory storage (replace with actual database in production)
const tasks: Map<string, Task> = new Map();
const dependencies: Map<string, TaskDependency> = new Map();

/**
 * Task Service - Manages tasks, subtasks, and dependencies
 */
export class TaskService {

  // ===========================================================================
  // CRUD OPERATIONS
  // ===========================================================================

  /**
   * Create a new task
   */
  async create(taskData: CreateTaskInput): Promise<Task> {
    const now = new Date();
    const taskId = uuidv4();

    // Generate task code
    const projectTasks = await this.getTasksByProject(taskData.projectId);
    const taskNumber = projectTasks.length + 1;
    const code = `TASK-${taskNumber.toString().padStart(4, '0')}`;

    const task: Task = {
      id: taskId,
      projectId: taskData.projectId,
      phaseId: taskData.phaseId,
      parentTaskId: taskData.parentTaskId,
      milestoneId: taskData.milestoneId,

      code,
      title: taskData.title,
      description: taskData.description,

      status: TaskStatus.BACKLOG,
      priority: taskData.priority,

      assigneeId: taskData.assigneeId,
      reporterId: taskData.reporterId,
      watcherIds: [],

      plannedStartDate: taskData.plannedStartDate ? new Date(taskData.plannedStartDate) : undefined,
      plannedEndDate: taskData.plannedEndDate ? new Date(taskData.plannedEndDate) : undefined,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,

      estimatedHours: taskData.estimatedHours,
      actualHours: 0,
      remainingHours: taskData.estimatedHours,
      progress: 0,

      storyPoints: taskData.storyPoints,

      subtasks: [],
      dependencies: [],

      tags: taskData.tags || [],
      attachments: [],
      comments: [],

      isOnCriticalPath: false,
      isBlocked: false,

      createdAt: now,
      updatedAt: now
    };

    tasks.set(taskId, task);

    return task;
  }

  /**
   * Update an existing task
   */
  async update(id: string, changes: Partial<Task>): Promise<Task> {
    const task = tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }

    const updatedTask: Task = {
      ...task,
      ...changes,
      id: task.id,
      projectId: task.projectId,
      code: task.code,
      createdAt: task.createdAt,
      updatedAt: new Date()
    };

    // Update remaining hours based on progress
    if (changes.progress !== undefined) {
      const progressDecimal = changes.progress / 100;
      updatedTask.remainingHours = Math.round(
        updatedTask.estimatedHours * (1 - progressDecimal)
      );
    }

    // Check if blocked
    updatedTask.isBlocked = updatedTask.status === TaskStatus.BLOCKED ||
      await this.hasBlockingDependencies(id);

    tasks.set(id, updatedTask);

    return updatedTask;
  }

  /**
   * Get a task by ID
   */
  async get(id: string): Promise<Task | null> {
    return tasks.get(id) || null;
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<boolean> {
    // Remove related dependencies
    const task = tasks.get(id);
    if (task) {
      for (const dep of task.dependencies) {
        dependencies.delete(dep.id);
      }
    }
    return tasks.delete(id);
  }

  // ===========================================================================
  // ASSIGNMENT & PROGRESS
  // ===========================================================================

  /**
   * Assign a task to a resource
   */
  async assign(taskId: string, resourceId: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.assigneeId = resourceId;
    task.updatedAt = new Date();

    // If task is in backlog and now assigned, move to TODO
    if (task.status === TaskStatus.BACKLOG) {
      task.status = TaskStatus.TODO;
    }

    tasks.set(taskId, task);

    return task;
  }

  /**
   * Unassign a task
   */
  async unassign(taskId: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.assigneeId = undefined;
    task.updatedAt = new Date();

    tasks.set(taskId, task);

    return task;
  }

  /**
   * Update task progress
   */
  async updateProgress(taskId: string, percentage: number): Promise<Task> {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const now = new Date();

    // Update progress
    task.progress = percentage;
    task.remainingHours = Math.round(task.estimatedHours * (1 - percentage / 100));
    task.updatedAt = now;

    // Update status based on progress
    if (percentage === 0 && task.status === TaskStatus.IN_PROGRESS) {
      task.status = TaskStatus.TODO;
    } else if (percentage > 0 && percentage < 100) {
      if (task.status === TaskStatus.TODO || task.status === TaskStatus.BACKLOG) {
        task.status = TaskStatus.IN_PROGRESS;
        if (!task.actualStartDate) {
          task.actualStartDate = now;
        }
      }
    } else if (percentage === 100) {
      task.status = TaskStatus.DONE;
      task.actualEndDate = now;
    }

    tasks.set(taskId, task);

    // Update dependent tasks
    await this.updateDependentTasks(taskId);

    return task;
  }

  /**
   * Log actual hours worked
   */
  async logHours(taskId: string, hours: number, _description?: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.actualHours += hours;
    task.remainingHours = Math.max(0, task.remainingHours - hours);
    task.updatedAt = new Date();

    // If remaining is 0, set progress to 100
    if (task.remainingHours === 0 && task.actualHours > 0) {
      task.progress = 100;
      task.status = TaskStatus.DONE;
      task.actualEndDate = new Date();
    } else if (task.estimatedHours > 0) {
      // Calculate progress based on hours
      const hourProgress = (task.actualHours / task.estimatedHours) * 100;
      task.progress = Math.min(99, Math.round(hourProgress));
    }

    tasks.set(taskId, task);

    return task;
  }

  /**
   * Start a task
   */
  async start(taskId: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check if dependencies are satisfied
    const hasBlockers = await this.hasBlockingDependencies(taskId);
    if (hasBlockers) {
      throw new Error('Cannot start task: has blocking dependencies');
    }

    task.status = TaskStatus.IN_PROGRESS;
    task.actualStartDate = new Date();
    task.updatedAt = new Date();

    tasks.set(taskId, task);

    return task;
  }

  /**
   * Complete a task
   */
  async complete(taskId: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const now = new Date();

    task.status = TaskStatus.DONE;
    task.progress = 100;
    task.actualEndDate = now;
    task.remainingHours = 0;
    task.updatedAt = now;

    tasks.set(taskId, task);

    // Unblock dependent tasks
    await this.updateDependentTasks(taskId);

    return task;
  }

  /**
   * Block a task
   */
  async block(taskId: string, reason: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = TaskStatus.BLOCKED;
    task.isBlocked = true;
    task.blockReason = reason;
    task.updatedAt = new Date();

    tasks.set(taskId, task);

    return task;
  }

  /**
   * Unblock a task
   */
  async unblock(taskId: string): Promise<Task> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    task.status = task.progress > 0 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
    task.isBlocked = false;
    task.blockReason = undefined;
    task.updatedAt = new Date();

    tasks.set(taskId, task);

    return task;
  }

  // ===========================================================================
  // DEPENDENCIES
  // ===========================================================================

  /**
   * Set a dependency between tasks
   */
  async setDependency(
    taskId: string,
    dependsOnId: string,
    type: DependencyType = DependencyType.FINISH_TO_START,
    lagDays: number = 0
  ): Promise<TaskDependency> {
    const task = tasks.get(taskId);
    const dependsOn = tasks.get(dependsOnId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    if (!dependsOn) {
      throw new Error(`Dependency task not found: ${dependsOnId}`);
    }

    // Check for circular dependency
    if (await this.wouldCreateCircularDependency(taskId, dependsOnId)) {
      throw new Error('Cannot create circular dependency');
    }

    const depId = uuidv4();
    const dependency: TaskDependency = {
      id: depId,
      taskId,
      dependsOnTaskId: dependsOnId,
      type,
      lagDays,
      createdAt: new Date()
    };

    dependencies.set(depId, dependency);
    task.dependencies.push(dependency);
    task.updatedAt = new Date();

    // Check if task is now blocked
    const isBlocked = await this.hasBlockingDependencies(taskId);
    if (isBlocked) {
      task.isBlocked = true;
    }

    tasks.set(taskId, task);

    return dependency;
  }

  /**
   * Remove a dependency
   */
  async removeDependency(dependencyId: string): Promise<boolean> {
    const dependency = dependencies.get(dependencyId);
    if (!dependency) {
      return false;
    }

    const task = tasks.get(dependency.taskId);
    if (task) {
      task.dependencies = task.dependencies.filter(d => d.id !== dependencyId);
      task.updatedAt = new Date();

      // Re-check if still blocked
      task.isBlocked = await this.hasBlockingDependencies(task.id);

      tasks.set(task.id, task);
    }

    return dependencies.delete(dependencyId);
  }

  /**
   * Get all dependencies for a task
   */
  async getDependencies(taskId: string): Promise<TaskDependency[]> {
    const task = tasks.get(taskId);
    return task?.dependencies || [];
  }

  /**
   * Get tasks that depend on this task
   */
  async getDependentTasks(taskId: string): Promise<Task[]> {
    const dependentTasks: Task[] = [];

    tasks.forEach(task => {
      const hasDependency = task.dependencies.some(d => d.dependsOnTaskId === taskId);
      if (hasDependency) {
        dependentTasks.push(task);
      }
    });

    return dependentTasks;
  }

  // ===========================================================================
  // SUBTASKS
  // ===========================================================================

  /**
   * Add a subtask to a task
   */
  async addSubtask(
    taskId: string,
    subtaskData: Omit<Subtask, 'id' | 'taskId' | 'createdAt' | 'updatedAt'>
  ): Promise<Subtask> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const now = new Date();
    const subtask: Subtask = {
      ...subtaskData,
      id: uuidv4(),
      taskId,
      order: task.subtasks.length,
      completed: false,
      createdAt: now,
      updatedAt: now
    };

    task.subtasks.push(subtask);
    task.updatedAt = now;

    // Recalculate parent task progress based on subtasks
    this.updateParentProgress(task);

    tasks.set(taskId, task);

    return subtask;
  }

  /**
   * Update a subtask
   */
  async updateSubtask(
    taskId: string,
    subtaskId: string,
    changes: Partial<Subtask>
  ): Promise<Subtask> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const subtaskIndex = task.subtasks.findIndex(s => s.id === subtaskId);
    if (subtaskIndex === -1) {
      throw new Error(`Subtask not found: ${subtaskId}`);
    }

    const now = new Date();
    const subtask = task.subtasks[subtaskIndex];
    const updatedSubtask: Subtask = {
      ...subtask,
      ...changes,
      id: subtask.id,
      taskId: subtask.taskId,
      createdAt: subtask.createdAt,
      updatedAt: now
    };

    // Handle completion
    if (changes.completed && !subtask.completed) {
      updatedSubtask.completedAt = now;
      updatedSubtask.status = TaskStatus.DONE;
    }

    task.subtasks[subtaskIndex] = updatedSubtask;
    task.updatedAt = now;

    // Recalculate parent task progress
    this.updateParentProgress(task);

    tasks.set(taskId, task);

    return updatedSubtask;
  }

  /**
   * Complete a subtask
   */
  async completeSubtask(taskId: string, subtaskId: string): Promise<Subtask> {
    return this.updateSubtask(taskId, subtaskId, {
      completed: true,
      status: TaskStatus.DONE
    });
  }

  /**
   * Delete a subtask
   */
  async deleteSubtask(taskId: string, subtaskId: string): Promise<boolean> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const originalLength = task.subtasks.length;
    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);

    if (task.subtasks.length < originalLength) {
      task.updatedAt = new Date();
      this.updateParentProgress(task);
      tasks.set(taskId, task);
      return true;
    }

    return false;
  }

  // ===========================================================================
  // COMMENTS
  // ===========================================================================

  /**
   * Add a comment to a task
   */
  async addComment(
    taskId: string,
    authorId: string,
    content: string,
    mentions: string[] = []
  ): Promise<TaskComment> {
    const task = tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const now = new Date();
    const comment: TaskComment = {
      id: uuidv4(),
      taskId,
      authorId,
      content,
      mentions,
      attachments: [],
      createdAt: now,
      updatedAt: now
    };

    task.comments.push(comment);
    task.updatedAt = now;

    tasks.set(taskId, task);

    return comment;
  }

  // ===========================================================================
  // QUERY METHODS
  // ===========================================================================

  /**
   * Get tasks assigned to a resource
   */
  async getTasksByResource(resourceId: string): Promise<Task[]> {
    const result: Task[] = [];
    tasks.forEach(task => {
      if (task.assigneeId === resourceId) {
        result.push(task);
      }
    });
    return result;
  }

  /**
   * Get all tasks for a project
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    const result: Task[] = [];
    tasks.forEach(task => {
      if (task.projectId === projectId) {
        result.push(task);
      }
    });
    return result;
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(projectId: string, status: TaskStatus): Promise<Task[]> {
    const projectTasks = await this.getTasksByProject(projectId);
    return projectTasks.filter(t => t.status === status);
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(projectId?: string): Promise<Task[]> {
    const now = new Date();
    const result: Task[] = [];

    tasks.forEach(task => {
      if (projectId && task.projectId !== projectId) {
        return;
      }

      if (
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.CANCELLED &&
        task.dueDate &&
        new Date(task.dueDate) < now
      ) {
        result.push(task);
      }
    });

    return result.sort(
      (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    );
  }

  /**
   * Get blocked tasks
   */
  async getBlockedTasks(projectId?: string): Promise<Task[]> {
    const result: Task[] = [];

    tasks.forEach(task => {
      if (projectId && task.projectId !== projectId) {
        return;
      }

      if (task.isBlocked || task.status === TaskStatus.BLOCKED) {
        result.push(task);
      }
    });

    return result;
  }

  /**
   * Get tasks by milestone
   */
  async getTasksByMilestone(milestoneId: string): Promise<Task[]> {
    const result: Task[] = [];
    tasks.forEach(task => {
      if (task.milestoneId === milestoneId) {
        result.push(task);
      }
    });
    return result;
  }

  /**
   * Get tasks by phase
   */
  async getTasksByPhase(phaseId: string): Promise<Task[]> {
    const result: Task[] = [];
    tasks.forEach(task => {
      if (task.phaseId === phaseId) {
        result.push(task);
      }
    });
    return result;
  }

  /**
   * Search tasks
   */
  async search(
    projectId: string,
    query: string,
    filters?: {
      status?: TaskStatus[];
      priority?: Priority[];
      assigneeId?: string;
      tags?: string[];
    }
  ): Promise<Task[]> {
    let result = await this.getTasksByProject(projectId);

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.code.toLowerCase().includes(lowerQuery)
      );
    }

    // Apply filters
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        result = result.filter(t => filters.status!.includes(t.status));
      }
      if (filters.priority && filters.priority.length > 0) {
        result = result.filter(t => filters.priority!.includes(t.priority));
      }
      if (filters.assigneeId) {
        result = result.filter(t => t.assigneeId === filters.assigneeId);
      }
      if (filters.tags && filters.tags.length > 0) {
        result = result.filter(t =>
          filters.tags!.some(tag => t.tags.includes(tag))
        );
      }
    }

    return result;
  }

  // ===========================================================================
  // CRITICAL PATH
  // ===========================================================================

  /**
   * Calculate critical path for a project
   */
  async getCriticalPath(projectId: string): Promise<Task[]> {
    const projectTasks = await this.getTasksByProject(projectId);

    if (projectTasks.length === 0) {
      return [];
    }

    // Build dependency graph
    const taskMap = new Map(projectTasks.map(t => [t.id, t]));
    const successors = new Map<string, string[]>();
    const predecessors = new Map<string, string[]>();

    projectTasks.forEach(task => {
      if (!successors.has(task.id)) {
        successors.set(task.id, []);
      }
      if (!predecessors.has(task.id)) {
        predecessors.set(task.id, []);
      }

      task.dependencies.forEach(dep => {
        if (!successors.has(dep.dependsOnTaskId)) {
          successors.set(dep.dependsOnTaskId, []);
        }
        successors.get(dep.dependsOnTaskId)!.push(task.id);
        predecessors.get(task.id)!.push(dep.dependsOnTaskId);
      });
    });

    // Forward pass - calculate early start and early finish
    const earlyStart = new Map<string, number>();
    const earlyFinish = new Map<string, number>();

    // Find start tasks (no predecessors)
    const startTasks = projectTasks.filter(
      t => (predecessors.get(t.id) || []).length === 0
    );

    // Initialize
    const visited = new Set<string>();
    const queue: string[] = startTasks.map(t => t.id);

    startTasks.forEach(t => {
      earlyStart.set(t.id, 0);
      earlyFinish.set(t.id, t.estimatedHours / 8); // Convert to days
    });

    while (queue.length > 0) {
      const taskId = queue.shift()!;
      if (visited.has(taskId)) continue;

      const preds = predecessors.get(taskId) || [];
      const allPredsVisited = preds.every(p => visited.has(p));

      if (!allPredsVisited && preds.length > 0) {
        queue.push(taskId);
        continue;
      }

      visited.add(taskId);

      const task = taskMap.get(taskId)!;
      const duration = task.estimatedHours / 8;

      // Early start is max of all predecessor early finishes
      let es = 0;
      preds.forEach(p => {
        const ef = earlyFinish.get(p) || 0;
        es = Math.max(es, ef);
      });

      earlyStart.set(taskId, es);
      earlyFinish.set(taskId, es + duration);

      // Add successors to queue
      (successors.get(taskId) || []).forEach(s => {
        if (!visited.has(s)) {
          queue.push(s);
        }
      });
    }

    // Find project end (max early finish)
    let projectEnd = 0;
    earlyFinish.forEach(ef => {
      projectEnd = Math.max(projectEnd, ef);
    });

    // Backward pass - calculate late start and late finish
    const lateStart = new Map<string, number>();
    const lateFinish = new Map<string, number>();

    // Find end tasks (no successors)
    const endTasks = projectTasks.filter(
      t => (successors.get(t.id) || []).length === 0
    );

    endTasks.forEach(t => {
      lateFinish.set(t.id, projectEnd);
      lateStart.set(t.id, projectEnd - (t.estimatedHours / 8));
    });

    // Process in reverse
    const reversedTasks = [...projectTasks].sort(
      (a, b) => (earlyFinish.get(b.id) || 0) - (earlyFinish.get(a.id) || 0)
    );

    reversedTasks.forEach(task => {
      if (lateFinish.has(task.id)) return;

      const succs = successors.get(task.id) || [];
      let lf = projectEnd;

      succs.forEach(s => {
        const ls = lateStart.get(s);
        if (ls !== undefined) {
          lf = Math.min(lf, ls);
        }
      });

      const duration = task.estimatedHours / 8;
      lateFinish.set(task.id, lf);
      lateStart.set(task.id, lf - duration);
    });

    // Calculate slack and identify critical path
    const criticalPath: Task[] = [];

    projectTasks.forEach(task => {
      const es = earlyStart.get(task.id) || 0;
      const ls = lateStart.get(task.id) || 0;
      const slack = ls - es;

      // Critical path tasks have zero slack
      if (Math.abs(slack) < 0.001) {
        task.isOnCriticalPath = true;
        criticalPath.push(task);
      } else {
        task.isOnCriticalPath = false;
      }

      tasks.set(task.id, task);
    });

    // Sort by early start
    return criticalPath.sort(
      (a, b) => (earlyStart.get(a.id) || 0) - (earlyStart.get(b.id) || 0)
    );
  }

  // ===========================================================================
  // PRIVATE HELPER METHODS
  // ===========================================================================

  /**
   * Check if a task has blocking dependencies
   */
  private async hasBlockingDependencies(taskId: string): Promise<boolean> {
    const task = tasks.get(taskId);
    if (!task) return false;

    for (const dep of task.dependencies) {
      const dependsOn = tasks.get(dep.dependsOnTaskId);
      if (!dependsOn) continue;

      switch (dep.type) {
        case DependencyType.FINISH_TO_START:
          // Task cannot start until dependency is done
          if (dependsOn.status !== TaskStatus.DONE) {
            return true;
          }
          break;
        case DependencyType.START_TO_START:
          // Task cannot start until dependency has started
          if (
            dependsOn.status === TaskStatus.BACKLOG ||
            dependsOn.status === TaskStatus.TODO
          ) {
            return true;
          }
          break;
        case DependencyType.FINISH_TO_FINISH:
          // Task cannot finish until dependency is done
          // This doesn't block starting
          break;
        case DependencyType.START_TO_FINISH:
          // Task cannot finish until dependency has started
          // This doesn't block starting
          break;
      }
    }

    return false;
  }

  /**
   * Check if adding a dependency would create a circular reference
   */
  private async wouldCreateCircularDependency(
    taskId: string,
    dependsOnId: string
  ): Promise<boolean> {
    // Check if dependsOnId has taskId anywhere in its dependency chain
    const visited = new Set<string>();
    const queue = [dependsOnId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;

      if (currentId === taskId) {
        return true;
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      const currentTask = tasks.get(currentId);
      if (currentTask) {
        for (const dep of currentTask.dependencies) {
          queue.push(dep.dependsOnTaskId);
        }
      }
    }

    return false;
  }

  /**
   * Update dependent tasks when a task is completed
   */
  private async updateDependentTasks(taskId: string): Promise<void> {
    const dependentTasks = await this.getDependentTasks(taskId);

    for (const depTask of dependentTasks) {
      const stillBlocked = await this.hasBlockingDependencies(depTask.id);

      if (!stillBlocked && depTask.isBlocked) {
        depTask.isBlocked = false;
        if (depTask.status === TaskStatus.BLOCKED) {
          depTask.status = depTask.progress > 0 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
        }
        depTask.updatedAt = new Date();
        tasks.set(depTask.id, depTask);
      }
    }
  }

  /**
   * Update parent task progress based on subtasks
   */
  private updateParentProgress(task: Task): void {
    if (task.subtasks.length === 0) {
      return;
    }

    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
    task.progress = Math.round((completedSubtasks / task.subtasks.length) * 100);

    if (task.progress === 100) {
      task.status = TaskStatus.DONE;
      task.actualEndDate = new Date();
    }
  }
}

// Export singleton instance
export const taskService = new TaskService();
