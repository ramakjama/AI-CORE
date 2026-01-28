"""
AI-Tasks Service: Intelligent task and project management with AI features.

Features:
- Task CRUD with subtasks
- Projects and boards
- Kanban, List, Calendar views
- Priority and labels
- Due dates and reminders
- Time tracking
- AI task suggestions
- Smart scheduling
- Workload balancing
- Dependencies
"""

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timedelta, date
from enum import Enum
import uuid
import asyncio

app = FastAPI(
    title="AI-Tasks Service",
    description="Intelligent task management with AI capabilities",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Enums ==============

class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    IN_REVIEW = "in_review"
    BLOCKED = "blocked"
    DONE = "done"
    CANCELLED = "cancelled"

class TaskPriority(str, Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class ProjectStatus(str, Enum):
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class ViewType(str, Enum):
    LIST = "list"
    BOARD = "board"
    CALENDAR = "calendar"
    TIMELINE = "timeline"
    TABLE = "table"

class RecurrenceType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    BIWEEKLY = "biweekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"

class DependencyType(str, Enum):
    BLOCKS = "blocks"  # This task blocks another
    BLOCKED_BY = "blocked_by"  # This task is blocked by another
    RELATES_TO = "relates_to"

# ============== Models ==============

class LabelCreate(BaseModel):
    name: str
    color: str = "#808080"
    description: Optional[str] = None

class Label(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    color: str = "#808080"
    description: Optional[str] = None
    task_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ChecklistItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    completed_by: Optional[str] = None
    order: int = 0

class Attachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    file_type: str
    size: int
    url: str
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    user_id: str
    content: str
    mentions: List[str] = []
    attachments: List[Attachment] = []
    is_edited: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TimeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    user_id: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    is_billable: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TaskDependency(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    depends_on_id: str
    dependency_type: DependencyType
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Recurrence(BaseModel):
    type: RecurrenceType
    interval: int = 1
    days_of_week: Optional[List[int]] = None  # 0=Monday
    day_of_month: Optional[int] = None
    end_date: Optional[date] = None
    occurrences: Optional[int] = None

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    section_id: Optional[str] = None
    parent_id: Optional[str] = None  # For subtasks
    assignee_id: Optional[str] = None
    assignees: List[str] = []
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.NONE
    labels: List[str] = []
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    recurrence: Optional[Recurrence] = None
    checklist: List[ChecklistItem] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    section_id: Optional[str] = None
    assignee_id: Optional[str] = None
    assignees: Optional[List[str]] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    labels: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    order: Optional[int] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    project_id: Optional[str] = None
    section_id: Optional[str] = None
    parent_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    assignee_id: Optional[str] = None
    assignees: List[str] = []
    creator_id: str
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.NONE
    labels: List[str] = []
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: float = 0
    checklist: List[ChecklistItem] = []
    attachments: List[Attachment] = []
    dependencies: List[TaskDependency] = []
    recurrence: Optional[Recurrence] = None
    subtask_count: int = 0
    completed_subtasks: int = 0
    comment_count: int = 0
    order: int = 0
    is_archived: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # AI fields
    ai_suggested_priority: Optional[TaskPriority] = None
    ai_suggested_due_date: Optional[datetime] = None
    ai_suggested_assignee: Optional[str] = None
    ai_complexity_score: Optional[float] = None

class Section(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    order: int = 0
    task_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#1a73e8"
    icon: Optional[str] = None
    default_view: ViewType = ViewType.BOARD
    members: List[str] = []
    is_template: bool = False

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    description: Optional[str] = None
    color: str = "#1a73e8"
    icon: Optional[str] = None
    owner_id: str
    members: List[str] = []
    status: ProjectStatus = ProjectStatus.ACTIVE
    default_view: ViewType = ViewType.BOARD
    is_template: bool = False
    is_favorite: bool = False
    task_count: int = 0
    completed_task_count: int = 0
    due_date: Optional[datetime] = None
    progress: float = 0  # 0-100%
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Workspace(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    owner_id: str
    members: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    description: Optional[str] = None
    target_value: float
    current_value: float = 0
    unit: str = "tasks"
    due_date: Optional[datetime] = None
    linked_projects: List[str] = []
    progress: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============== AI Models ==============

class AITaskBreakdown(BaseModel):
    subtasks: List[Dict[str, Any]]
    estimated_total_hours: float
    complexity_analysis: str

class AIWorkloadAnalysis(BaseModel):
    user_workloads: Dict[str, Dict[str, Any]]
    overloaded_users: List[str]
    underutilized_users: List[str]
    recommendations: List[str]

class AIScheduleSuggestion(BaseModel):
    task_id: str
    suggested_date: datetime
    reasoning: str
    conflicts: List[Dict[str, Any]]

# ============== Storage (in-memory for demo) ==============

workspaces_db: Dict[str, Workspace] = {}
projects_db: Dict[str, Project] = {}
sections_db: Dict[str, Section] = {}
tasks_db: Dict[str, Task] = {}
labels_db: Dict[str, Label] = {}
comments_db: Dict[str, Comment] = {}
time_entries_db: Dict[str, TimeEntry] = {}
goals_db: Dict[str, Goal] = {}

# WebSocket connections
ws_connections: Dict[str, Set[WebSocket]] = {}

# ============== Helper Functions ==============

def get_workspace(workspace_id: str) -> Workspace:
    if workspace_id not in workspaces_db:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspaces_db[workspace_id]

def get_project(project_id: str) -> Project:
    if project_id not in projects_db:
        raise HTTPException(status_code=404, detail="Project not found")
    return projects_db[project_id]

def get_task(task_id: str) -> Task:
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks_db[task_id]

def update_project_stats(project_id: str):
    """Update project task counts and progress."""
    if project_id not in projects_db:
        return

    project = projects_db[project_id]
    tasks = [t for t in tasks_db.values()
             if t.project_id == project_id and not t.is_archived]

    project.task_count = len(tasks)
    project.completed_task_count = len([t for t in tasks if t.status == TaskStatus.DONE])

    if project.task_count > 0:
        project.progress = (project.completed_task_count / project.task_count) * 100
    else:
        project.progress = 0

def update_section_stats(section_id: str):
    """Update section task count."""
    if section_id not in sections_db:
        return

    section = sections_db[section_id]
    section.task_count = len([t for t in tasks_db.values()
                              if t.section_id == section_id and not t.is_archived])

async def broadcast_update(workspace_id: str, event_type: str, data: Dict):
    """Broadcast updates to workspace subscribers."""
    if workspace_id in ws_connections:
        message = {"type": event_type, "data": data}
        for ws in ws_connections[workspace_id]:
            try:
                await ws.send_json(message)
            except:
                pass

# ============== Workspace Endpoints ==============

@app.post("/workspaces", response_model=Workspace)
async def create_workspace(owner_id: str, name: str, description: Optional[str] = None):
    """Create a new workspace."""
    workspace = Workspace(
        name=name,
        description=description,
        owner_id=owner_id,
        members=[owner_id],
    )
    workspaces_db[workspace.id] = workspace
    return workspace

@app.get("/workspaces", response_model=List[Workspace])
async def list_workspaces(user_id: str):
    """List workspaces for a user."""
    return [w for w in workspaces_db.values() if user_id in w.members]

@app.get("/workspaces/{workspace_id}", response_model=Workspace)
async def get_workspace_details(workspace_id: str):
    """Get workspace details."""
    return get_workspace(workspace_id)

# ============== Project Endpoints ==============

@app.post("/projects", response_model=Project)
async def create_project(workspace_id: str, user_id: str, project_data: ProjectCreate):
    """Create a new project."""
    workspace = get_workspace(workspace_id)

    project = Project(
        workspace_id=workspace_id,
        name=project_data.name,
        description=project_data.description,
        color=project_data.color,
        icon=project_data.icon,
        owner_id=user_id,
        members=project_data.members or [user_id],
        default_view=project_data.default_view,
        is_template=project_data.is_template,
    )
    projects_db[project.id] = project

    # Create default sections for board view
    if project.default_view == ViewType.BOARD:
        default_sections = ["To Do", "In Progress", "Done"]
        for i, name in enumerate(default_sections):
            section = Section(project_id=project.id, name=name, order=i)
            sections_db[section.id] = section

    return project

@app.get("/projects", response_model=List[Project])
async def list_projects(
    workspace_id: str,
    user_id: str,
    status: Optional[ProjectStatus] = None,
    include_archived: bool = False,
):
    """List projects in a workspace."""
    projects = [p for p in projects_db.values()
                if p.workspace_id == workspace_id
                and user_id in p.members]

    if status:
        projects = [p for p in projects if p.status == status]

    if not include_archived:
        projects = [p for p in projects if p.status != ProjectStatus.ARCHIVED]

    return projects

@app.get("/projects/{project_id}", response_model=Project)
async def get_project_details(project_id: str):
    """Get project details."""
    return get_project(project_id)

@app.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    color: Optional[str] = None,
    status: Optional[ProjectStatus] = None,
    is_favorite: Optional[bool] = None,
):
    """Update a project."""
    project = get_project(project_id)

    if name:
        project.name = name
    if description is not None:
        project.description = description
    if color:
        project.color = color
    if status:
        project.status = status
    if is_favorite is not None:
        project.is_favorite = is_favorite

    project.updated_at = datetime.utcnow()
    return project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, permanent: bool = False):
    """Delete or archive a project."""
    project = get_project(project_id)

    if permanent:
        # Delete all tasks
        tasks_to_delete = [t.id for t in tasks_db.values() if t.project_id == project_id]
        for task_id in tasks_to_delete:
            del tasks_db[task_id]

        # Delete sections
        sections_to_delete = [s.id for s in sections_db.values() if s.project_id == project_id]
        for section_id in sections_to_delete:
            del sections_db[section_id]

        del projects_db[project_id]
        return {"message": "Project deleted"}
    else:
        project.status = ProjectStatus.ARCHIVED
        return {"message": "Project archived"}

# ============== Section Endpoints ==============

@app.post("/sections", response_model=Section)
async def create_section(
    project_id: str,
    name: str,
    description: Optional[str] = None,
    color: Optional[str] = None,
):
    """Create a new section."""
    project = get_project(project_id)

    existing = [s for s in sections_db.values() if s.project_id == project_id]
    order = len(existing)

    section = Section(
        project_id=project_id,
        name=name,
        description=description,
        color=color,
        order=order,
    )
    sections_db[section.id] = section

    return section

@app.get("/sections", response_model=List[Section])
async def list_sections(project_id: str):
    """List sections in a project."""
    sections = [s for s in sections_db.values() if s.project_id == project_id]
    sections.sort(key=lambda x: x.order)
    return sections

@app.put("/sections/{section_id}", response_model=Section)
async def update_section(
    section_id: str,
    name: Optional[str] = None,
    color: Optional[str] = None,
    order: Optional[int] = None,
):
    """Update a section."""
    if section_id not in sections_db:
        raise HTTPException(status_code=404, detail="Section not found")

    section = sections_db[section_id]

    if name:
        section.name = name
    if color is not None:
        section.color = color
    if order is not None:
        section.order = order

    return section

@app.delete("/sections/{section_id}")
async def delete_section(section_id: str, move_tasks_to: Optional[str] = None):
    """Delete a section."""
    if section_id not in sections_db:
        raise HTTPException(status_code=404, detail="Section not found")

    # Move or delete tasks
    for task in tasks_db.values():
        if task.section_id == section_id:
            task.section_id = move_tasks_to

    del sections_db[section_id]
    return {"message": "Section deleted"}

# ============== Task Endpoints ==============

@app.post("/tasks", response_model=Task)
async def create_task(workspace_id: str, user_id: str, task_data: TaskCreate):
    """Create a new task."""
    task = Task(
        workspace_id=workspace_id,
        project_id=task_data.project_id,
        section_id=task_data.section_id,
        parent_id=task_data.parent_id,
        title=task_data.title,
        description=task_data.description,
        assignee_id=task_data.assignee_id,
        assignees=task_data.assignees or ([task_data.assignee_id] if task_data.assignee_id else []),
        creator_id=user_id,
        status=task_data.status,
        priority=task_data.priority,
        labels=task_data.labels,
        due_date=task_data.due_date,
        start_date=task_data.start_date,
        estimated_hours=task_data.estimated_hours,
        recurrence=task_data.recurrence,
        checklist=task_data.checklist,
    )

    # Set order
    existing_tasks = [t for t in tasks_db.values()
                     if t.project_id == task_data.project_id
                     and t.section_id == task_data.section_id]
    task.order = len(existing_tasks)

    tasks_db[task.id] = task

    # Update parent if subtask
    if task.parent_id and task.parent_id in tasks_db:
        tasks_db[task.parent_id].subtask_count += 1

    # Update project stats
    if task.project_id:
        update_project_stats(task.project_id)

    # Update section stats
    if task.section_id:
        update_section_stats(task.section_id)

    await broadcast_update(workspace_id, "task_created", task.model_dump())

    return task

@app.get("/tasks", response_model=List[Task])
async def list_tasks(
    workspace_id: str,
    project_id: Optional[str] = None,
    section_id: Optional[str] = None,
    assignee_id: Optional[str] = None,
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    label: Optional[str] = None,
    due_before: Optional[datetime] = None,
    due_after: Optional[datetime] = None,
    parent_id: Optional[str] = None,
    include_subtasks: bool = True,
    include_archived: bool = False,
    search: Optional[str] = None,
    sort_by: str = "order",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List tasks with filtering."""
    tasks = [t for t in tasks_db.values() if t.workspace_id == workspace_id]

    if project_id:
        tasks = [t for t in tasks if t.project_id == project_id]
    if section_id:
        tasks = [t for t in tasks if t.section_id == section_id]
    if assignee_id:
        tasks = [t for t in tasks if assignee_id in t.assignees or t.assignee_id == assignee_id]
    if status:
        tasks = [t for t in tasks if t.status == status]
    if priority:
        tasks = [t for t in tasks if t.priority == priority]
    if label:
        tasks = [t for t in tasks if label in t.labels]
    if due_before:
        tasks = [t for t in tasks if t.due_date and t.due_date <= due_before]
    if due_after:
        tasks = [t for t in tasks if t.due_date and t.due_date >= due_after]
    if parent_id is not None:
        tasks = [t for t in tasks if t.parent_id == parent_id]
    elif not include_subtasks:
        tasks = [t for t in tasks if t.parent_id is None]
    if not include_archived:
        tasks = [t for t in tasks if not t.is_archived]
    if search:
        search_lower = search.lower()
        tasks = [t for t in tasks if search_lower in t.title.lower()
                 or search_lower in (t.description or "").lower()]

    # Sort
    if sort_by == "order":
        tasks.sort(key=lambda x: x.order)
    elif sort_by == "due_date":
        tasks.sort(key=lambda x: x.due_date or datetime.max)
    elif sort_by == "priority":
        priority_order = {p: i for i, p in enumerate(TaskPriority)}
        tasks.sort(key=lambda x: priority_order.get(x.priority, 99), reverse=True)
    elif sort_by == "created_at":
        tasks.sort(key=lambda x: x.created_at, reverse=True)

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size

    return tasks[start:end]

@app.get("/tasks/{task_id}", response_model=Task)
async def get_task_details(task_id: str):
    """Get task details."""
    return get_task(task_id)

@app.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, update: TaskUpdate):
    """Update a task."""
    task = get_task(task_id)
    old_section = task.section_id
    old_project = task.project_id
    old_status = task.status

    if update.title is not None:
        task.title = update.title
    if update.description is not None:
        task.description = update.description
    if update.project_id is not None:
        task.project_id = update.project_id
    if update.section_id is not None:
        task.section_id = update.section_id
    if update.assignee_id is not None:
        task.assignee_id = update.assignee_id
    if update.assignees is not None:
        task.assignees = update.assignees
    if update.status is not None:
        task.status = update.status
        if update.status == TaskStatus.DONE and old_status != TaskStatus.DONE:
            task.completed_at = datetime.utcnow()
        elif update.status != TaskStatus.DONE:
            task.completed_at = None
    if update.priority is not None:
        task.priority = update.priority
    if update.labels is not None:
        task.labels = update.labels
    if update.due_date is not None:
        task.due_date = update.due_date
    if update.start_date is not None:
        task.start_date = update.start_date
    if update.estimated_hours is not None:
        task.estimated_hours = update.estimated_hours
    if update.order is not None:
        task.order = update.order

    task.updated_at = datetime.utcnow()

    # Update parent subtask count if completed
    if task.parent_id and task.parent_id in tasks_db:
        parent = tasks_db[task.parent_id]
        parent.completed_subtasks = len([t for t in tasks_db.values()
                                         if t.parent_id == task.parent_id
                                         and t.status == TaskStatus.DONE])

    # Update stats if project/section changed
    if old_project != task.project_id:
        if old_project:
            update_project_stats(old_project)
        if task.project_id:
            update_project_stats(task.project_id)

    if old_section != task.section_id:
        if old_section:
            update_section_stats(old_section)
        if task.section_id:
            update_section_stats(task.section_id)

    if old_status != task.status and task.project_id:
        update_project_stats(task.project_id)

    await broadcast_update(task.workspace_id, "task_updated", task.model_dump())

    return task

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str, permanent: bool = False):
    """Delete or archive a task."""
    task = get_task(task_id)

    if permanent:
        # Delete subtasks
        subtasks = [t.id for t in tasks_db.values() if t.parent_id == task_id]
        for subtask_id in subtasks:
            del tasks_db[subtask_id]

        # Delete comments
        comments_to_delete = [c.id for c in comments_db.values() if c.task_id == task_id]
        for comment_id in comments_to_delete:
            del comments_db[comment_id]

        # Delete time entries
        entries_to_delete = [e.id for e in time_entries_db.values() if e.task_id == task_id]
        for entry_id in entries_to_delete:
            del time_entries_db[entry_id]

        # Update parent
        if task.parent_id and task.parent_id in tasks_db:
            tasks_db[task.parent_id].subtask_count -= 1

        del tasks_db[task_id]

        # Update stats
        if task.project_id:
            update_project_stats(task.project_id)
        if task.section_id:
            update_section_stats(task.section_id)

        return {"message": "Task deleted"}
    else:
        task.is_archived = True
        return {"message": "Task archived"}

@app.post("/tasks/{task_id}/duplicate", response_model=Task)
async def duplicate_task(task_id: str, include_subtasks: bool = True):
    """Duplicate a task."""
    original = get_task(task_id)

    new_task = original.model_copy()
    new_task.id = str(uuid.uuid4())
    new_task.title = f"{original.title} (Copy)"
    new_task.created_at = datetime.utcnow()
    new_task.updated_at = datetime.utcnow()
    new_task.completed_at = None
    new_task.status = TaskStatus.TODO

    tasks_db[new_task.id] = new_task

    if include_subtasks:
        subtasks = [t for t in tasks_db.values() if t.parent_id == task_id]
        for subtask in subtasks:
            new_subtask = subtask.model_copy()
            new_subtask.id = str(uuid.uuid4())
            new_subtask.parent_id = new_task.id
            new_subtask.created_at = datetime.utcnow()
            tasks_db[new_subtask.id] = new_subtask

        new_task.subtask_count = len(subtasks)

    return new_task

# ============== Checklist Endpoints ==============

@app.post("/tasks/{task_id}/checklist", response_model=Task)
async def add_checklist_item(task_id: str, title: str):
    """Add a checklist item to a task."""
    task = get_task(task_id)

    item = ChecklistItem(title=title, order=len(task.checklist))
    task.checklist.append(item)
    task.updated_at = datetime.utcnow()

    return task

@app.put("/tasks/{task_id}/checklist/{item_id}")
async def update_checklist_item(
    task_id: str,
    item_id: str,
    title: Optional[str] = None,
    is_completed: Optional[bool] = None,
    user_id: Optional[str] = None,
):
    """Update a checklist item."""
    task = get_task(task_id)

    for item in task.checklist:
        if item.id == item_id:
            if title is not None:
                item.title = title
            if is_completed is not None:
                item.is_completed = is_completed
                if is_completed:
                    item.completed_at = datetime.utcnow()
                    item.completed_by = user_id
                else:
                    item.completed_at = None
                    item.completed_by = None
            break
    else:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    task.updated_at = datetime.utcnow()
    return {"message": "Checklist item updated"}

@app.delete("/tasks/{task_id}/checklist/{item_id}")
async def delete_checklist_item(task_id: str, item_id: str):
    """Delete a checklist item."""
    task = get_task(task_id)
    task.checklist = [item for item in task.checklist if item.id != item_id]
    task.updated_at = datetime.utcnow()
    return {"message": "Checklist item deleted"}

# ============== Comment Endpoints ==============

@app.post("/tasks/{task_id}/comments", response_model=Comment)
async def add_comment(task_id: str, user_id: str, content: str):
    """Add a comment to a task."""
    task = get_task(task_id)

    comment = Comment(
        task_id=task_id,
        user_id=user_id,
        content=content,
    )
    comments_db[comment.id] = comment
    task.comment_count += 1

    return comment

@app.get("/tasks/{task_id}/comments", response_model=List[Comment])
async def list_comments(task_id: str):
    """List comments for a task."""
    get_task(task_id)
    comments = [c for c in comments_db.values() if c.task_id == task_id]
    comments.sort(key=lambda x: x.created_at)
    return comments

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user_id: str):
    """Delete a comment."""
    if comment_id not in comments_db:
        raise HTTPException(status_code=404, detail="Comment not found")

    comment = comments_db[comment_id]
    if comment.user_id != user_id:
        raise HTTPException(status_code=403, detail="Can only delete own comments")

    task = tasks_db.get(comment.task_id)
    if task:
        task.comment_count -= 1

    del comments_db[comment_id]
    return {"message": "Comment deleted"}

# ============== Time Tracking Endpoints ==============

@app.post("/tasks/{task_id}/time", response_model=TimeEntry)
async def start_time_tracking(task_id: str, user_id: str, description: Optional[str] = None):
    """Start time tracking for a task."""
    get_task(task_id)

    entry = TimeEntry(
        task_id=task_id,
        user_id=user_id,
        description=description,
        start_time=datetime.utcnow(),
    )
    time_entries_db[entry.id] = entry

    return entry

@app.put("/time/{entry_id}/stop", response_model=TimeEntry)
async def stop_time_tracking(entry_id: str):
    """Stop time tracking."""
    if entry_id not in time_entries_db:
        raise HTTPException(status_code=404, detail="Time entry not found")

    entry = time_entries_db[entry_id]
    entry.end_time = datetime.utcnow()
    entry.duration_minutes = int((entry.end_time - entry.start_time).total_seconds() / 60)

    # Update task actual hours
    task = tasks_db.get(entry.task_id)
    if task:
        task.actual_hours += entry.duration_minutes / 60

    return entry

@app.get("/tasks/{task_id}/time", response_model=List[TimeEntry])
async def list_time_entries(task_id: str):
    """List time entries for a task."""
    return [e for e in time_entries_db.values() if e.task_id == task_id]

@app.post("/time/manual", response_model=TimeEntry)
async def add_manual_time_entry(
    task_id: str,
    user_id: str,
    duration_minutes: int,
    description: Optional[str] = None,
    date: Optional[datetime] = None,
):
    """Add a manual time entry."""
    get_task(task_id)

    start_time = date or datetime.utcnow()
    entry = TimeEntry(
        task_id=task_id,
        user_id=user_id,
        description=description,
        start_time=start_time,
        end_time=start_time + timedelta(minutes=duration_minutes),
        duration_minutes=duration_minutes,
    )
    time_entries_db[entry.id] = entry

    # Update task actual hours
    task = tasks_db.get(task_id)
    if task:
        task.actual_hours += duration_minutes / 60

    return entry

# ============== Label Endpoints ==============

@app.post("/labels", response_model=Label)
async def create_label(workspace_id: str, label_data: LabelCreate):
    """Create a new label."""
    label = Label(
        workspace_id=workspace_id,
        name=label_data.name,
        color=label_data.color,
        description=label_data.description,
    )
    labels_db[label.id] = label
    return label

@app.get("/labels", response_model=List[Label])
async def list_labels(workspace_id: str):
    """List labels in a workspace."""
    return [l for l in labels_db.values() if l.workspace_id == workspace_id]

@app.delete("/labels/{label_id}")
async def delete_label(label_id: str):
    """Delete a label."""
    if label_id not in labels_db:
        raise HTTPException(status_code=404, detail="Label not found")

    label = labels_db[label_id]

    # Remove from all tasks
    for task in tasks_db.values():
        if label.name in task.labels:
            task.labels.remove(label.name)

    del labels_db[label_id]
    return {"message": "Label deleted"}

# ============== Dependency Endpoints ==============

@app.post("/tasks/{task_id}/dependencies")
async def add_dependency(
    task_id: str,
    depends_on_id: str,
    dependency_type: DependencyType = DependencyType.BLOCKED_BY,
):
    """Add a task dependency."""
    task = get_task(task_id)
    depends_on = get_task(depends_on_id)

    if task_id == depends_on_id:
        raise HTTPException(status_code=400, detail="Task cannot depend on itself")

    # Check for circular dependency
    def has_circular(current_id: str, target_id: str, visited: set) -> bool:
        if current_id == target_id:
            return True
        if current_id in visited:
            return False
        visited.add(current_id)
        current_task = tasks_db.get(current_id)
        if not current_task:
            return False
        for dep in current_task.dependencies:
            if has_circular(dep.depends_on_id, target_id, visited):
                return True
        return False

    if has_circular(depends_on_id, task_id, set()):
        raise HTTPException(status_code=400, detail="Circular dependency detected")

    dep = TaskDependency(
        task_id=task_id,
        depends_on_id=depends_on_id,
        dependency_type=dependency_type,
    )
    task.dependencies.append(dep)

    return {"message": "Dependency added"}

@app.delete("/tasks/{task_id}/dependencies/{depends_on_id}")
async def remove_dependency(task_id: str, depends_on_id: str):
    """Remove a task dependency."""
    task = get_task(task_id)
    task.dependencies = [d for d in task.dependencies if d.depends_on_id != depends_on_id]
    return {"message": "Dependency removed"}

# ============== AI Features ==============

@app.post("/ai/breakdown", response_model=AITaskBreakdown)
async def ai_breakdown_task(task_id: str):
    """AI-powered task breakdown into subtasks."""
    task = get_task(task_id)

    # In real implementation, use LLM
    subtasks = [
        {"title": f"Research for: {task.title}", "estimated_hours": 1.0, "priority": "medium"},
        {"title": f"Implementation for: {task.title}", "estimated_hours": 3.0, "priority": "high"},
        {"title": f"Testing for: {task.title}", "estimated_hours": 1.5, "priority": "medium"},
        {"title": f"Documentation for: {task.title}", "estimated_hours": 0.5, "priority": "low"},
    ]

    return AITaskBreakdown(
        subtasks=subtasks,
        estimated_total_hours=sum(s["estimated_hours"] for s in subtasks),
        complexity_analysis="This task appears to be of medium complexity, requiring research, implementation, and testing phases.",
    )

@app.post("/ai/prioritize")
async def ai_prioritize_tasks(workspace_id: str, task_ids: Optional[List[str]] = None):
    """AI-powered task prioritization."""
    if task_ids:
        tasks = [tasks_db[tid] for tid in task_ids if tid in tasks_db]
    else:
        tasks = [t for t in tasks_db.values()
                 if t.workspace_id == workspace_id
                 and t.status != TaskStatus.DONE
                 and not t.is_archived]

    # In real implementation, use LLM to analyze and prioritize
    prioritized = []
    for task in tasks:
        score = 0

        # Factor in due date
        if task.due_date:
            days_until_due = (task.due_date - datetime.utcnow()).days
            if days_until_due < 0:
                score += 100  # Overdue
            elif days_until_due < 3:
                score += 50
            elif days_until_due < 7:
                score += 25

        # Factor in existing priority
        priority_scores = {
            TaskPriority.URGENT: 40,
            TaskPriority.HIGH: 30,
            TaskPriority.MEDIUM: 20,
            TaskPriority.LOW: 10,
            TaskPriority.NONE: 0,
        }
        score += priority_scores.get(task.priority, 0)

        # Factor in dependencies
        if task.dependencies:
            score -= 10  # Lower priority if blocked

        suggested_priority = TaskPriority.NONE
        if score >= 80:
            suggested_priority = TaskPriority.URGENT
        elif score >= 50:
            suggested_priority = TaskPriority.HIGH
        elif score >= 30:
            suggested_priority = TaskPriority.MEDIUM
        elif score >= 10:
            suggested_priority = TaskPriority.LOW

        prioritized.append({
            "task_id": task.id,
            "title": task.title,
            "current_priority": task.priority,
            "suggested_priority": suggested_priority,
            "score": score,
            "reasoning": f"Score based on due date, current priority, and dependencies",
        })

    prioritized.sort(key=lambda x: x["score"], reverse=True)

    return {
        "tasks_analyzed": len(prioritized),
        "prioritized_tasks": prioritized,
    }

@app.post("/ai/workload", response_model=AIWorkloadAnalysis)
async def ai_analyze_workload(workspace_id: str):
    """AI-powered workload analysis."""
    tasks = [t for t in tasks_db.values()
             if t.workspace_id == workspace_id
             and t.status != TaskStatus.DONE
             and not t.is_archived]

    # Group by assignee
    by_assignee = {}
    for task in tasks:
        for assignee in task.assignees:
            if assignee not in by_assignee:
                by_assignee[assignee] = {
                    "task_count": 0,
                    "estimated_hours": 0,
                    "urgent_count": 0,
                    "overdue_count": 0,
                }
            by_assignee[assignee]["task_count"] += 1
            by_assignee[assignee]["estimated_hours"] += task.estimated_hours or 0
            if task.priority == TaskPriority.URGENT:
                by_assignee[assignee]["urgent_count"] += 1
            if task.due_date and task.due_date < datetime.utcnow():
                by_assignee[assignee]["overdue_count"] += 1

    # Calculate workload scores
    avg_hours = sum(u["estimated_hours"] for u in by_assignee.values()) / max(len(by_assignee), 1)
    overloaded = []
    underutilized = []

    for user_id, data in by_assignee.items():
        if data["estimated_hours"] > avg_hours * 1.5:
            overloaded.append(user_id)
        elif data["estimated_hours"] < avg_hours * 0.5:
            underutilized.append(user_id)

    recommendations = []
    if overloaded:
        recommendations.append(f"Consider redistributing tasks from overloaded team members: {', '.join(overloaded)}")
    if underutilized:
        recommendations.append(f"These team members have capacity for more work: {', '.join(underutilized)}")

    return AIWorkloadAnalysis(
        user_workloads=by_assignee,
        overloaded_users=overloaded,
        underutilized_users=underutilized,
        recommendations=recommendations,
    )

@app.post("/ai/schedule-suggestion", response_model=AIScheduleSuggestion)
async def ai_suggest_schedule(task_id: str, user_id: str):
    """AI-powered scheduling suggestion."""
    task = get_task(task_id)

    # Get user's existing tasks
    user_tasks = [t for t in tasks_db.values()
                  if user_id in t.assignees
                  and t.status != TaskStatus.DONE
                  and t.due_date]

    # Find available slot
    suggested_date = datetime.utcnow() + timedelta(days=1)

    # Check for conflicts
    conflicts = []
    for t in user_tasks:
        if t.due_date and abs((t.due_date - suggested_date).days) < 1:
            conflicts.append({"task_id": t.id, "title": t.title, "due_date": t.due_date})

    if conflicts:
        suggested_date += timedelta(days=1)

    return AIScheduleSuggestion(
        task_id=task_id,
        suggested_date=suggested_date,
        reasoning=f"Suggested date considers current workload and upcoming deadlines. "
                  f"Found {len(conflicts)} potential conflicts that were avoided.",
        conflicts=conflicts,
    )

@app.post("/ai/auto-assign")
async def ai_auto_assign(task_id: str, workspace_id: str):
    """AI-powered task assignment."""
    task = get_task(task_id)
    workspace = get_workspace(workspace_id)

    # Analyze team workloads
    member_workloads = {}
    for member in workspace.members:
        member_tasks = [t for t in tasks_db.values()
                       if member in t.assignees
                       and t.status != TaskStatus.DONE]
        member_workloads[member] = {
            "task_count": len(member_tasks),
            "estimated_hours": sum(t.estimated_hours or 0 for t in member_tasks),
        }

    # Find best assignee (lowest workload)
    best_assignee = min(member_workloads.items(), key=lambda x: x[1]["estimated_hours"])[0]

    task.ai_suggested_assignee = best_assignee

    return {
        "task_id": task_id,
        "suggested_assignee": best_assignee,
        "reasoning": f"Selected based on current workload analysis",
        "member_workloads": member_workloads,
    }

# ============== Views/Reports ==============

@app.get("/my-tasks")
async def get_my_tasks(
    user_id: str,
    workspace_id: str,
    status: Optional[TaskStatus] = None,
    due_filter: Optional[str] = None,  # today, week, overdue
):
    """Get tasks assigned to current user."""
    tasks = [t for t in tasks_db.values()
             if t.workspace_id == workspace_id
             and (user_id in t.assignees or t.assignee_id == user_id)
             and not t.is_archived]

    if status:
        tasks = [t for t in tasks if t.status == status]

    now = datetime.utcnow()
    if due_filter == "today":
        tasks = [t for t in tasks if t.due_date and t.due_date.date() == now.date()]
    elif due_filter == "week":
        week_end = now + timedelta(days=7)
        tasks = [t for t in tasks if t.due_date and t.due_date <= week_end]
    elif due_filter == "overdue":
        tasks = [t for t in tasks if t.due_date and t.due_date < now and t.status != TaskStatus.DONE]

    tasks.sort(key=lambda x: x.due_date or datetime.max)

    return {
        "tasks": tasks,
        "summary": {
            "total": len(tasks),
            "todo": len([t for t in tasks if t.status == TaskStatus.TODO]),
            "in_progress": len([t for t in tasks if t.status == TaskStatus.IN_PROGRESS]),
            "overdue": len([t for t in tasks if t.due_date and t.due_date < now and t.status != TaskStatus.DONE]),
        },
    }

@app.get("/calendar-view")
async def get_calendar_view(
    workspace_id: str,
    start_date: date,
    end_date: date,
    project_id: Optional[str] = None,
):
    """Get tasks in calendar format."""
    tasks = [t for t in tasks_db.values()
             if t.workspace_id == workspace_id
             and not t.is_archived
             and t.due_date]

    if project_id:
        tasks = [t for t in tasks if t.project_id == project_id]

    # Filter by date range
    tasks = [t for t in tasks
             if t.due_date.date() >= start_date and t.due_date.date() <= end_date]

    # Group by date
    by_date = {}
    for task in tasks:
        date_key = task.due_date.date().isoformat()
        if date_key not in by_date:
            by_date[date_key] = []
        by_date[date_key].append(task)

    return by_date

# ============== Statistics ==============

@app.get("/stats/workspace/{workspace_id}")
async def get_workspace_stats(workspace_id: str):
    """Get workspace statistics."""
    tasks = [t for t in tasks_db.values() if t.workspace_id == workspace_id]
    projects = [p for p in projects_db.values() if p.workspace_id == workspace_id]

    now = datetime.utcnow()

    return {
        "workspace_id": workspace_id,
        "total_tasks": len(tasks),
        "completed_tasks": len([t for t in tasks if t.status == TaskStatus.DONE]),
        "overdue_tasks": len([t for t in tasks
                              if t.due_date and t.due_date < now
                              and t.status != TaskStatus.DONE]),
        "total_projects": len(projects),
        "active_projects": len([p for p in projects if p.status == ProjectStatus.ACTIVE]),
        "tasks_by_status": {
            status.value: len([t for t in tasks if t.status == status])
            for status in TaskStatus
        },
        "tasks_by_priority": {
            priority.value: len([t for t in tasks if t.priority == priority])
            for priority in TaskPriority
        },
        "completion_rate": (
            len([t for t in tasks if t.status == TaskStatus.DONE]) / len(tasks) * 100
            if tasks else 0
        ),
    }

# ============== WebSocket ==============

@app.websocket("/ws/{workspace_id}")
async def websocket_endpoint(websocket: WebSocket, workspace_id: str):
    """WebSocket for real-time updates."""
    await websocket.accept()

    if workspace_id not in ws_connections:
        ws_connections[workspace_id] = set()
    ws_connections[workspace_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_connections[workspace_id].discard(websocket)

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-tasks",
        "version": "1.0.0",
        "tasks": len(tasks_db),
        "projects": len(projects_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8010)
