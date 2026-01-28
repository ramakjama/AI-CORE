"""
AI-Slides Agent: Specialized agent for presentation creation and design.

Capabilities:
- Generate presentation outlines
- Create slide content from topics
- Suggest design and layouts
- Generate speaker notes
- Improve existing presentations
- Create visual suggestions
"""

from typing import Dict, Any, Optional, List
from ..orchestrator import TaskType
from .base_agent import BaseAgent, AgentResponse


class SlidesAgent(BaseAgent):
    """AI agent specialized for presentation operations."""

    name = "slides_agent"
    description = "AI assistant for creating and improving presentations"
    default_task_type = TaskType.DOCUMENT_WRITING

    def _default_system_prompt(self) -> str:
        return """You are an expert presentation designer and content creator integrated into AI-Slides.

Your capabilities include:
- Creating presentation outlines and structures
- Writing compelling slide content
- Suggesting visual layouts and designs
- Generating speaker notes
- Improving existing presentation content
- Recommending images and visualizations

Guidelines:
1. Keep slide content concise - bullet points, not paragraphs
2. Follow the 6x6 rule: max 6 bullets, max 6 words per bullet
3. Create a clear narrative flow through the presentation
4. Balance text with visual elements
5. Include engaging openings and strong conclusions
6. Design for the audience and context

Slide structure best practices:
- Title slide with clear topic
- Agenda/outline for longer presentations
- One main idea per slide
- Visual hierarchy with headers
- Consistent styling throughout
- Clear call-to-action in closing"""

    async def create_outline(
        self,
        topic: str,
        duration_minutes: int = 15,
        audience: str = "general",
        purpose: str = "inform",
    ) -> AgentResponse:
        """
        Create a presentation outline.

        Args:
            topic: Presentation topic
            duration_minutes: Target duration
            audience: Target audience
            purpose: Presentation purpose (inform, persuade, train, etc.)

        Returns:
            Detailed outline
        """
        slides_estimate = max(5, duration_minutes // 2)

        prompt = f"""Create a presentation outline for:

Topic: {topic}
Duration: {duration_minutes} minutes (~{slides_estimate} slides)
Audience: {audience}
Purpose: {purpose}

Provide:
1. Title slide concept
2. Complete slide-by-slide outline
3. Key points for each slide
4. Suggested visuals/diagrams
5. Transition notes between sections
6. Estimated time per section"""

        return await self.chat(prompt, use_rag=True)

    async def generate_slides(
        self,
        outline: str,
        style: str = "professional",
        include_notes: bool = True,
    ) -> AgentResponse:
        """
        Generate slide content from an outline.

        Args:
            outline: The presentation outline
            style: Design style (professional, creative, minimal, etc.)
            include_notes: Whether to include speaker notes

        Returns:
            Complete slide content
        """
        notes_instruction = "Include detailed speaker notes for each slide." if include_notes else ""

        prompt = f"""Generate complete slide content based on this outline:

{outline}

Style: {style}

For each slide, provide:
1. Slide title
2. Bullet points (max 6)
3. Visual/image suggestion
4. Layout recommendation
{notes_instruction if include_notes else ''}

Keep content concise and impactful."""

        return await self.chat(prompt, use_rag=True)

    async def speaker_notes(
        self,
        slide_content: str,
        style: str = "conversational",
    ) -> AgentResponse:
        """
        Generate speaker notes for slides.

        Args:
            slide_content: The slide content
            style: Notes style (conversational, detailed, bullet_points)

        Returns:
            Speaker notes
        """
        style_instructions = {
            "conversational": "Write notes as if speaking naturally to the audience.",
            "detailed": "Include comprehensive talking points and data references.",
            "bullet_points": "Use concise bullet points as speaking prompts.",
        }

        prompt = f"""Generate speaker notes for these slides:

{slide_content}

Style: {style_instructions.get(style, style_instructions['conversational'])}

Include:
1. Key talking points
2. Transition phrases between slides
3. Audience engagement cues
4. Time markers for pacing
5. Q&A preparation points"""

        return await self.chat(prompt, use_rag=False)

    async def design_suggestions(
        self,
        content: str,
        brand_colors: Optional[List[str]] = None,
    ) -> AgentResponse:
        """
        Get design suggestions for a presentation.

        Args:
            content: Presentation content or topic
            brand_colors: Optional brand colors to incorporate

        Returns:
            Design recommendations
        """
        colors_note = f"\nBrand colors to incorporate: {', '.join(brand_colors)}" if brand_colors else ""

        prompt = f"""Suggest design elements for this presentation:

{content}
{colors_note}

Provide:
1. Color palette recommendation
2. Font pairing suggestions
3. Layout templates for different slide types
4. Icon/imagery style
5. Chart/graph styling
6. Animation and transition suggestions
7. Overall visual theme"""

        return await self.chat(prompt, use_rag=False)

    async def improve_slide(
        self,
        slide_content: str,
        feedback: Optional[str] = None,
    ) -> AgentResponse:
        """
        Improve existing slide content.

        Args:
            slide_content: Current slide content
            feedback: Optional specific feedback

        Returns:
            Improved slide content
        """
        feedback_note = f"\nSpecific feedback to address: {feedback}" if feedback else ""

        prompt = f"""Improve this slide content:

{slide_content}
{feedback_note}

Focus on:
1. Clarity and conciseness
2. Visual impact
3. Message effectiveness
4. Audience engagement

Provide:
- Improved content
- Layout suggestions
- Visual recommendations
- Explanation of changes"""

        return await self.chat(prompt, use_rag=False)

    async def generate_visuals(
        self,
        topic: str,
        slide_type: str = "content",
    ) -> AgentResponse:
        """
        Suggest visuals and diagrams for a slide.

        Args:
            topic: The slide topic
            slide_type: Type of slide (content, data, process, comparison)

        Returns:
            Visual suggestions with descriptions
        """
        prompt = f"""Suggest visuals for a {slide_type} slide about:

{topic}

Provide:
1. Primary visual recommendation (diagram type, image concept)
2. Alternative visual options
3. Text-to-visual balance suggestion
4. Detailed description for creating the visual
5. Stock image search terms (if applicable)
6. Icon suggestions"""

        return await self.chat(prompt, use_rag=False)

    async def create_from_document(
        self,
        document: str,
        max_slides: int = 10,
    ) -> AgentResponse:
        """
        Create a presentation from a document.

        Args:
            document: Document content to convert
            max_slides: Maximum number of slides

        Returns:
            Presentation based on document
        """
        prompt = f"""Convert this document into a {max_slides}-slide presentation:

{document}

Extract key points and create:
1. Title slide
2. Introduction/overview
3. Main content slides (key points from document)
4. Summary/conclusion
5. (Optional) Q&A slide

For each slide:
- Title
- Bullet points
- Visual suggestion
- Speaker note summary"""

        return await self.chat(prompt, use_rag=False)

    async def executive_summary(
        self,
        presentation: str,
    ) -> AgentResponse:
        """
        Create an executive summary slide.

        Args:
            presentation: Full presentation content

        Returns:
            Executive summary slide
        """
        prompt = f"""Create an executive summary slide for this presentation:

{presentation}

Include:
1. Key takeaways (3-5 points)
2. Main recommendation/conclusion
3. Critical data points
4. Call to action

Format for maximum impact in 60 seconds of viewing."""

        return await self.chat(prompt, use_rag=False)
