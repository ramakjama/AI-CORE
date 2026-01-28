"""
AI-Docs Agent: Specialized agent for document writing and editing.

Capabilities:
- Generate document content from prompts
- Edit and improve existing text
- Summarize documents
- Translate text
- Format and structure documents
- Generate templates
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class DocsAgent(BaseAgent):
    """AI agent specialized for document operations."""

    name = "docs_agent"
    description = "AI assistant for document writing, editing, and analysis"
    default_task_type = TaskType.DOCUMENT_WRITING

    def _default_system_prompt(self) -> str:
        return """You are an expert document writer and editor integrated into AI-Docs.

Your capabilities include:
- Writing professional documents (reports, proposals, articles, etc.)
- Editing and improving existing text
- Summarizing long documents
- Translating between languages
- Formatting and structuring content
- Generating document templates

Guidelines:
1. Write clear, well-structured content appropriate for the context
2. Match the tone and style requested by the user
3. Use proper formatting (headings, lists, paragraphs) when appropriate
4. Provide concise summaries when asked
5. Preserve the original meaning when editing or translating
6. Ask clarifying questions if the request is ambiguous

When editing:
- Explain significant changes you make
- Preserve the author's voice while improving clarity
- Fix grammar, spelling, and punctuation errors
- Improve flow and readability

When generating content:
- Follow the specified format and length
- Include relevant sections and structure
- Use professional language appropriate for the audience"""

    async def write(
        self,
        prompt: str,
        document_type: str = "general",
        tone: str = "professional",
        length: str = "medium",
        language: str = "en",
    ) -> AgentResponse:
        """
        Generate document content.

        Args:
            prompt: What to write about
            document_type: Type of document (report, article, email, etc.)
            tone: Writing tone (professional, casual, formal, etc.)
            length: Approximate length (short, medium, long)
            language: Target language

        Returns:
            Generated document content
        """
        context = {
            "document_type": document_type,
            "tone": tone,
            "length": length,
            "language": language,
        }

        full_prompt = f"""Write a {document_type} with the following specifications:
- Tone: {tone}
- Length: {length}
- Language: {language}

Topic/Request: {prompt}

Please generate well-structured content following these specifications."""

        return await self.chat(full_prompt, context=context, use_rag=True)

    async def edit(
        self,
        text: str,
        instructions: str,
        preserve_length: bool = False,
    ) -> AgentResponse:
        """
        Edit existing text based on instructions.

        Args:
            text: Original text to edit
            instructions: What to change/improve
            preserve_length: Try to keep similar length

        Returns:
            Edited text with explanation
        """
        length_note = "Try to maintain a similar length." if preserve_length else ""

        context = {"original_text": text}

        prompt = f"""Edit the following text based on these instructions: {instructions}

{length_note}

Original text:
{text}

Please provide the edited version and briefly explain the key changes made."""

        return await self.chat(prompt, context=context, use_rag=False)

    async def summarize(
        self,
        text: str,
        style: str = "bullet_points",
        max_length: int = 500,
    ) -> AgentResponse:
        """
        Summarize a document.

        Args:
            text: Text to summarize
            style: Summary style (bullet_points, paragraph, executive)
            max_length: Maximum length in characters

        Returns:
            Summary of the document
        """
        style_instructions = {
            "bullet_points": "Format as concise bullet points highlighting key information.",
            "paragraph": "Write a flowing paragraph summary.",
            "executive": "Write an executive summary with key findings and recommendations.",
        }

        prompt = f"""Summarize the following text in approximately {max_length} characters.

Style: {style_instructions.get(style, style_instructions['paragraph'])}

Text to summarize:
{text}"""

        return await self.chat(prompt, use_rag=False)

    async def translate(
        self,
        text: str,
        target_language: str,
        preserve_formatting: bool = True,
    ) -> AgentResponse:
        """
        Translate text to another language.

        Args:
            text: Text to translate
            target_language: Target language (e.g., 'Spanish', 'French')
            preserve_formatting: Keep original formatting

        Returns:
            Translated text
        """
        formatting_note = "Preserve all original formatting, structure, and markdown." if preserve_formatting else ""

        prompt = f"""Translate the following text to {target_language}.

{formatting_note}

Maintain the original meaning, tone, and style as much as possible.

Text to translate:
{text}"""

        return await self.chat(prompt, use_rag=False)

    async def generate_template(
        self,
        template_type: str,
        context_info: Optional[str] = None,
    ) -> AgentResponse:
        """
        Generate a document template.

        Args:
            template_type: Type of template (contract, proposal, report, etc.)
            context_info: Additional context about the use case

        Returns:
            Document template with placeholders
        """
        context_note = f"Context: {context_info}" if context_info else ""

        prompt = f"""Generate a professional {template_type} template.

{context_note}

Include:
- Clear sections and structure
- Placeholder text in [BRACKETS] for customizable content
- Professional formatting
- Common sections for this type of document
- Instructions or notes for filling in the template"""

        return await self.chat(prompt, use_rag=True)

    async def improve_style(
        self,
        text: str,
        target_style: str = "professional",
    ) -> AgentResponse:
        """
        Improve the writing style of text.

        Args:
            text: Text to improve
            target_style: Desired style (professional, academic, casual, etc.)

        Returns:
            Style-improved text
        """
        prompt = f"""Improve the writing style of the following text to be more {target_style}.

Focus on:
- Clarity and readability
- Appropriate vocabulary
- Sentence structure and flow
- Professional tone
- Removing redundancy

Original text:
{text}

Provide the improved version."""

        return await self.chat(prompt, use_rag=False)

    async def outline(
        self,
        topic: str,
        document_type: str = "article",
        depth: int = 2,
    ) -> AgentResponse:
        """
        Generate a document outline.

        Args:
            topic: Topic to outline
            document_type: Type of document
            depth: Outline depth (1=main sections, 2=subsections, etc.)

        Returns:
            Structured outline
        """
        prompt = f"""Create a detailed outline for a {document_type} about: {topic}

Requirements:
- Include main sections and {'subsections' if depth > 1 else 'key points'}
- Each section should have a clear purpose
- Structure should flow logically
- Include brief notes about what each section should cover

Format as a hierarchical outline with numbered sections."""

        return await self.chat(prompt, use_rag=True)

    async def check_grammar(
        self,
        text: str,
        explain_corrections: bool = True,
    ) -> AgentResponse:
        """
        Check and correct grammar.

        Args:
            text: Text to check
            explain_corrections: Include explanations

        Returns:
            Corrected text with optional explanations
        """
        explanation_note = "Explain each correction made." if explain_corrections else ""

        prompt = f"""Check the following text for grammar, spelling, and punctuation errors.

{explanation_note}

Correct all errors while preserving the original meaning and style.

Text:
{text}

Provide the corrected version."""

        return await self.chat(prompt, use_rag=False)
