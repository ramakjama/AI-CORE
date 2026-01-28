"""
AI-Collab Agent: Specialized agent for team collaboration and meetings.

Capabilities:
- Transcribe meetings in real-time
- Generate meeting summaries
- Extract action items
- Translate conversations
- Smart scheduling
- Team analytics
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class CollabAgent(BaseAgent):
    """AI agent specialized for collaboration and meetings."""

    name = "collab_agent"
    description = "AI assistant for team collaboration, meetings, and communication"
    default_task_type = TaskType.MEETING_SUMMARY

    def _default_system_prompt(self) -> str:
        return """You are an expert collaboration assistant integrated into AI-Collab.

Your capabilities include:
- Transcribing and summarizing meetings
- Extracting action items and decisions
- Facilitating team communication
- Providing meeting insights and analytics
- Translating conversations in real-time
- Scheduling assistance

Guidelines:
1. Be concise in summaries while capturing all key points
2. Clearly attribute action items to specific people
3. Identify decisions and their rationale
4. Note any unresolved questions or follow-ups needed
5. Maintain professional tone in all communications
6. Respect confidentiality of discussions"""

    async def summarize_meeting(
        self,
        transcript: str,
        participants: Optional[List[str]] = None,
        meeting_type: str = "general",
    ) -> AgentResponse:
        """
        Generate a comprehensive meeting summary.

        Args:
            transcript: Meeting transcript
            participants: List of participant names
            meeting_type: Type of meeting (standup, planning, review, etc.)

        Returns:
            Meeting summary with key points
        """
        participants_str = ", ".join(participants) if participants else "Unknown"

        prompt = f"""Summarize this {meeting_type} meeting:

Participants: {participants_str}

Transcript:
{transcript}

Provide:
1. Meeting Overview (2-3 sentences)
2. Key Discussion Points
3. Decisions Made
4. Action Items (with owners and deadlines if mentioned)
5. Unresolved Questions
6. Next Steps"""

        return await self.chat(prompt, use_rag=False)

    async def extract_action_items(
        self,
        transcript: str,
    ) -> AgentResponse:
        """
        Extract action items from a meeting.

        Args:
            transcript: Meeting transcript or notes

        Returns:
            List of action items
        """
        prompt = f"""Extract all action items from this meeting:

{transcript}

For each action item, provide:
1. Task description
2. Assigned to (if mentioned)
3. Due date (if mentioned)
4. Priority (High/Medium/Low)
5. Context/related discussion point"""

        return await self.chat(prompt, use_rag=False)

    async def generate_agenda(
        self,
        meeting_purpose: str,
        participants: List[str],
        duration_minutes: int = 60,
        previous_notes: Optional[str] = None,
    ) -> AgentResponse:
        """
        Generate a meeting agenda.

        Args:
            meeting_purpose: Purpose of the meeting
            participants: List of participants
            duration_minutes: Meeting duration
            previous_notes: Notes from previous meeting

        Returns:
            Structured meeting agenda
        """
        prev_notes = f"\nPrevious meeting notes:\n{previous_notes}" if previous_notes else ""

        prompt = f"""Create a meeting agenda:

Purpose: {meeting_purpose}
Participants: {', '.join(participants)}
Duration: {duration_minutes} minutes
{prev_notes}

Include:
1. Welcome and introductions (if needed)
2. Agenda items with time allocations
3. Discussion topics
4. Decision points
5. Action item review
6. Next steps and wrap-up"""

        return await self.chat(prompt, use_rag=True)

    async def facilitate_discussion(
        self,
        topic: str,
        context: Optional[str] = None,
    ) -> AgentResponse:
        """
        Provide facilitation guidance for a discussion.

        Args:
            topic: Discussion topic
            context: Additional context

        Returns:
            Facilitation suggestions
        """
        context_str = f"\nContext: {context}" if context else ""

        prompt = f"""Provide facilitation guidance for discussing:

Topic: {topic}
{context_str}

Include:
1. Key questions to ask
2. Points to cover
3. Potential challenges and how to address them
4. Ways to ensure all voices are heard
5. How to reach consensus or next steps"""

        return await self.chat(prompt, use_rag=True)

    async def translate_message(
        self,
        message: str,
        source_language: str,
        target_language: str,
    ) -> AgentResponse:
        """
        Translate a chat message.

        Args:
            message: Message to translate
            source_language: Source language
            target_language: Target language

        Returns:
            Translated message
        """
        prompt = f"""Translate this message from {source_language} to {target_language}:

{message}

Maintain the original tone and intent. If there are cultural nuances, adapt appropriately."""

        return await self.chat(prompt, use_rag=False)

    async def suggest_response(
        self,
        conversation: str,
        context: Optional[str] = None,
    ) -> AgentResponse:
        """
        Suggest a response in a conversation.

        Args:
            conversation: Recent conversation history
            context: Additional context

        Returns:
            Suggested responses
        """
        context_str = f"\nContext: {context}" if context else ""

        prompt = f"""Suggest 3 possible responses to this conversation:

{conversation}
{context_str}

Provide:
1. A brief, acknowledging response
2. A more detailed, helpful response
3. A response that moves the conversation forward"""

        return await self.chat(prompt, use_rag=False)
