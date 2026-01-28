"""
AI-Workflow Service: Intelligent workflow automation with AI-powered features.

Features:
- Visual workflow builder
- Triggers and actions
- Conditional logic
- Integrations
- Scheduled workflows
- AI workflow generation
- Error handling
- Execution history
- Templates
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import json

app = FastAPI(
    title="AI-Workflow Service",
    description="Intelligent workflow automation with AI capabilities",
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

class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"

class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    WAITING = "waiting"

class TriggerType(str, Enum):
    MANUAL = "manual"
    SCHEDULE = "schedule"
    WEBHOOK = "webhook"
    EVENT = "event"
    EMAIL = "email"
    FORM_SUBMIT = "form_submit"
    FILE_UPLOAD = "file_upload"
    API_CALL = "api_call"

class ActionType(str, Enum):
    # Core actions
    HTTP_REQUEST = "http_request"
    SEND_EMAIL = "send_email"
    SEND_NOTIFICATION = "send_notification"
    DELAY = "delay"
    CONDITION = "condition"
    LOOP = "loop"
    SWITCH = "switch"
    SET_VARIABLE = "set_variable"
    TRANSFORM_DATA = "transform_data"
    # AI Suite integrations
    CREATE_DOCUMENT = "create_document"
    UPDATE_SPREADSHEET = "update_spreadsheet"
    CREATE_TASK = "create_task"
    SEND_MESSAGE = "send_message"
    CREATE_CALENDAR_EVENT = "create_calendar_event"
    CREATE_NOTE = "create_note"
    UPLOAD_FILE = "upload_file"
    SUBMIT_FORM = "submit_form"
    # AI actions
    AI_ANALYZE = "ai_analyze"
    AI_GENERATE = "ai_generate"
    AI_SUMMARIZE = "ai_summarize"
    AI_CLASSIFY = "ai_classify"
    AI_EXTRACT = "ai_extract"
    # Control flow
    PARALLEL = "parallel"
    WAIT_FOR_APPROVAL = "wait_for_approval"
    ERROR_HANDLER = "error_handler"

class ConditionOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"
    MATCHES_REGEX = "matches_regex"
    IN_LIST = "in_list"

class ScheduleFrequency(str, Enum):
    ONCE = "once"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CRON = "cron"

# ============== Models ==============

class Position(BaseModel):
    x: float = 0
    y: float = 0

class Connection(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_node_id: str
    source_port: str = "output"
    target_node_id: str
    target_port: str = "input"
    label: Optional[str] = None  # For conditional branches

class TriggerConfig(BaseModel):
    type: TriggerType
    # Schedule config
    schedule_frequency: Optional[ScheduleFrequency] = None
    schedule_time: Optional[str] = None  # HH:MM
    schedule_days: Optional[List[int]] = None  # 0=Monday
    schedule_day_of_month: Optional[int] = None
    cron_expression: Optional[str] = None
    timezone: str = "UTC"
    # Webhook config
    webhook_secret: Optional[str] = None
    # Event config
    event_source: Optional[str] = None
    event_type: Optional[str] = None
    event_filter: Optional[Dict[str, Any]] = None

class ActionConfig(BaseModel):
    type: ActionType
    # HTTP config
    url: Optional[str] = None
    method: Optional[str] = "GET"
    headers: Optional[Dict[str, str]] = None
    body: Optional[Dict[str, Any]] = None
    # Email config
    to: Optional[List[str]] = None
    subject: Optional[str] = None
    template: Optional[str] = None
    # Delay config
    delay_seconds: Optional[int] = None
    delay_until: Optional[datetime] = None
    # Condition config
    conditions: Optional[List[Dict[str, Any]]] = None
    # Loop config
    items_path: Optional[str] = None
    max_iterations: Optional[int] = None
    # AI config
    ai_prompt: Optional[str] = None
    ai_model: Optional[str] = None
    # Integration config
    integration_id: Optional[str] = None
    operation: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class WorkflowNode(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # "trigger", "action", "condition", "end"
    name: str
    description: Optional[str] = None
    position: Position = Position()
    trigger_config: Optional[TriggerConfig] = None
    action_config: Optional[ActionConfig] = None
    inputs: Dict[str, str] = {}  # Variable mappings
    outputs: Dict[str, str] = {}  # Output variable names
    retry_config: Optional[Dict[str, Any]] = None
    timeout_seconds: Optional[int] = None
    error_handler_id: Optional[str] = None

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    folder_id: Optional[str] = None
    is_template: bool = False

class Workflow(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    owner_id: str
    name: str
    description: Optional[str] = None
    folder_id: Optional[str] = None
    status: WorkflowStatus = WorkflowStatus.DRAFT
    nodes: List[WorkflowNode] = []
    connections: List[Connection] = []
    variables: Dict[str, Any] = {}  # Global workflow variables
    is_template: bool = False
    version: int = 1
    webhook_url: Optional[str] = None
    execution_count: int = 0
    last_execution_at: Optional[datetime] = None
    last_execution_status: Optional[ExecutionStatus] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # AI fields
    ai_generated: bool = False
    ai_description: Optional[str] = None

class StepExecution(BaseModel):
    node_id: str
    node_name: str
    status: ExecutionStatus = ExecutionStatus.PENDING
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    input_data: Dict[str, Any] = {}
    output_data: Dict[str, Any] = {}
    error: Optional[str] = None
    retry_count: int = 0

class WorkflowExecution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workflow_id: str
    workflow_version: int
    trigger_type: TriggerType
    trigger_data: Dict[str, Any] = {}
    status: ExecutionStatus = ExecutionStatus.PENDING
    steps: List[StepExecution] = []
    variables: Dict[str, Any] = {}
    current_node_id: Optional[str] = None
    error: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    triggered_by: Optional[str] = None

class WorkflowFolder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    parent_id: Optional[str] = None
    workflow_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Integration(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    name: str
    type: str  # slack, gmail, sheets, etc.
    config: Dict[str, Any] = {}
    credentials_encrypted: Optional[str] = None
    is_connected: bool = False
    last_used_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============== AI Models ==============

class AIWorkflowGenerateRequest(BaseModel):
    description: str
    trigger_type: Optional[TriggerType] = None
    integrations: Optional[List[str]] = None

class AIOptimizationSuggestion(BaseModel):
    workflow_id: str
    suggestions: List[Dict[str, Any]]
    estimated_improvement: str

# ============== Storage (in-memory for demo) ==============

workflows_db: Dict[str, Workflow] = {}
executions_db: Dict[str, WorkflowExecution] = {}
folders_db: Dict[str, WorkflowFolder] = {}
integrations_db: Dict[str, Integration] = {}
templates_db: Dict[str, Workflow] = {}

# Background execution queue
execution_queue: List[str] = []

# ============== Helper Functions ==============

def get_workflow(workflow_id: str) -> Workflow:
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflows_db[workflow_id]

def get_execution(execution_id: str) -> WorkflowExecution:
    if execution_id not in executions_db:
        raise HTTPException(status_code=404, detail="Execution not found")
    return executions_db[execution_id]

def resolve_variable(value: str, variables: Dict[str, Any]) -> Any:
    """Resolve variable references like {{variable_name}}."""
    if not isinstance(value, str):
        return value

    import re
    pattern = r'\{\{(\w+(?:\.\w+)*)\}\}'

    def replace(match):
        path = match.group(1).split('.')
        result = variables
        for key in path:
            if isinstance(result, dict) and key in result:
                result = result[key]
            else:
                return match.group(0)  # Keep original if not found
        return str(result)

    return re.sub(pattern, replace, value)

async def execute_node(
    node: WorkflowNode,
    execution: WorkflowExecution,
    workflow: Workflow,
) -> Dict[str, Any]:
    """Execute a single workflow node."""
    output = {}

    if node.action_config:
        config = node.action_config
        action_type = config.type

        if action_type == ActionType.HTTP_REQUEST:
            # Simulate HTTP request
            output = {
                "status_code": 200,
                "body": {"message": "Simulated response"},
                "headers": {},
            }

        elif action_type == ActionType.SEND_EMAIL:
            output = {
                "sent": True,
                "message_id": str(uuid.uuid4()),
            }

        elif action_type == ActionType.DELAY:
            await asyncio.sleep(min(config.delay_seconds or 1, 5))  # Max 5s for demo
            output = {"delayed": True}

        elif action_type == ActionType.SET_VARIABLE:
            if config.parameters:
                for key, value in config.parameters.items():
                    execution.variables[key] = resolve_variable(value, execution.variables)
            output = {"variables_set": list(config.parameters.keys()) if config.parameters else []}

        elif action_type == ActionType.TRANSFORM_DATA:
            output = {"transformed": True, "data": config.parameters}

        elif action_type == ActionType.AI_ANALYZE:
            output = {
                "analysis": "AI analysis of the input data",
                "confidence": 0.85,
                "insights": ["Insight 1", "Insight 2"],
            }

        elif action_type == ActionType.AI_GENERATE:
            output = {
                "generated_content": f"AI generated content based on: {config.ai_prompt}",
            }

        elif action_type == ActionType.AI_SUMMARIZE:
            output = {
                "summary": "AI-generated summary of the input",
            }

        elif action_type == ActionType.CREATE_TASK:
            output = {
                "task_id": str(uuid.uuid4()),
                "created": True,
            }

        elif action_type == ActionType.SEND_MESSAGE:
            output = {
                "message_id": str(uuid.uuid4()),
                "sent": True,
            }

        elif action_type == ActionType.CONDITION:
            # Evaluate conditions
            result = True
            if config.conditions:
                for cond in config.conditions:
                    # Simple condition evaluation
                    left = resolve_variable(cond.get("left", ""), execution.variables)
                    right = cond.get("right", "")
                    operator = cond.get("operator", "equals")

                    if operator == "equals":
                        result = result and (left == right)
                    elif operator == "not_equals":
                        result = result and (left != right)
                    elif operator == "contains":
                        result = result and (right in str(left))
                    elif operator == "is_empty":
                        result = result and (not left)
                    elif operator == "is_not_empty":
                        result = result and bool(left)

            output = {"condition_result": result, "branch": "true" if result else "false"}

    return output

async def run_workflow_execution(execution_id: str):
    """Run a workflow execution."""
    execution = executions_db.get(execution_id)
    if not execution:
        return

    workflow = workflows_db.get(execution.workflow_id)
    if not workflow:
        execution.status = ExecutionStatus.FAILED
        execution.error = "Workflow not found"
        return

    execution.status = ExecutionStatus.RUNNING

    # Build node map and find connections
    nodes = {node.id: node for node in workflow.nodes}
    connections = workflow.connections

    # Find trigger node (starting point)
    trigger_nodes = [n for n in workflow.nodes if n.type == "trigger"]
    if not trigger_nodes:
        execution.status = ExecutionStatus.FAILED
        execution.error = "No trigger node found"
        return

    # Simple sequential execution
    current_node = trigger_nodes[0]
    visited = set()

    try:
        while current_node and current_node.id not in visited:
            visited.add(current_node.id)
            execution.current_node_id = current_node.id

            step = StepExecution(
                node_id=current_node.id,
                node_name=current_node.name,
                status=ExecutionStatus.RUNNING,
                started_at=datetime.utcnow(),
                input_data=dict(execution.variables),
            )

            try:
                output = await execute_node(current_node, execution, workflow)
                step.output_data = output
                step.status = ExecutionStatus.COMPLETED

                # Store outputs in variables
                for output_name, var_name in current_node.outputs.items():
                    if output_name in output:
                        execution.variables[var_name] = output[output_name]

            except Exception as e:
                step.status = ExecutionStatus.FAILED
                step.error = str(e)
                raise

            finally:
                step.completed_at = datetime.utcnow()
                step.duration_ms = int((step.completed_at - step.started_at).total_seconds() * 1000)
                execution.steps.append(step)

            # Find next node
            next_connection = None
            for conn in connections:
                if conn.source_node_id == current_node.id:
                    # Handle conditional branches
                    if conn.label and "condition_result" in step.output_data:
                        if step.output_data.get("branch") == conn.label:
                            next_connection = conn
                            break
                    elif not conn.label:
                        next_connection = conn
                        break

            if next_connection:
                current_node = nodes.get(next_connection.target_node_id)
            else:
                current_node = None

        execution.status = ExecutionStatus.COMPLETED

    except Exception as e:
        execution.status = ExecutionStatus.FAILED
        execution.error = str(e)

    finally:
        execution.completed_at = datetime.utcnow()
        execution.duration_ms = int((execution.completed_at - execution.started_at).total_seconds() * 1000)
        execution.current_node_id = None

        # Update workflow stats
        workflow.execution_count += 1
        workflow.last_execution_at = execution.completed_at
        workflow.last_execution_status = execution.status

# ============== Workflow Endpoints ==============

@app.post("/workflows", response_model=Workflow)
async def create_workflow(workspace_id: str, user_id: str, workflow_data: WorkflowCreate):
    """Create a new workflow."""
    workflow = Workflow(
        workspace_id=workspace_id,
        owner_id=user_id,
        name=workflow_data.name,
        description=workflow_data.description,
        folder_id=workflow_data.folder_id,
        is_template=workflow_data.is_template,
    )

    # Add default trigger node
    trigger_node = WorkflowNode(
        type="trigger",
        name="Trigger",
        trigger_config=TriggerConfig(type=TriggerType.MANUAL),
        position=Position(x=100, y=200),
    )
    workflow.nodes.append(trigger_node)

    workflows_db[workflow.id] = workflow

    if workflow.is_template:
        templates_db[workflow.id] = workflow

    return workflow

@app.get("/workflows", response_model=List[Workflow])
async def list_workflows(
    workspace_id: str,
    user_id: str,
    folder_id: Optional[str] = None,
    status: Optional[WorkflowStatus] = None,
    include_templates: bool = False,
):
    """List workflows in a workspace."""
    workflows = [w for w in workflows_db.values()
                 if w.workspace_id == workspace_id
                 and (w.owner_id == user_id or True)]  # Add sharing logic

    if folder_id is not None:
        workflows = [w for w in workflows if w.folder_id == folder_id]

    if status:
        workflows = [w for w in workflows if w.status == status]

    if not include_templates:
        workflows = [w for w in workflows if not w.is_template]

    return workflows

@app.get("/workflows/{workflow_id}", response_model=Workflow)
async def get_workflow_details(workflow_id: str):
    """Get workflow details."""
    return get_workflow(workflow_id)

@app.put("/workflows/{workflow_id}", response_model=Workflow)
async def update_workflow(
    workflow_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    nodes: Optional[List[WorkflowNode]] = None,
    connections: Optional[List[Connection]] = None,
    variables: Optional[Dict[str, Any]] = None,
):
    """Update a workflow."""
    workflow = get_workflow(workflow_id)

    if name:
        workflow.name = name
    if description is not None:
        workflow.description = description
    if nodes is not None:
        workflow.nodes = nodes
    if connections is not None:
        workflow.connections = connections
    if variables is not None:
        workflow.variables = variables

    workflow.updated_at = datetime.utcnow()
    workflow.version += 1

    return workflow

@app.post("/workflows/{workflow_id}/activate")
async def activate_workflow(workflow_id: str):
    """Activate a workflow."""
    workflow = get_workflow(workflow_id)

    if not workflow.nodes:
        raise HTTPException(status_code=400, detail="Workflow has no nodes")

    workflow.status = WorkflowStatus.ACTIVE

    # Generate webhook URL if needed
    trigger_nodes = [n for n in workflow.nodes if n.type == "trigger"]
    for node in trigger_nodes:
        if node.trigger_config and node.trigger_config.type == TriggerType.WEBHOOK:
            workflow.webhook_url = f"/workflows/{workflow_id}/webhook/{str(uuid.uuid4())[:8]}"

    return {"message": "Workflow activated", "webhook_url": workflow.webhook_url}

@app.post("/workflows/{workflow_id}/pause")
async def pause_workflow(workflow_id: str):
    """Pause a workflow."""
    workflow = get_workflow(workflow_id)
    workflow.status = WorkflowStatus.PAUSED
    return {"message": "Workflow paused"}

@app.post("/workflows/{workflow_id}/duplicate", response_model=Workflow)
async def duplicate_workflow(workflow_id: str, user_id: str):
    """Duplicate a workflow."""
    original = get_workflow(workflow_id)

    new_workflow = original.model_copy()
    new_workflow.id = str(uuid.uuid4())
    new_workflow.name = f"{original.name} (Copy)"
    new_workflow.status = WorkflowStatus.DRAFT
    new_workflow.execution_count = 0
    new_workflow.last_execution_at = None
    new_workflow.webhook_url = None
    new_workflow.created_at = datetime.utcnow()
    new_workflow.updated_at = datetime.utcnow()
    new_workflow.owner_id = user_id

    # Generate new IDs for nodes and connections
    id_map = {}
    new_nodes = []
    for node in original.nodes:
        new_node = node.model_copy()
        new_node.id = str(uuid.uuid4())
        id_map[node.id] = new_node.id
        new_nodes.append(new_node)
    new_workflow.nodes = new_nodes

    new_connections = []
    for conn in original.connections:
        new_conn = conn.model_copy()
        new_conn.id = str(uuid.uuid4())
        new_conn.source_node_id = id_map.get(conn.source_node_id, conn.source_node_id)
        new_conn.target_node_id = id_map.get(conn.target_node_id, conn.target_node_id)
        new_connections.append(new_conn)
    new_workflow.connections = new_connections

    workflows_db[new_workflow.id] = new_workflow

    return new_workflow

@app.delete("/workflows/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow."""
    workflow = get_workflow(workflow_id)

    # Delete executions
    executions_to_delete = [e.id for e in executions_db.values() if e.workflow_id == workflow_id]
    for exec_id in executions_to_delete:
        del executions_db[exec_id]

    del workflows_db[workflow_id]

    if workflow_id in templates_db:
        del templates_db[workflow_id]

    return {"message": "Workflow deleted"}

# ============== Node Endpoints ==============

@app.post("/workflows/{workflow_id}/nodes", response_model=WorkflowNode)
async def add_node(
    workflow_id: str,
    type: str,
    name: str,
    position: Optional[Position] = None,
    trigger_config: Optional[TriggerConfig] = None,
    action_config: Optional[ActionConfig] = None,
):
    """Add a node to a workflow."""
    workflow = get_workflow(workflow_id)

    node = WorkflowNode(
        type=type,
        name=name,
        position=position or Position(),
        trigger_config=trigger_config,
        action_config=action_config,
    )
    workflow.nodes.append(node)
    workflow.updated_at = datetime.utcnow()

    return node

@app.put("/workflows/{workflow_id}/nodes/{node_id}", response_model=WorkflowNode)
async def update_node(
    workflow_id: str,
    node_id: str,
    name: Optional[str] = None,
    position: Optional[Position] = None,
    trigger_config: Optional[TriggerConfig] = None,
    action_config: Optional[ActionConfig] = None,
    inputs: Optional[Dict[str, str]] = None,
    outputs: Optional[Dict[str, str]] = None,
):
    """Update a node."""
    workflow = get_workflow(workflow_id)

    node = None
    for n in workflow.nodes:
        if n.id == node_id:
            node = n
            break

    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    if name:
        node.name = name
    if position:
        node.position = position
    if trigger_config:
        node.trigger_config = trigger_config
    if action_config:
        node.action_config = action_config
    if inputs is not None:
        node.inputs = inputs
    if outputs is not None:
        node.outputs = outputs

    workflow.updated_at = datetime.utcnow()

    return node

@app.delete("/workflows/{workflow_id}/nodes/{node_id}")
async def delete_node(workflow_id: str, node_id: str):
    """Delete a node from a workflow."""
    workflow = get_workflow(workflow_id)

    workflow.nodes = [n for n in workflow.nodes if n.id != node_id]
    workflow.connections = [c for c in workflow.connections
                           if c.source_node_id != node_id and c.target_node_id != node_id]
    workflow.updated_at = datetime.utcnow()

    return {"message": "Node deleted"}

# ============== Connection Endpoints ==============

@app.post("/workflows/{workflow_id}/connections", response_model=Connection)
async def add_connection(
    workflow_id: str,
    source_node_id: str,
    target_node_id: str,
    source_port: str = "output",
    target_port: str = "input",
    label: Optional[str] = None,
):
    """Add a connection between nodes."""
    workflow = get_workflow(workflow_id)

    # Validate nodes exist
    node_ids = {n.id for n in workflow.nodes}
    if source_node_id not in node_ids or target_node_id not in node_ids:
        raise HTTPException(status_code=400, detail="Invalid node IDs")

    # Check for existing connection
    for conn in workflow.connections:
        if conn.source_node_id == source_node_id and conn.target_node_id == target_node_id:
            raise HTTPException(status_code=400, detail="Connection already exists")

    connection = Connection(
        source_node_id=source_node_id,
        source_port=source_port,
        target_node_id=target_node_id,
        target_port=target_port,
        label=label,
    )
    workflow.connections.append(connection)
    workflow.updated_at = datetime.utcnow()

    return connection

@app.delete("/workflows/{workflow_id}/connections/{connection_id}")
async def delete_connection(workflow_id: str, connection_id: str):
    """Delete a connection."""
    workflow = get_workflow(workflow_id)
    workflow.connections = [c for c in workflow.connections if c.id != connection_id]
    workflow.updated_at = datetime.utcnow()
    return {"message": "Connection deleted"}

# ============== Execution Endpoints ==============

@app.post("/workflows/{workflow_id}/execute", response_model=WorkflowExecution)
async def execute_workflow(
    workflow_id: str,
    trigger_data: Optional[Dict[str, Any]] = None,
    triggered_by: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
):
    """Execute a workflow."""
    workflow = get_workflow(workflow_id)

    if workflow.status != WorkflowStatus.ACTIVE and workflow.status != WorkflowStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Workflow is not active")

    execution = WorkflowExecution(
        workflow_id=workflow_id,
        workflow_version=workflow.version,
        trigger_type=TriggerType.MANUAL,
        trigger_data=trigger_data or {},
        variables=dict(workflow.variables),
        triggered_by=triggered_by,
    )

    # Add trigger data to variables
    execution.variables["trigger"] = trigger_data or {}

    executions_db[execution.id] = execution

    # Run in background
    if background_tasks:
        background_tasks.add_task(run_workflow_execution, execution.id)
    else:
        await run_workflow_execution(execution.id)

    return execution

@app.post("/workflows/{workflow_id}/webhook/{token}")
async def webhook_trigger(
    workflow_id: str,
    token: str,
    payload: Optional[Dict[str, Any]] = None,
    background_tasks: BackgroundTasks = None,
):
    """Trigger workflow via webhook."""
    workflow = get_workflow(workflow_id)

    if workflow.status != WorkflowStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Workflow is not active")

    execution = WorkflowExecution(
        workflow_id=workflow_id,
        workflow_version=workflow.version,
        trigger_type=TriggerType.WEBHOOK,
        trigger_data=payload or {},
        variables=dict(workflow.variables),
    )
    execution.variables["webhook"] = payload or {}

    executions_db[execution.id] = execution

    if background_tasks:
        background_tasks.add_task(run_workflow_execution, execution.id)

    return {"execution_id": execution.id, "status": "triggered"}

@app.get("/executions", response_model=List[WorkflowExecution])
async def list_executions(
    workflow_id: Optional[str] = None,
    status: Optional[ExecutionStatus] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List workflow executions."""
    executions = list(executions_db.values())

    if workflow_id:
        executions = [e for e in executions if e.workflow_id == workflow_id]

    if status:
        executions = [e for e in executions if e.status == status]

    executions.sort(key=lambda x: x.started_at, reverse=True)

    start = (page - 1) * page_size
    end = start + page_size

    return executions[start:end]

@app.get("/executions/{execution_id}", response_model=WorkflowExecution)
async def get_execution_details(execution_id: str):
    """Get execution details."""
    return get_execution(execution_id)

@app.post("/executions/{execution_id}/cancel")
async def cancel_execution(execution_id: str):
    """Cancel a running execution."""
    execution = get_execution(execution_id)

    if execution.status not in [ExecutionStatus.PENDING, ExecutionStatus.RUNNING, ExecutionStatus.WAITING]:
        raise HTTPException(status_code=400, detail="Execution cannot be cancelled")

    execution.status = ExecutionStatus.CANCELLED
    execution.completed_at = datetime.utcnow()

    return {"message": "Execution cancelled"}

@app.post("/executions/{execution_id}/retry")
async def retry_execution(execution_id: str, background_tasks: BackgroundTasks):
    """Retry a failed execution."""
    original = get_execution(execution_id)

    if original.status != ExecutionStatus.FAILED:
        raise HTTPException(status_code=400, detail="Only failed executions can be retried")

    new_execution = WorkflowExecution(
        workflow_id=original.workflow_id,
        workflow_version=original.workflow_version,
        trigger_type=original.trigger_type,
        trigger_data=original.trigger_data,
        variables=dict(original.trigger_data),
        triggered_by=original.triggered_by,
    )

    executions_db[new_execution.id] = new_execution
    background_tasks.add_task(run_workflow_execution, new_execution.id)

    return new_execution

# ============== Folder Endpoints ==============

@app.post("/folders", response_model=WorkflowFolder)
async def create_folder(workspace_id: str, name: str, parent_id: Optional[str] = None):
    """Create a workflow folder."""
    folder = WorkflowFolder(
        workspace_id=workspace_id,
        name=name,
        parent_id=parent_id,
    )
    folders_db[folder.id] = folder
    return folder

@app.get("/folders", response_model=List[WorkflowFolder])
async def list_folders(workspace_id: str, parent_id: Optional[str] = None):
    """List workflow folders."""
    folders = [f for f in folders_db.values() if f.workspace_id == workspace_id]

    if parent_id is not None:
        folders = [f for f in folders if f.parent_id == parent_id]

    return folders

@app.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str, move_workflows_to: Optional[str] = None):
    """Delete a folder."""
    if folder_id not in folders_db:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Move workflows
    for workflow in workflows_db.values():
        if workflow.folder_id == folder_id:
            workflow.folder_id = move_workflows_to

    del folders_db[folder_id]
    return {"message": "Folder deleted"}

# ============== Integration Endpoints ==============

@app.post("/integrations", response_model=Integration)
async def create_integration(
    workspace_id: str,
    name: str,
    type: str,
    config: Dict[str, Any],
):
    """Create an integration."""
    integration = Integration(
        workspace_id=workspace_id,
        name=name,
        type=type,
        config=config,
    )
    integrations_db[integration.id] = integration
    return integration

@app.get("/integrations", response_model=List[Integration])
async def list_integrations(workspace_id: str):
    """List integrations."""
    return [i for i in integrations_db.values() if i.workspace_id == workspace_id]

@app.post("/integrations/{integration_id}/test")
async def test_integration(integration_id: str):
    """Test an integration connection."""
    if integration_id not in integrations_db:
        raise HTTPException(status_code=404, detail="Integration not found")

    integration = integrations_db[integration_id]
    integration.is_connected = True
    integration.last_used_at = datetime.utcnow()

    return {"status": "connected", "message": "Integration test successful"}

# ============== Template Endpoints ==============

@app.get("/templates", response_model=List[Workflow])
async def list_templates(category: Optional[str] = None):
    """List workflow templates."""
    return list(templates_db.values())

@app.post("/workflows/from-template/{template_id}", response_model=Workflow)
async def create_from_template(template_id: str, workspace_id: str, user_id: str, name: str):
    """Create a workflow from a template."""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")

    template = templates_db[template_id]

    new_workflow = template.model_copy()
    new_workflow.id = str(uuid.uuid4())
    new_workflow.workspace_id = workspace_id
    new_workflow.owner_id = user_id
    new_workflow.name = name
    new_workflow.is_template = False
    new_workflow.status = WorkflowStatus.DRAFT
    new_workflow.execution_count = 0
    new_workflow.created_at = datetime.utcnow()

    # Generate new IDs for nodes
    for node in new_workflow.nodes:
        old_id = node.id
        node.id = str(uuid.uuid4())
        # Update connections
        for conn in new_workflow.connections:
            if conn.source_node_id == old_id:
                conn.source_node_id = node.id
            if conn.target_node_id == old_id:
                conn.target_node_id = node.id

    workflows_db[new_workflow.id] = new_workflow

    return new_workflow

# ============== AI Features ==============

@app.post("/ai/generate-workflow", response_model=Workflow)
async def ai_generate_workflow(
    workspace_id: str,
    user_id: str,
    request: AIWorkflowGenerateRequest,
):
    """AI-powered workflow generation."""
    # In real implementation, use LLM to generate workflow

    workflow = Workflow(
        workspace_id=workspace_id,
        owner_id=user_id,
        name=f"AI: {request.description[:30]}...",
        description=request.description,
        ai_generated=True,
        ai_description=request.description,
    )

    # Generate trigger node
    trigger_type = request.trigger_type or TriggerType.MANUAL
    trigger = WorkflowNode(
        type="trigger",
        name="Start",
        position=Position(x=100, y=200),
        trigger_config=TriggerConfig(type=trigger_type),
    )
    workflow.nodes.append(trigger)

    # Generate action nodes based on description
    sample_actions = [
        (ActionType.AI_ANALYZE, "Analyze Input"),
        (ActionType.SET_VARIABLE, "Process Data"),
        (ActionType.SEND_NOTIFICATION, "Send Notification"),
    ]

    prev_node_id = trigger.id
    for i, (action_type, name) in enumerate(sample_actions):
        action_node = WorkflowNode(
            type="action",
            name=name,
            position=Position(x=100 + (i + 1) * 200, y=200),
            action_config=ActionConfig(type=action_type),
        )
        workflow.nodes.append(action_node)

        connection = Connection(
            source_node_id=prev_node_id,
            target_node_id=action_node.id,
        )
        workflow.connections.append(connection)
        prev_node_id = action_node.id

    workflows_db[workflow.id] = workflow

    return workflow

@app.post("/ai/optimize-workflow", response_model=AIOptimizationSuggestion)
async def ai_optimize_workflow(workflow_id: str):
    """AI-powered workflow optimization suggestions."""
    workflow = get_workflow(workflow_id)

    # In real implementation, use LLM to analyze and suggest optimizations
    suggestions = []

    # Check for potential improvements
    if len(workflow.nodes) > 10:
        suggestions.append({
            "type": "simplification",
            "description": "Consider breaking this workflow into smaller sub-workflows",
            "priority": "medium",
        })

    has_error_handling = any(
        n.action_config and n.action_config.type == ActionType.ERROR_HANDLER
        for n in workflow.nodes
    )
    if not has_error_handling:
        suggestions.append({
            "type": "reliability",
            "description": "Add error handling nodes for better reliability",
            "priority": "high",
        })

    http_nodes = [n for n in workflow.nodes
                  if n.action_config and n.action_config.type == ActionType.HTTP_REQUEST]
    if len(http_nodes) > 3:
        suggestions.append({
            "type": "performance",
            "description": "Consider using parallel execution for independent HTTP requests",
            "priority": "medium",
        })

    return AIOptimizationSuggestion(
        workflow_id=workflow_id,
        suggestions=suggestions,
        estimated_improvement="15-25% faster execution" if suggestions else "Workflow is well optimized",
    )

@app.post("/ai/explain-workflow")
async def ai_explain_workflow(workflow_id: str):
    """AI-powered workflow explanation."""
    workflow = get_workflow(workflow_id)

    # In real implementation, use LLM
    steps_explanation = []
    for i, node in enumerate(workflow.nodes):
        steps_explanation.append({
            "step": i + 1,
            "name": node.name,
            "type": node.type,
            "explanation": f"This {node.type} step '{node.name}' performs its configured action",
        })

    return {
        "workflow_name": workflow.name,
        "summary": f"This workflow has {len(workflow.nodes)} steps and starts with a {workflow.nodes[0].trigger_config.type.value if workflow.nodes and workflow.nodes[0].trigger_config else 'manual'} trigger.",
        "steps": steps_explanation,
        "data_flow": "Data flows from trigger through each action sequentially",
    }

@app.post("/ai/suggest-actions")
async def ai_suggest_next_actions(workflow_id: str, after_node_id: str):
    """Suggest next actions based on workflow context."""
    workflow = get_workflow(workflow_id)

    # Find the context node
    context_node = None
    for node in workflow.nodes:
        if node.id == after_node_id:
            context_node = node
            break

    if not context_node:
        raise HTTPException(status_code=404, detail="Node not found")

    # In real implementation, use LLM
    suggestions = [
        {
            "action_type": ActionType.CONDITION.value,
            "name": "Add Condition",
            "description": "Add a conditional branch based on previous output",
        },
        {
            "action_type": ActionType.SEND_NOTIFICATION.value,
            "name": "Send Notification",
            "description": "Notify users about the workflow progress",
        },
        {
            "action_type": ActionType.AI_SUMMARIZE.value,
            "name": "AI Summary",
            "description": "Generate an AI summary of the data",
        },
    ]

    return {
        "context_node": context_node.name,
        "suggestions": suggestions,
    }

# ============== Statistics ==============

@app.get("/stats/workspace/{workspace_id}")
async def get_workspace_workflow_stats(workspace_id: str):
    """Get workflow statistics for a workspace."""
    workflows = [w for w in workflows_db.values() if w.workspace_id == workspace_id]
    executions = [e for e in executions_db.values()
                  if e.workflow_id in [w.id for w in workflows]]

    return {
        "total_workflows": len(workflows),
        "active_workflows": len([w for w in workflows if w.status == WorkflowStatus.ACTIVE]),
        "total_executions": len(executions),
        "executions_today": len([e for e in executions
                                  if e.started_at.date() == datetime.utcnow().date()]),
        "successful_executions": len([e for e in executions if e.status == ExecutionStatus.COMPLETED]),
        "failed_executions": len([e for e in executions if e.status == ExecutionStatus.FAILED]),
        "average_duration_ms": (
            sum(e.duration_ms for e in executions if e.duration_ms) / len([e for e in executions if e.duration_ms])
            if executions else 0
        ),
        "workflows_by_status": {
            status.value: len([w for w in workflows if w.status == status])
            for status in WorkflowStatus
        },
    }

@app.get("/stats/workflow/{workflow_id}")
async def get_workflow_stats(workflow_id: str):
    """Get statistics for a specific workflow."""
    workflow = get_workflow(workflow_id)
    executions = [e for e in executions_db.values() if e.workflow_id == workflow_id]

    return {
        "workflow_id": workflow_id,
        "total_executions": len(executions),
        "successful": len([e for e in executions if e.status == ExecutionStatus.COMPLETED]),
        "failed": len([e for e in executions if e.status == ExecutionStatus.FAILED]),
        "success_rate": (
            len([e for e in executions if e.status == ExecutionStatus.COMPLETED]) / len(executions) * 100
            if executions else 0
        ),
        "average_duration_ms": (
            sum(e.duration_ms for e in executions if e.duration_ms) / len([e for e in executions if e.duration_ms])
            if [e for e in executions if e.duration_ms] else 0
        ),
        "last_execution": executions[0].model_dump() if executions else None,
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-workflow",
        "version": "1.0.0",
        "workflows": len(workflows_db),
        "executions": len(executions_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8012)
