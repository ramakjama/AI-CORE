"""AI Agents module for AI-Suite applications."""

from .base_agent import BaseAgent, AgentResponse, Message, MessageRole, ConversationMemory
from .docs_agent import DocsAgent
from .sheets_agent import SheetsAgent
from .slides_agent import SlidesAgent
from .mail_agent import MailAgent
from .collab_agent import CollabAgent
from .code_agent import CodeAgent
from .analytics_agent import AnalyticsAgent
from .assistant_agent import AssistantAgent, AppContext, Command

__all__ = [
    # Base
    "BaseAgent",
    "AgentResponse",
    "Message",
    "MessageRole",
    "ConversationMemory",
    # Specialized Agents
    "DocsAgent",
    "SheetsAgent",
    "SlidesAgent",
    "MailAgent",
    "CollabAgent",
    "CodeAgent",
    "AnalyticsAgent",
    "AssistantAgent",
    # Types
    "AppContext",
    "Command",
]

# Agent registry for easy access
AGENTS = {
    "docs": DocsAgent,
    "sheets": SheetsAgent,
    "slides": SlidesAgent,
    "mail": MailAgent,
    "collab": CollabAgent,
    "code": CodeAgent,
    "analytics": AnalyticsAgent,
    "assistant": AssistantAgent,
}


def get_agent(agent_type: str) -> BaseAgent:
    """Get an agent instance by type."""
    if agent_type not in AGENTS:
        raise ValueError(f"Unknown agent type: {agent_type}. Available: {list(AGENTS.keys())}")
    return AGENTS[agent_type]()
