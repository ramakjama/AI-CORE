"""
AI-Assistant Agent: Omnipresent assistant across all AI-Suite applications.

Capabilities:
- Cross-application commands
- Context-aware help
- Workflow automation
- Natural language interface
- Multi-app orchestration
- Proactive suggestions
"""

from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from enum import Enum
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class AppContext(str, Enum):
    """Current application context."""
    DOCS = "docs"
    SHEETS = "sheets"
    SLIDES = "slides"
    MAIL = "mail"
    COLLAB = "collab"
    NOTES = "notes"
    CALENDAR = "calendar"
    DRIVE = "drive"
    FORMS = "forms"
    TASKS = "tasks"
    WHITEBOARD = "whiteboard"
    ANALYTICS = "analytics"
    CODE = "code"
    DATABASE = "database"
    CMS = "cms"
    WORKFLOW = "workflow"
    GLOBAL = "global"


@dataclass
class Command:
    """A parsed user command."""
    action: str
    target_app: Optional[AppContext]
    parameters: Dict[str, Any]
    confidence: float


class AssistantAgent(BaseAgent):
    """AI-Suite's omnipresent assistant agent."""

    name = "assistant_agent"
    description = "Omnipresent AI assistant for all AI-Suite applications"
    default_task_type = TaskType.CHAT

    def _default_system_prompt(self) -> str:
        return """You are the AI Assistant integrated across all AI-Suite applications.

You can help users with:
- All AI-Suite apps (Docs, Sheets, Slides, Mail, Collab, Notes, Calendar, Drive, Forms, Tasks, Whiteboard, Analytics, Code, Database, CMS, Workflow)
- Cross-application workflows and automation
- Finding information across apps
- General productivity assistance

Your superpowers:
1. Context awareness - you know which app the user is in
2. Cross-app actions - you can trigger actions in any app
3. Workflow automation - you can create multi-step automations
4. Unified search - you can find content across all apps
5. Proactive suggestions - you anticipate user needs

Communication style:
- Be helpful and concise
- Offer specific actions when possible
- Explain what you can do when unsure of intent
- Ask clarifying questions for ambiguous requests
- Provide shortcuts and tips proactively

Available commands:
- @docs: Document operations
- @sheets: Spreadsheet operations
- @slides: Presentation operations
- @mail: Email operations
- @calendar: Calendar operations
- @drive: File operations
- @search: Cross-app search
- @automate: Create workflows"""

    async def process_command(
        self,
        user_input: str,
        current_app: AppContext = AppContext.GLOBAL,
        current_context: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """
        Process a user command with context awareness.

        Args:
            user_input: User's natural language input
            current_app: Current application context
            current_context: Additional context (open document, selected text, etc.)

        Returns:
            Response with actions to execute
        """
        # Build context
        context = {
            "current_app": current_app.value,
            **(current_context or {})
        }

        # Parse the command
        command = await self._parse_command(user_input, current_app)

        # Determine if it's a cross-app command
        if command.target_app and command.target_app != current_app:
            return await self._handle_cross_app(command, context)

        # Handle in current app context
        return await self.chat(user_input, context=context, use_rag=True)

    async def _parse_command(
        self,
        user_input: str,
        current_app: AppContext,
    ) -> Command:
        """Parse user input into a structured command."""
        # Check for explicit app mentions
        app_keywords = {
            "@docs": AppContext.DOCS,
            "@sheets": AppContext.SHEETS,
            "@slides": AppContext.SLIDES,
            "@mail": AppContext.MAIL,
            "@calendar": AppContext.CALENDAR,
            "@drive": AppContext.DRIVE,
            "@collab": AppContext.COLLAB,
            "@notes": AppContext.NOTES,
            "@forms": AppContext.FORMS,
            "@tasks": AppContext.TASKS,
        }

        target_app = None
        for keyword, app in app_keywords.items():
            if keyword in user_input.lower():
                target_app = app
                break

        return Command(
            action=user_input,
            target_app=target_app,
            parameters={},
            confidence=0.9 if target_app else 0.7
        )

    async def _handle_cross_app(
        self,
        command: Command,
        context: Dict[str, Any],
    ) -> AgentResponse:
        """Handle commands that span multiple apps."""
        prompt = f"""Handle this cross-application request:

Command: {command.action}
Target app: {command.target_app.value if command.target_app else 'auto-detect'}
Current context: {context}

Provide:
1. Which app(s) need to be involved
2. Step-by-step actions to execute
3. Any data that needs to be transferred between apps
4. Expected outcome"""

        return await self.chat(prompt, context=context, use_rag=True)

    async def unified_search(
        self,
        query: str,
        apps: Optional[List[AppContext]] = None,
        limit: int = 10,
    ) -> AgentResponse:
        """
        Search across all or specified apps.

        Args:
            query: Search query
            apps: Apps to search (None = all)
            limit: Max results

        Returns:
            Search results from all apps
        """
        apps_str = ", ".join([a.value for a in apps]) if apps else "all applications"

        prompt = f"""Search for "{query}" across {apps_str}.

Return:
1. Relevant documents, emails, notes, etc.
2. Source application for each result
3. Relevance ranking
4. Quick actions available for each result"""

        context = {
            "search_scope": [a.value for a in apps] if apps else "all",
            "limit": limit
        }

        return await self.chat(prompt, context=context, use_rag=True)

    async def create_workflow(
        self,
        description: str,
        trigger: Optional[str] = None,
    ) -> AgentResponse:
        """
        Create an automation workflow.

        Args:
            description: What the workflow should do
            trigger: What triggers the workflow

        Returns:
            Workflow definition
        """
        trigger_note = f"Trigger: {trigger}" if trigger else "Manual trigger"

        prompt = f"""Create an automation workflow:

Description: {description}
{trigger_note}

Provide:
1. Workflow name and description
2. Trigger configuration
3. Step-by-step actions
4. Conditions and branches (if needed)
5. Error handling
6. Expected outcome

Format as a structured workflow definition."""

        return await self.chat(prompt, use_rag=True)

    async def suggest_actions(
        self,
        current_app: AppContext,
        current_context: Dict[str, Any],
    ) -> AgentResponse:
        """
        Suggest helpful actions based on context.

        Args:
            current_app: Current application
            current_context: Current state/context

        Returns:
            List of suggested actions
        """
        prompt = f"""Based on the current context, suggest helpful actions:

Current app: {current_app.value}
Context: {current_context}

Provide:
1. Immediate helpful actions (3-5)
2. Related content/documents
3. Workflow suggestions
4. Productivity tips"""

        return await self.chat(prompt, context=current_context, use_rag=True)

    async def explain_feature(
        self,
        feature: str,
        app: Optional[AppContext] = None,
    ) -> AgentResponse:
        """
        Explain how to use a feature.

        Args:
            feature: Feature to explain
            app: Specific app context

        Returns:
            Feature explanation with examples
        """
        app_context = f"in {app.value}" if app else "across AI-Suite"

        prompt = f"""Explain how to use this feature {app_context}:

Feature: {feature}

Provide:
1. What the feature does
2. Step-by-step usage guide
3. Practical examples
4. Tips and best practices
5. Related features"""

        return await self.chat(prompt, use_rag=True)

    async def quick_action(
        self,
        action: str,
        current_app: AppContext,
        selection: Optional[str] = None,
    ) -> AgentResponse:
        """
        Execute a quick action on selected content.

        Args:
            action: Action to perform (summarize, translate, format, etc.)
            current_app: Current app
            selection: Selected content

        Returns:
            Action result
        """
        selection_note = f"\nSelected content:\n{selection}" if selection else ""

        prompt = f"""Perform this quick action in {current_app.value}:

Action: {action}
{selection_note}

Execute the action and return the result."""

        context = {
            "current_app": current_app.value,
            "has_selection": bool(selection)
        }

        return await self.chat(prompt, context=context, use_rag=False)

    async def daily_briefing(
        self,
        user_preferences: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """
        Generate a daily briefing for the user.

        Args:
            user_preferences: User's briefing preferences

        Returns:
            Daily briefing
        """
        prefs_note = f"Preferences: {user_preferences}" if user_preferences else ""

        prompt = f"""Generate a daily briefing:

{prefs_note}

Include:
1. Calendar overview for today
2. Priority emails needing attention
3. Pending tasks and deadlines
4. Document activity (shared, commented)
5. Suggested focus areas
6. Quick wins for productivity"""

        return await self.chat(prompt, use_rag=True)
