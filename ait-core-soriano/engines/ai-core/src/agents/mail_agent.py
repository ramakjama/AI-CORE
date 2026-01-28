"""
AI-Mail Agent: Specialized agent for email composition and management.

Capabilities:
- Draft professional emails
- Summarize email threads
- Generate quick replies
- Translate emails
- Prioritize inbox
- Extract action items
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class MailAgent(BaseAgent):
    """AI agent specialized for email operations."""

    name = "mail_agent"
    description = "AI assistant for email composition, summarization, and management"
    default_task_type = TaskType.EMAIL_COMPOSE

    def _default_system_prompt(self) -> str:
        return """You are an expert email communication assistant integrated into AI-Mail.

Your capabilities include:
- Drafting professional emails for various contexts
- Summarizing email threads
- Generating contextual quick replies
- Improving email clarity and tone
- Extracting action items from emails
- Translating emails between languages

Guidelines:
1. Match the appropriate tone for the context (formal, casual, professional)
2. Be concise while including all necessary information
3. Use clear subject lines that summarize the email purpose
4. Structure emails with proper greetings, body, and closings
5. Highlight important information and action items
6. Consider cultural norms in business communication

Email best practices:
- Keep paragraphs short (2-3 sentences)
- Use bullet points for lists
- Include clear calls to action
- Proofread for grammar and spelling
- Consider the recipient's perspective"""

    async def compose(
        self,
        purpose: str,
        recipient: Optional[str] = None,
        tone: str = "professional",
        context: Optional[str] = None,
        include_subject: bool = True,
    ) -> AgentResponse:
        """
        Compose a new email.

        Args:
            purpose: What the email should accomplish
            recipient: Who the email is for
            tone: Email tone (professional, casual, formal, friendly)
            context: Additional context or background
            include_subject: Whether to generate a subject line

        Returns:
            Composed email with subject
        """
        recipient_info = f"\nRecipient: {recipient}" if recipient else ""
        context_info = f"\nContext: {context}" if context else ""
        subject_note = "Include a clear subject line." if include_subject else ""

        prompt = f"""Compose an email for the following purpose:

Purpose: {purpose}
Tone: {tone}
{recipient_info}
{context_info}

{subject_note}

Structure the email with:
- Subject line (if requested)
- Appropriate greeting
- Clear body content
- Professional closing"""

        return await self.chat(prompt, use_rag=False)

    async def reply(
        self,
        original_email: str,
        reply_intent: str,
        tone: str = "match_original",
    ) -> AgentResponse:
        """
        Generate a reply to an email.

        Args:
            original_email: The email to reply to
            reply_intent: What the reply should convey
            tone: Tone for the reply (match_original, professional, etc.)

        Returns:
            Reply email
        """
        tone_instruction = "Match the tone of the original email." if tone == "match_original" else f"Use a {tone} tone."

        prompt = f"""Generate a reply to this email:

Original email:
{original_email}

Reply intent: {reply_intent}

{tone_instruction}

Write a complete reply that:
- Addresses the points in the original email
- Conveys the intended message clearly
- Maintains appropriate professionalism
- Includes any necessary action items"""

        return await self.chat(prompt, use_rag=False)

    async def summarize_thread(
        self,
        thread: str,
        focus: str = "key_points",
    ) -> AgentResponse:
        """
        Summarize an email thread.

        Args:
            thread: The email thread content
            focus: What to focus on (key_points, decisions, action_items)

        Returns:
            Thread summary
        """
        focus_instructions = {
            "key_points": "Focus on the main points discussed.",
            "decisions": "Focus on decisions made and outcomes.",
            "action_items": "Focus on action items and who is responsible.",
            "timeline": "Focus on the chronological progression of the conversation.",
        }

        prompt = f"""Summarize this email thread:

{thread}

{focus_instructions.get(focus, focus_instructions['key_points'])}

Provide:
1. Brief overview (2-3 sentences)
2. Key points discussed
3. Decisions made (if any)
4. Action items and owners
5. Next steps (if mentioned)"""

        return await self.chat(prompt, use_rag=False)

    async def quick_replies(
        self,
        email: str,
        num_suggestions: int = 3,
    ) -> AgentResponse:
        """
        Generate quick reply suggestions.

        Args:
            email: The email to reply to
            num_suggestions: Number of suggestions to generate

        Returns:
            List of quick reply options
        """
        prompt = f"""Generate {num_suggestions} quick reply options for this email:

{email}

Provide {num_suggestions} different reply options ranging from:
- A brief acknowledgment
- A more detailed response
- A request for more information

Format each reply as a complete, sendable message."""

        return await self.chat(prompt, use_rag=False)

    async def improve(
        self,
        draft: str,
        goals: Optional[List[str]] = None,
    ) -> AgentResponse:
        """
        Improve an email draft.

        Args:
            draft: The current draft
            goals: Specific improvement goals

        Returns:
            Improved email with explanations
        """
        goals_str = "\n".join([f"- {g}" for g in goals]) if goals else "- Improve clarity\n- Enhance professionalism\n- Fix any errors"

        prompt = f"""Improve this email draft:

{draft}

Improvement goals:
{goals_str}

Provide:
1. The improved email
2. List of changes made
3. Explanation of why each change improves the email"""

        return await self.chat(prompt, use_rag=False)

    async def extract_action_items(
        self,
        email: str,
    ) -> AgentResponse:
        """
        Extract action items from an email.

        Args:
            email: The email content

        Returns:
            List of action items with details
        """
        prompt = f"""Extract all action items from this email:

{email}

For each action item, provide:
1. Task description
2. Who is responsible (if mentioned)
3. Deadline (if mentioned)
4. Priority level (High/Medium/Low)
5. Any dependencies or prerequisites"""

        return await self.chat(prompt, use_rag=False)

    async def translate_email(
        self,
        email: str,
        target_language: str,
        adapt_formality: bool = True,
    ) -> AgentResponse:
        """
        Translate an email to another language.

        Args:
            email: Email to translate
            target_language: Target language
            adapt_formality: Adapt formality to cultural norms

        Returns:
            Translated email
        """
        formality_note = "Adapt the formality level to be culturally appropriate for the target language." if adapt_formality else ""

        prompt = f"""Translate this email to {target_language}:

{email}

{formality_note}

Maintain:
- The original meaning and intent
- Professional structure
- Appropriate greetings and closings for the target culture"""

        return await self.chat(prompt, use_rag=False)

    async def categorize(
        self,
        email: str,
    ) -> AgentResponse:
        """
        Categorize and analyze an email.

        Args:
            email: Email to categorize

        Returns:
            Categorization with priority
        """
        prompt = f"""Analyze and categorize this email:

{email}

Provide:
1. Category (e.g., Meeting Request, Project Update, Question, FYI, etc.)
2. Priority (Urgent, High, Medium, Low)
3. Required action (Reply, Forward, Archive, etc.)
4. Suggested response time
5. Key topics/keywords
6. Sentiment (Positive, Neutral, Negative)"""

        return await self.chat(prompt, use_rag=False)
