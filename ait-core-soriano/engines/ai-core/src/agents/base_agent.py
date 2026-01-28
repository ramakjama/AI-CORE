"""
Base Agent: Foundation for all AI agents in AI-Suite.

Provides common functionality:
- LLM orchestration
- RAG integration
- Conversation memory
- Tool execution
- Streaming responses
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import structlog

from ..orchestrator import LLMOrchestrator, TaskType, get_orchestrator
from ..rag import RAGRetriever, EmbeddingService

logger = structlog.get_logger(__name__)


class MessageRole(str, Enum):
    """Message roles in a conversation."""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


@dataclass
class Message:
    """A message in the conversation."""
    role: MessageRole
    content: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolCall:
    """A tool call made by the agent."""
    name: str
    arguments: Dict[str, Any]
    result: Optional[Any] = None


@dataclass
class AgentResponse:
    """Response from an agent."""
    content: str
    tool_calls: List[ToolCall] = field(default_factory=list)
    sources: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConversationMemory:
    """
    Manages conversation history with automatic summarization.
    """

    def __init__(self, max_messages: int = 50, max_tokens: int = 4000):
        self.messages: List[Message] = []
        self.max_messages = max_messages
        self.max_tokens = max_tokens
        self._summary: Optional[str] = None

    def add(self, role: MessageRole, content: str, **metadata):
        """Add a message to the conversation."""
        message = Message(role=role, content=content, metadata=metadata)
        self.messages.append(message)

        # Trim if too many messages
        if len(self.messages) > self.max_messages:
            self._summarize_old_messages()

    def get_history(self, limit: Optional[int] = None) -> List[Dict[str, str]]:
        """Get conversation history for LLM context."""
        messages = self.messages[-limit:] if limit else self.messages

        history = []

        # Add summary if exists
        if self._summary:
            history.append({
                "role": "system",
                "content": f"Previous conversation summary: {self._summary}"
            })

        for msg in messages:
            history.append({
                "role": msg.role.value,
                "content": msg.content
            })

        return history

    def _summarize_old_messages(self):
        """Summarize old messages to save context space."""
        # Keep recent messages, summarize old ones
        cutoff = len(self.messages) - (self.max_messages // 2)
        old_messages = self.messages[:cutoff]
        self.messages = self.messages[cutoff:]

        # Create summary (in practice, this would use the LLM)
        summary_parts = [f"[{m.role.value}]: {m.content[:100]}..." for m in old_messages[:10]]
        self._summary = f"Earlier in the conversation: {'; '.join(summary_parts)}"

    def clear(self):
        """Clear conversation history."""
        self.messages.clear()
        self._summary = None


class BaseAgent(ABC):
    """
    Base class for all AI agents.

    Agents are specialized assistants for specific domains
    (documents, spreadsheets, email, etc.)
    """

    # Agent metadata
    name: str = "base_agent"
    description: str = "Base agent"
    default_task_type: TaskType = TaskType.CHAT

    def __init__(
        self,
        orchestrator: Optional[LLMOrchestrator] = None,
        rag_retriever: Optional[RAGRetriever] = None,
        system_prompt: Optional[str] = None,
        tools: Optional[List[Dict]] = None,
    ):
        self.orchestrator = orchestrator
        self.rag = rag_retriever
        self.system_prompt = system_prompt or self._default_system_prompt()
        self.tools = tools or []
        self.memory = ConversationMemory()

    @abstractmethod
    def _default_system_prompt(self) -> str:
        """Return the default system prompt for this agent."""
        pass

    async def initialize(self):
        """Initialize the agent (load models, etc.)"""
        if self.orchestrator is None:
            self.orchestrator = await get_orchestrator()

    async def chat(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        use_rag: bool = True,
        stream: bool = False,
    ) -> AgentResponse:
        """
        Send a message to the agent and get a response.

        Args:
            message: User message
            context: Additional context (e.g., current document)
            use_rag: Whether to augment with retrieved documents
            stream: Whether to stream the response

        Returns:
            AgentResponse with content and metadata
        """
        await self.initialize()

        # Add user message to memory
        self.memory.add(MessageRole.USER, message)

        # Build context
        full_context = context or {}

        # Retrieve relevant documents if RAG enabled
        sources = []
        if use_rag and self.rag:
            rag_result = await self.rag.retrieve(
                query=message,
                namespace=self._get_rag_namespace(context),
                top_k=5
            )
            if rag_result.documents:
                full_context["retrieved_context"] = "\n\n".join([
                    f"[Source {i+1}]: {doc.content}"
                    for i, doc in enumerate(rag_result.documents)
                ])
                sources = [
                    {"id": doc.id, "content": doc.content[:200], "score": doc.score}
                    for doc in rag_result.documents
                ]

        # Generate response
        if stream:
            content = await self._stream_response(message, full_context)
        else:
            content = await self._generate_response(message, full_context)

        # Add assistant response to memory
        self.memory.add(MessageRole.ASSISTANT, content)

        return AgentResponse(
            content=content,
            sources=sources,
            metadata={
                "agent": self.name,
                "task_type": self.default_task_type.value,
                "rag_used": bool(sources),
            }
        )

    async def stream_chat(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        use_rag: bool = True,
    ) -> AsyncGenerator[str, None]:
        """
        Stream a response from the agent.

        Yields chunks of the response as they are generated.
        """
        await self.initialize()

        self.memory.add(MessageRole.USER, message)

        full_context = context or {}

        # RAG retrieval
        if use_rag and self.rag:
            rag_result = await self.rag.retrieve(
                query=message,
                namespace=self._get_rag_namespace(context),
                top_k=5
            )
            if rag_result.documents:
                full_context["retrieved_context"] = "\n\n".join([
                    f"[Source {i+1}]: {doc.content}"
                    for i, doc in enumerate(rag_result.documents)
                ])

        # Stream response
        full_response = ""
        async for chunk in self.orchestrator.stream(
            prompt=message,
            task_type=self.default_task_type,
            context=full_context,
            system_prompt=self.system_prompt,
        ):
            full_response += chunk
            yield chunk

        self.memory.add(MessageRole.ASSISTANT, full_response)

    async def _generate_response(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> str:
        """Generate a response using the orchestrator."""
        return await self.orchestrator.generate(
            prompt=message,
            task_type=self.default_task_type,
            context=context,
            system_prompt=self.system_prompt,
        )

    async def _stream_response(
        self,
        message: str,
        context: Dict[str, Any]
    ) -> str:
        """Stream and collect a response."""
        chunks = []
        async for chunk in self.orchestrator.stream(
            prompt=message,
            task_type=self.default_task_type,
            context=context,
            system_prompt=self.system_prompt,
        ):
            chunks.append(chunk)
        return "".join(chunks)

    def _get_rag_namespace(self, context: Optional[Dict[str, Any]]) -> str:
        """Get the RAG namespace based on context."""
        if context:
            if "user_id" in context:
                return f"user_{context['user_id']}"
            if "document_id" in context:
                return f"doc_{context['document_id']}"
        return "default"

    def clear_memory(self):
        """Clear conversation memory."""
        self.memory.clear()

    def get_conversation_history(self) -> List[Dict]:
        """Get the conversation history."""
        return self.memory.get_history()
