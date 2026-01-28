"""
AI-Assistant Service: Omnipresent AI Copilot across all AI-Suite applications.

Features:
- Natural language commands
- Cross-app operations
- Context-aware assistance
- Multi-turn conversations
- Proactive suggestions
- Workflow automation
- Knowledge base integration
- Personalization
- Voice commands
"""

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set, Union
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import json
import re

app = FastAPI(
    title="AI-Assistant Service",
    description="Omnipresent AI Copilot for AI-Suite",
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

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"
    FUNCTION = "function"

class IntentCategory(str, Enum):
    # Document operations
    CREATE_DOCUMENT = "create_document"
    EDIT_DOCUMENT = "edit_document"
    SUMMARIZE_DOCUMENT = "summarize_document"
    TRANSLATE_DOCUMENT = "translate_document"
    # Spreadsheet operations
    CREATE_SPREADSHEET = "create_spreadsheet"
    ANALYZE_DATA = "analyze_data"
    CREATE_CHART = "create_chart"
    WRITE_FORMULA = "write_formula"
    # Email operations
    COMPOSE_EMAIL = "compose_email"
    SUMMARIZE_EMAILS = "summarize_emails"
    SEARCH_EMAILS = "search_emails"
    # Calendar operations
    SCHEDULE_MEETING = "schedule_meeting"
    CHECK_AVAILABILITY = "check_availability"
    RESCHEDULE_EVENT = "reschedule_event"
    # Task operations
    CREATE_TASK = "create_task"
    LIST_TASKS = "list_tasks"
    UPDATE_TASK = "update_task"
    # File operations
    SEARCH_FILES = "search_files"
    ORGANIZE_FILES = "organize_files"
    SHARE_FILE = "share_file"
    # Communication
    SEND_MESSAGE = "send_message"
    START_MEETING = "start_meeting"
    # General
    SEARCH = "search"
    HELP = "help"
    EXPLAIN = "explain"
    GENERATE = "generate"
    UNKNOWN = "unknown"

class AppContext(str, Enum):
    GLOBAL = "global"
    DOCS = "docs"
    SHEETS = "sheets"
    SLIDES = "slides"
    MAIL = "mail"
    CALENDAR = "calendar"
    DRIVE = "drive"
    TASKS = "tasks"
    NOTES = "notes"
    COLLAB = "collab"
    FORMS = "forms"
    WORKFLOW = "workflow"

class SuggestionType(str, Enum):
    ACTION = "action"
    COMPLETION = "completion"
    CORRECTION = "correction"
    RECOMMENDATION = "recommendation"
    SHORTCUT = "shortcut"

class FeedbackType(str, Enum):
    HELPFUL = "helpful"
    NOT_HELPFUL = "not_helpful"
    INCORRECT = "incorrect"
    INCOMPLETE = "incomplete"

# ============== Models ==============

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: MessageRole
    content: str
    function_call: Optional[Dict[str, Any]] = None
    function_result: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

class Conversation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: Optional[str] = None
    messages: List[Message] = []
    context: AppContext = AppContext.GLOBAL
    active_document_id: Optional[str] = None
    active_app_state: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_archived: bool = False

class Intent(BaseModel):
    category: IntentCategory
    confidence: float
    entities: Dict[str, Any] = {}
    parameters: Dict[str, Any] = {}
    requires_confirmation: bool = False

class ActionResult(BaseModel):
    success: bool
    action: str
    result: Optional[Any] = None
    error: Optional[str] = None
    follow_up_actions: List[str] = []
    affected_items: List[Dict[str, Any]] = []

class Suggestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: SuggestionType
    title: str
    description: Optional[str] = None
    action: Optional[str] = None
    parameters: Dict[str, Any] = {}
    context: AppContext = AppContext.GLOBAL
    priority: int = 0
    expires_at: Optional[datetime] = None

class QuickAction(BaseModel):
    id: str
    name: str
    icon: str
    command: str
    description: str
    category: str

class UserPreferences(BaseModel):
    user_id: str
    preferred_language: str = "en"
    response_style: str = "concise"  # concise, detailed, conversational
    proactive_suggestions: bool = True
    voice_enabled: bool = False
    keyboard_shortcuts: bool = True
    default_apps: Dict[str, str] = {}
    custom_commands: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class KnowledgeEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None  # None for global knowledge
    category: str
    title: str
    content: str
    keywords: List[str] = []
    source: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CommandHistory(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    command: str
    intent: IntentCategory
    success: bool
    execution_time_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============== Request/Response Models ==============

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    context: AppContext = AppContext.GLOBAL
    active_document_id: Optional[str] = None
    app_state: Optional[Dict[str, Any]] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class ChatResponse(BaseModel):
    message: str
    conversation_id: str
    intent: Optional[Intent] = None
    actions_performed: List[ActionResult] = []
    suggestions: List[Suggestion] = []
    quick_replies: List[str] = []
    requires_more_info: bool = False
    follow_up_questions: List[str] = []

class CommandRequest(BaseModel):
    command: str
    parameters: Optional[Dict[str, Any]] = None
    context: AppContext = AppContext.GLOBAL

class VoiceRequest(BaseModel):
    audio_data: str  # Base64 encoded audio
    language: str = "en"

# ============== Storage (in-memory for demo) ==============

conversations_db: Dict[str, Conversation] = {}
preferences_db: Dict[str, UserPreferences] = {}
knowledge_db: Dict[str, KnowledgeEntry] = {}
command_history_db: Dict[str, List[CommandHistory]] = {}
active_sessions: Dict[str, Set[WebSocket]] = {}

# ============== Intent Patterns ==============

INTENT_PATTERNS = {
    IntentCategory.CREATE_DOCUMENT: [
        r"create (?:a )?(?:new )?(?:document|doc)",
        r"write (?:a )?(?:new )?(?:document|doc|letter|report)",
        r"start (?:a )?(?:new )?(?:document|doc)",
    ],
    IntentCategory.SUMMARIZE_DOCUMENT: [
        r"summarize (?:this|the) (?:document|doc|text|content)",
        r"give me a summary",
        r"what(?:'s| is) this (?:document|doc) about",
        r"tldr",
    ],
    IntentCategory.COMPOSE_EMAIL: [
        r"compose (?:an? )?email",
        r"write (?:an? )?email",
        r"send (?:an? )?email",
        r"draft (?:an? )?email",
    ],
    IntentCategory.SCHEDULE_MEETING: [
        r"schedule (?:a )?meeting",
        r"set up (?:a )?meeting",
        r"book (?:a )?meeting",
        r"create (?:an? )?(?:meeting|event|appointment)",
    ],
    IntentCategory.CHECK_AVAILABILITY: [
        r"check (?:my )?(?:calendar|availability|schedule)",
        r"when am i (?:free|available)",
        r"what(?:'s| is) (?:on )?my (?:calendar|schedule)",
    ],
    IntentCategory.CREATE_TASK: [
        r"create (?:a )?(?:new )?task",
        r"add (?:a )?(?:new )?task",
        r"remind me to",
        r"i need to",
    ],
    IntentCategory.LIST_TASKS: [
        r"(?:show|list|what are) (?:my )?tasks",
        r"what do i (?:need to do|have to do)",
        r"my (?:todo|to-do) list",
    ],
    IntentCategory.SEARCH_FILES: [
        r"(?:find|search|look for) (?:a )?file",
        r"where is (?:my|the) (?:file|document)",
        r"search (?:for|in) (?:my )?(?:files|drive)",
    ],
    IntentCategory.ANALYZE_DATA: [
        r"analyze (?:this|the) (?:data|spreadsheet|numbers)",
        r"what (?:do|does) (?:this|the) data (?:show|mean)",
        r"insights (?:from|on) (?:this|the) data",
    ],
    IntentCategory.CREATE_CHART: [
        r"create (?:a )?(?:chart|graph|visualization)",
        r"visualize (?:this|the) data",
        r"make (?:a )?(?:chart|graph)",
    ],
    IntentCategory.HELP: [
        r"help(?: me)?",
        r"what can you do",
        r"how (?:do|can) i",
    ],
    IntentCategory.SEARCH: [
        r"search (?:for )?",
        r"find ",
        r"look (?:for|up) ",
    ],
}

# ============== Quick Actions ==============

QUICK_ACTIONS = [
    QuickAction(id="new_doc", name="New Document", icon="📄", command="create new document", description="Create a new document", category="documents"),
    QuickAction(id="new_sheet", name="New Spreadsheet", icon="📊", command="create new spreadsheet", description="Create a new spreadsheet", category="spreadsheets"),
    QuickAction(id="new_slide", name="New Presentation", icon="📽️", command="create new presentation", description="Create a new presentation", category="presentations"),
    QuickAction(id="compose_email", name="Compose Email", icon="✉️", command="compose email", description="Write a new email", category="email"),
    QuickAction(id="schedule", name="Schedule Meeting", icon="📅", command="schedule meeting", description="Schedule a new meeting", category="calendar"),
    QuickAction(id="new_task", name="New Task", icon="✅", command="create task", description="Add a new task", category="tasks"),
    QuickAction(id="search", name="Search", icon="🔍", command="search", description="Search across all apps", category="general"),
    QuickAction(id="summarize", name="Summarize", icon="📝", command="summarize this", description="Summarize current content", category="ai"),
]

# ============== Helper Functions ==============

def get_conversation(conversation_id: str) -> Conversation:
    if conversation_id not in conversations_db:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conversations_db[conversation_id]

def detect_intent(message: str, context: AppContext) -> Intent:
    """Detect user intent from message."""
    message_lower = message.lower().strip()

    for intent_category, patterns in INTENT_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, message_lower):
                return Intent(
                    category=intent_category,
                    confidence=0.85,
                    entities=extract_entities(message),
                )

    # Context-specific defaults
    if context == AppContext.DOCS:
        if "write" in message_lower or "add" in message_lower:
            return Intent(category=IntentCategory.EDIT_DOCUMENT, confidence=0.7)
    elif context == AppContext.SHEETS:
        if "calculate" in message_lower or "formula" in message_lower:
            return Intent(category=IntentCategory.WRITE_FORMULA, confidence=0.8)
    elif context == AppContext.MAIL:
        return Intent(category=IntentCategory.COMPOSE_EMAIL, confidence=0.6)

    return Intent(category=IntentCategory.UNKNOWN, confidence=0.5)

def extract_entities(message: str) -> Dict[str, Any]:
    """Extract entities from message."""
    entities = {}

    # Date/time extraction
    date_patterns = [
        (r"tomorrow", "tomorrow"),
        (r"next (\w+)", "next_weekday"),
        (r"(\d{1,2})/(\d{1,2})", "date"),
        (r"at (\d{1,2}(?::\d{2})?\s*(?:am|pm)?)", "time"),
    ]

    for pattern, entity_type in date_patterns:
        match = re.search(pattern, message.lower())
        if match:
            entities[entity_type] = match.group(0)

    # Email extraction
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', message)
    if email_match:
        entities["email"] = email_match.group(0)

    # Person name extraction (simple heuristic)
    name_patterns = [
        r"(?:to|with|for|from)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
    ]
    for pattern in name_patterns:
        match = re.search(pattern, message)
        if match:
            entities["person"] = match.group(1)

    return entities

async def execute_action(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Execute an action based on intent."""
    action_handlers = {
        IntentCategory.CREATE_DOCUMENT: handle_create_document,
        IntentCategory.COMPOSE_EMAIL: handle_compose_email,
        IntentCategory.SCHEDULE_MEETING: handle_schedule_meeting,
        IntentCategory.CREATE_TASK: handle_create_task,
        IntentCategory.LIST_TASKS: handle_list_tasks,
        IntentCategory.SEARCH_FILES: handle_search_files,
        IntentCategory.ANALYZE_DATA: handle_analyze_data,
        IntentCategory.SUMMARIZE_DOCUMENT: handle_summarize,
    }

    handler = action_handlers.get(intent.category)
    if handler:
        return await handler(intent, user_id, context)

    return ActionResult(
        success=False,
        action=intent.category.value,
        error="Action not implemented yet",
    )

async def handle_create_document(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle document creation."""
    return ActionResult(
        success=True,
        action="create_document",
        result={
            "document_id": str(uuid.uuid4()),
            "title": "New Document",
            "url": "/docs/new",
        },
        follow_up_actions=["Open document", "Add title", "Start writing"],
    )

async def handle_compose_email(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle email composition."""
    recipient = intent.entities.get("email") or intent.entities.get("person")
    return ActionResult(
        success=True,
        action="compose_email",
        result={
            "draft_id": str(uuid.uuid4()),
            "to": recipient,
            "url": "/mail/compose",
        },
        follow_up_actions=["Add recipient", "Write subject", "Compose message"],
    )

async def handle_schedule_meeting(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle meeting scheduling."""
    return ActionResult(
        success=True,
        action="schedule_meeting",
        result={
            "event_id": str(uuid.uuid4()),
            "suggested_times": [
                "Tomorrow at 10:00 AM",
                "Tomorrow at 2:00 PM",
                "Day after at 11:00 AM",
            ],
            "url": "/calendar/new",
        },
        follow_up_actions=["Select time", "Add attendees", "Set agenda"],
    )

async def handle_create_task(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle task creation."""
    return ActionResult(
        success=True,
        action="create_task",
        result={
            "task_id": str(uuid.uuid4()),
            "url": "/tasks/new",
        },
        follow_up_actions=["Set due date", "Add to project", "Set priority"],
    )

async def handle_list_tasks(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle task listing."""
    return ActionResult(
        success=True,
        action="list_tasks",
        result={
            "tasks": [
                {"id": "1", "title": "Review proposal", "due": "Today"},
                {"id": "2", "title": "Team meeting", "due": "Tomorrow"},
                {"id": "3", "title": "Submit report", "due": "This week"},
            ],
            "total": 3,
        },
    )

async def handle_search_files(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle file search."""
    return ActionResult(
        success=True,
        action="search_files",
        result={
            "files": [
                {"name": "Q4 Report.docx", "type": "document", "modified": "Yesterday"},
                {"name": "Budget 2024.xlsx", "type": "spreadsheet", "modified": "Last week"},
            ],
            "total": 2,
        },
    )

async def handle_analyze_data(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle data analysis."""
    return ActionResult(
        success=True,
        action="analyze_data",
        result={
            "insights": [
                "Revenue increased by 15% compared to last quarter",
                "Top performing product: Product A",
                "Customer satisfaction: 4.5/5",
            ],
            "visualizations_suggested": ["Bar chart", "Trend line", "Pie chart"],
        },
    )

async def handle_summarize(intent: Intent, user_id: str, context: AppContext) -> ActionResult:
    """Handle document summarization."""
    return ActionResult(
        success=True,
        action="summarize",
        result={
            "summary": "This document discusses the key findings from Q4 2024, including revenue growth, market expansion, and strategic initiatives for the upcoming year.",
            "key_points": [
                "Revenue grew 15% YoY",
                "Expanded to 3 new markets",
                "Launched 2 new products",
            ],
        },
    )

def generate_response(intent: Intent, action_result: ActionResult, context: AppContext) -> str:
    """Generate a natural language response."""
    if not action_result.success:
        return f"I couldn't complete that action. {action_result.error}"

    response_templates = {
        IntentCategory.CREATE_DOCUMENT: "I've created a new document for you. Would you like me to help you get started?",
        IntentCategory.COMPOSE_EMAIL: "I've opened a new email draft. Who would you like to send it to?",
        IntentCategory.SCHEDULE_MEETING: "I found some available times for your meeting. When works best for you?",
        IntentCategory.CREATE_TASK: "I've added a new task. Would you like to set a due date or priority?",
        IntentCategory.LIST_TASKS: f"Here are your tasks. You have {action_result.result.get('total', 0)} items to review.",
        IntentCategory.SEARCH_FILES: f"I found {action_result.result.get('total', 0)} files matching your search.",
        IntentCategory.ANALYZE_DATA: "I've analyzed the data. Here are the key insights I found.",
        IntentCategory.SUMMARIZE_DOCUMENT: "Here's a summary of the document.",
    }

    return response_templates.get(intent.category, "Done! Is there anything else I can help you with?")

def get_suggestions(intent: Intent, context: AppContext, user_id: str) -> List[Suggestion]:
    """Generate contextual suggestions."""
    suggestions = []

    # Context-based suggestions
    if context == AppContext.DOCS:
        suggestions.append(Suggestion(
            type=SuggestionType.ACTION,
            title="Check grammar",
            description="Run a grammar and style check",
            action="check_grammar",
            context=context,
            priority=1,
        ))
    elif context == AppContext.SHEETS:
        suggestions.append(Suggestion(
            type=SuggestionType.ACTION,
            title="Create pivot table",
            description="Summarize your data with a pivot table",
            action="create_pivot",
            context=context,
            priority=1,
        ))
    elif context == AppContext.MAIL:
        suggestions.append(Suggestion(
            type=SuggestionType.ACTION,
            title="Check inbox",
            description="View unread emails",
            action="check_inbox",
            context=context,
            priority=1,
        ))

    return suggestions

# ============== Main Chat Endpoint ==============

@app.post("/chat", response_model=ChatResponse)
async def chat(user_id: str, request: ChatRequest):
    """Main chat endpoint for AI assistant."""
    # Get or create conversation
    if request.conversation_id:
        conversation = conversations_db.get(request.conversation_id)
        if not conversation:
            conversation = Conversation(
                id=request.conversation_id,
                user_id=user_id,
                context=request.context,
            )
            conversations_db[conversation.id] = conversation
    else:
        conversation = Conversation(
            user_id=user_id,
            context=request.context,
            active_document_id=request.active_document_id,
            active_app_state=request.app_state or {},
        )
        conversations_db[conversation.id] = conversation

    # Add user message
    user_message = Message(role=MessageRole.USER, content=request.message)
    conversation.messages.append(user_message)

    # Detect intent
    intent = detect_intent(request.message, request.context)

    # Execute action if confident enough
    actions_performed = []
    if intent.confidence >= 0.7 and intent.category != IntentCategory.UNKNOWN:
        action_result = await execute_action(intent, user_id, request.context)
        actions_performed.append(action_result)

    # Generate response
    response_text = generate_response(intent, actions_performed[0] if actions_performed else ActionResult(success=False, action=""), request.context)

    # Get suggestions
    suggestions = get_suggestions(intent, request.context, user_id)

    # Generate quick replies
    quick_replies = []
    if intent.category == IntentCategory.SCHEDULE_MEETING:
        quick_replies = ["Tomorrow at 10 AM", "Tomorrow at 2 PM", "Pick another time"]
    elif intent.category == IntentCategory.CREATE_TASK:
        quick_replies = ["High priority", "Set due date", "Add to project"]
    elif intent.category == IntentCategory.UNKNOWN:
        quick_replies = ["Help", "Show my tasks", "Check calendar"]

    # Add assistant message
    assistant_message = Message(role=MessageRole.ASSISTANT, content=response_text)
    conversation.messages.append(assistant_message)
    conversation.updated_at = datetime.utcnow()

    # Record command history
    history_entry = CommandHistory(
        user_id=user_id,
        command=request.message,
        intent=intent.category,
        success=len(actions_performed) > 0 and actions_performed[0].success,
        execution_time_ms=100,  # Would be actual timing
    )
    if user_id not in command_history_db:
        command_history_db[user_id] = []
    command_history_db[user_id].append(history_entry)

    return ChatResponse(
        message=response_text,
        conversation_id=conversation.id,
        intent=intent,
        actions_performed=actions_performed,
        suggestions=suggestions,
        quick_replies=quick_replies,
        requires_more_info=intent.category == IntentCategory.UNKNOWN,
        follow_up_questions=["What would you like to do next?"] if not quick_replies else [],
    )

# ============== Conversation Endpoints ==============

@app.get("/conversations", response_model=List[Conversation])
async def list_conversations(
    user_id: str,
    include_archived: bool = False,
    limit: int = Query(20, ge=1, le=100),
):
    """List user's conversations."""
    conversations = [c for c in conversations_db.values() if c.user_id == user_id]

    if not include_archived:
        conversations = [c for c in conversations if not c.is_archived]

    conversations.sort(key=lambda x: x.updated_at, reverse=True)
    return conversations[:limit]

@app.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation_details(conversation_id: str):
    """Get conversation details."""
    return get_conversation(conversation_id)

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    get_conversation(conversation_id)
    del conversations_db[conversation_id]
    return {"message": "Conversation deleted"}

@app.post("/conversations/{conversation_id}/archive")
async def archive_conversation(conversation_id: str):
    """Archive a conversation."""
    conversation = get_conversation(conversation_id)
    conversation.is_archived = True
    return {"message": "Conversation archived"}

# ============== Command Endpoints ==============

@app.post("/commands/execute", response_model=ActionResult)
async def execute_command(user_id: str, request: CommandRequest):
    """Execute a direct command."""
    intent = detect_intent(request.command, request.context)

    if request.parameters:
        intent.parameters.update(request.parameters)

    return await execute_action(intent, user_id, request.context)

@app.get("/commands/quick-actions", response_model=List[QuickAction])
async def get_quick_actions(context: AppContext = AppContext.GLOBAL):
    """Get available quick actions."""
    if context == AppContext.GLOBAL:
        return QUICK_ACTIONS

    context_filters = {
        AppContext.DOCS: ["documents", "ai", "general"],
        AppContext.SHEETS: ["spreadsheets", "ai", "general"],
        AppContext.MAIL: ["email", "ai", "general"],
        AppContext.CALENDAR: ["calendar", "ai", "general"],
        AppContext.TASKS: ["tasks", "ai", "general"],
    }

    allowed_categories = context_filters.get(context, ["general", "ai"])
    return [a for a in QUICK_ACTIONS if a.category in allowed_categories]

@app.get("/commands/history")
async def get_command_history(
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
):
    """Get command history."""
    history = command_history_db.get(user_id, [])
    return sorted(history, key=lambda x: x.timestamp, reverse=True)[:limit]

# ============== Suggestions Endpoints ==============

@app.get("/suggestions", response_model=List[Suggestion])
async def get_proactive_suggestions(
    user_id: str,
    context: AppContext = AppContext.GLOBAL,
    limit: int = Query(5, ge=1, le=10),
):
    """Get proactive suggestions based on user activity."""
    suggestions = []

    # Time-based suggestions
    now = datetime.utcnow()
    hour = now.hour

    if 8 <= hour < 10:
        suggestions.append(Suggestion(
            type=SuggestionType.RECOMMENDATION,
            title="Morning briefing",
            description="Review your calendar and tasks for today",
            action="morning_briefing",
            priority=1,
        ))

    if 16 <= hour < 18:
        suggestions.append(Suggestion(
            type=SuggestionType.RECOMMENDATION,
            title="End of day summary",
            description="Review what you accomplished today",
            action="daily_summary",
            priority=1,
        ))

    # Check for pending tasks
    suggestions.append(Suggestion(
        type=SuggestionType.ACTION,
        title="Review pending tasks",
        description="You have tasks due soon",
        action="list_tasks",
        priority=2,
    ))

    return suggestions[:limit]

@app.post("/suggestions/{suggestion_id}/dismiss")
async def dismiss_suggestion(suggestion_id: str, user_id: str):
    """Dismiss a suggestion."""
    return {"message": "Suggestion dismissed"}

# ============== Preferences Endpoints ==============

@app.get("/preferences/{user_id}", response_model=UserPreferences)
async def get_preferences(user_id: str):
    """Get user preferences."""
    if user_id not in preferences_db:
        preferences_db[user_id] = UserPreferences(user_id=user_id)
    return preferences_db[user_id]

@app.put("/preferences/{user_id}", response_model=UserPreferences)
async def update_preferences(
    user_id: str,
    preferred_language: Optional[str] = None,
    response_style: Optional[str] = None,
    proactive_suggestions: Optional[bool] = None,
    voice_enabled: Optional[bool] = None,
):
    """Update user preferences."""
    if user_id not in preferences_db:
        preferences_db[user_id] = UserPreferences(user_id=user_id)

    prefs = preferences_db[user_id]

    if preferred_language:
        prefs.preferred_language = preferred_language
    if response_style:
        prefs.response_style = response_style
    if proactive_suggestions is not None:
        prefs.proactive_suggestions = proactive_suggestions
    if voice_enabled is not None:
        prefs.voice_enabled = voice_enabled

    prefs.updated_at = datetime.utcnow()
    return prefs

# ============== Knowledge Base ==============

@app.post("/knowledge", response_model=KnowledgeEntry)
async def add_knowledge(
    category: str,
    title: str,
    content: str,
    keywords: List[str] = [],
    user_id: Optional[str] = None,
):
    """Add a knowledge entry."""
    entry = KnowledgeEntry(
        user_id=user_id,
        category=category,
        title=title,
        content=content,
        keywords=keywords,
    )
    knowledge_db[entry.id] = entry
    return entry

@app.get("/knowledge/search")
async def search_knowledge(
    query: str,
    category: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = Query(10, ge=1, le=50),
):
    """Search knowledge base."""
    entries = list(knowledge_db.values())

    if category:
        entries = [e for e in entries if e.category == category]

    # Filter by user (include global + user-specific)
    if user_id:
        entries = [e for e in entries if e.user_id is None or e.user_id == user_id]

    # Simple keyword search
    query_lower = query.lower()
    results = []
    for entry in entries:
        score = 0
        if query_lower in entry.title.lower():
            score += 2
        if query_lower in entry.content.lower():
            score += 1
        if any(query_lower in kw.lower() for kw in entry.keywords):
            score += 1.5
        if score > 0:
            results.append({"entry": entry, "score": score})

    results.sort(key=lambda x: x["score"], reverse=True)
    return [r["entry"] for r in results[:limit]]

# ============== Feedback ==============

@app.post("/feedback")
async def submit_feedback(
    user_id: str,
    conversation_id: str,
    message_id: str,
    feedback_type: FeedbackType,
    comment: Optional[str] = None,
):
    """Submit feedback on assistant response."""
    return {
        "message": "Thank you for your feedback!",
        "feedback_type": feedback_type,
    }

# ============== Voice ==============

@app.post("/voice/transcribe")
async def transcribe_voice(request: VoiceRequest):
    """Transcribe voice to text."""
    # In real implementation, use speech-to-text service
    return {
        "transcription": "This is a simulated transcription",
        "confidence": 0.95,
        "language": request.language,
    }

@app.post("/voice/speak")
async def text_to_speech(text: str, language: str = "en", voice: str = "default"):
    """Convert text to speech."""
    # In real implementation, use text-to-speech service
    return {
        "audio_url": "/audio/generated.mp3",
        "duration_seconds": len(text) / 15,  # Rough estimate
    }

# ============== WebSocket for Real-time ==============

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket for real-time assistant communication."""
    await websocket.accept()

    if user_id not in active_sessions:
        active_sessions[user_id] = set()
    active_sessions[user_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "chat":
                # Process chat message
                request = ChatRequest(
                    message=data.get("message", ""),
                    conversation_id=data.get("conversation_id"),
                    context=AppContext(data.get("context", "global")),
                )
                response = await chat(user_id, request)
                await websocket.send_json({
                    "type": "response",
                    "data": response.model_dump(),
                })

            elif data.get("type") == "typing":
                # User is typing - could trigger proactive suggestions
                pass

            elif data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        active_sessions[user_id].discard(websocket)

# ============== Cross-App Actions ==============

@app.post("/cross-app/search")
async def cross_app_search(
    user_id: str,
    query: str,
    apps: Optional[List[AppContext]] = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Search across all apps."""
    results = {
        "documents": [{"title": "Q4 Report", "type": "doc", "modified": "Yesterday"}],
        "emails": [{"subject": "Project Update", "from": "team@example.com"}],
        "tasks": [{"title": "Review report", "due": "Tomorrow"}],
        "files": [{"name": "presentation.pptx", "folder": "Work"}],
        "events": [{"title": "Team Meeting", "date": "Tomorrow 2pm"}],
    }

    if apps:
        app_map = {
            AppContext.DOCS: "documents",
            AppContext.MAIL: "emails",
            AppContext.TASKS: "tasks",
            AppContext.DRIVE: "files",
            AppContext.CALENDAR: "events",
        }
        results = {app_map.get(app, app.value): results.get(app_map.get(app, ""), [])
                   for app in apps if app_map.get(app) in results}

    return {
        "query": query,
        "results": results,
        "total": sum(len(v) for v in results.values()),
    }

@app.post("/cross-app/daily-briefing")
async def get_daily_briefing(user_id: str):
    """Get a daily briefing across all apps."""
    return {
        "date": datetime.utcnow().date().isoformat(),
        "calendar": {
            "events_today": 3,
            "next_event": {"title": "Team Standup", "time": "10:00 AM"},
        },
        "email": {
            "unread": 12,
            "important": 2,
        },
        "tasks": {
            "due_today": 4,
            "overdue": 1,
        },
        "summary": "You have 3 meetings today, 12 unread emails (2 important), and 4 tasks due.",
    }

# ============== Statistics ==============

@app.get("/stats/{user_id}")
async def get_assistant_stats(user_id: str):
    """Get assistant usage statistics."""
    history = command_history_db.get(user_id, [])

    return {
        "total_commands": len(history),
        "successful_commands": len([h for h in history if h.success]),
        "conversations": len([c for c in conversations_db.values() if c.user_id == user_id]),
        "most_used_intents": {},  # Would calculate from history
        "average_response_time_ms": 150,
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-assistant",
        "version": "1.0.0",
        "active_conversations": len(conversations_db),
        "active_sessions": sum(len(s) for s in active_sessions.values()),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8014)
