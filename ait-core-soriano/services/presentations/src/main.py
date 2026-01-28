"""
AI-Presentations Service: Intelligent presentation builder with AI-powered features.

Features:
- Slide creation and management
- Templates and themes
- AI-powered content generation
- Design suggestions
- Speaker notes
- Animations and transitions
- Export (PPTX, PDF, HTML)
- Real-time collaboration
- Presenter mode
"""

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime
from enum import Enum
import uuid
import asyncio

app = FastAPI(
    title="AI-Presentations Service",
    description="Intelligent presentation builder with AI capabilities",
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

class SlideLayout(str, Enum):
    TITLE = "title"
    TITLE_CONTENT = "title_content"
    TITLE_TWO_COLUMNS = "title_two_columns"
    TITLE_ONLY = "title_only"
    BLANK = "blank"
    SECTION_HEADER = "section_header"
    COMPARISON = "comparison"
    TITLE_BULLETS = "title_bullets"
    TITLE_IMAGE = "title_image"
    IMAGE_FULL = "image_full"
    QUOTE = "quote"
    BIG_NUMBER = "big_number"
    TIMELINE = "timeline"
    TEAM = "team"
    PRICING = "pricing"

class ElementType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    SHAPE = "shape"
    CHART = "chart"
    TABLE = "table"
    VIDEO = "video"
    AUDIO = "audio"
    ICON = "icon"
    CODE = "code"
    EMBED = "embed"
    EQUATION = "equation"

class AnimationType(str, Enum):
    FADE_IN = "fade_in"
    SLIDE_IN_LEFT = "slide_in_left"
    SLIDE_IN_RIGHT = "slide_in_right"
    SLIDE_IN_UP = "slide_in_up"
    SLIDE_IN_DOWN = "slide_in_down"
    ZOOM_IN = "zoom_in"
    BOUNCE = "bounce"
    TYPEWRITER = "typewriter"
    NONE = "none"

class TransitionType(str, Enum):
    NONE = "none"
    FADE = "fade"
    SLIDE_LEFT = "slide_left"
    SLIDE_RIGHT = "slide_right"
    SLIDE_UP = "slide_up"
    SLIDE_DOWN = "slide_down"
    ZOOM = "zoom"
    FLIP = "flip"
    CUBE = "cube"
    DISSOLVE = "dissolve"

class PresentationStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    DOUGHNUT = "doughnut"
    AREA = "area"
    SCATTER = "scatter"
    RADAR = "radar"
    FUNNEL = "funnel"

class ExportFormat(str, Enum):
    PPTX = "pptx"
    PDF = "pdf"
    HTML = "html"
    IMAGES = "images"
    VIDEO = "video"

# ============== Models ==============

class Position(BaseModel):
    x: float = 0  # Percentage 0-100
    y: float = 0
    width: float = 100
    height: float = 100
    rotation: float = 0
    z_index: int = 0

class TextStyle(BaseModel):
    font_family: str = "Inter"
    font_size: int = 16
    font_weight: str = "normal"  # normal, bold, light
    font_style: str = "normal"  # normal, italic
    color: str = "#000000"
    background_color: Optional[str] = None
    text_align: str = "left"  # left, center, right, justify
    line_height: float = 1.5
    letter_spacing: float = 0
    text_decoration: Optional[str] = None  # underline, line-through

class ShapeStyle(BaseModel):
    fill_color: str = "#ffffff"
    stroke_color: str = "#000000"
    stroke_width: int = 1
    opacity: float = 1.0
    border_radius: int = 0
    shadow: Optional[Dict[str, Any]] = None

class Animation(BaseModel):
    type: AnimationType = AnimationType.NONE
    duration_ms: int = 500
    delay_ms: int = 0
    trigger: str = "on_click"  # on_click, with_previous, after_previous

class SlideElement(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ElementType
    position: Position = Position()
    content: Any = None  # Text content, image URL, chart data, etc.
    text_style: Optional[TextStyle] = None
    shape_style: Optional[ShapeStyle] = None
    animation: Optional[Animation] = None
    alt_text: Optional[str] = None  # Accessibility
    link: Optional[str] = None
    locked: bool = False
    hidden: bool = False

class SpeakerNote(BaseModel):
    content: str = ""
    timing_seconds: Optional[int] = None

class Slide(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    presentation_id: str
    layout: SlideLayout = SlideLayout.TITLE_CONTENT
    elements: List[SlideElement] = []
    background_color: str = "#ffffff"
    background_image: Optional[str] = None
    background_gradient: Optional[Dict[str, Any]] = None
    transition: TransitionType = TransitionType.FADE
    transition_duration_ms: int = 500
    speaker_notes: SpeakerNote = SpeakerNote()
    order: int = 0
    is_hidden: bool = False
    duration_seconds: Optional[int] = None  # For auto-advance
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Theme(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    colors: Dict[str, str] = {
        "primary": "#1a73e8",
        "secondary": "#5f6368",
        "accent": "#ea4335",
        "background": "#ffffff",
        "text": "#202124",
        "heading": "#202124",
    }
    fonts: Dict[str, str] = {
        "heading": "Inter",
        "body": "Inter",
        "code": "Fira Code",
    }
    font_sizes: Dict[str, int] = {
        "title": 48,
        "subtitle": 24,
        "heading": 32,
        "body": 18,
        "caption": 14,
    }

class PresentationSettings(BaseModel):
    aspect_ratio: str = "16:9"  # 16:9, 4:3, 16:10
    default_transition: TransitionType = TransitionType.FADE
    auto_advance: bool = False
    auto_advance_seconds: int = 30
    loop: bool = False
    show_slide_numbers: bool = True
    show_progress_bar: bool = True

class PresentationCreate(BaseModel):
    title: str
    description: Optional[str] = None
    theme_id: Optional[str] = None
    template_id: Optional[str] = None
    settings: Optional[PresentationSettings] = None

class Presentation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    workspace_id: str
    owner_id: str
    title: str
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: PresentationStatus = PresentationStatus.DRAFT
    theme: Theme = Theme(name="Default")
    settings: PresentationSettings = PresentationSettings()
    slide_count: int = 0
    is_template: bool = False
    is_shared: bool = False
    share_url: Optional[str] = None
    view_count: int = 0
    version: int = 1
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # AI fields
    ai_generated: bool = False
    ai_suggestions: Optional[List[str]] = None

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    presentation_id: str
    slide_id: str
    user_id: str
    content: str
    position: Optional[Position] = None  # Position on slide
    is_resolved: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============== AI Models ==============

class AIGenerateRequest(BaseModel):
    topic: str
    audience: str = "general"
    slide_count: int = 10
    style: str = "professional"  # professional, creative, minimal, bold
    include_images: bool = True
    language: str = "en"

class AIContentRequest(BaseModel):
    slide_id: str
    content_type: str  # title, bullets, paragraph, conclusion
    context: Optional[str] = None
    tone: str = "professional"

class AIDesignSuggestion(BaseModel):
    slide_id: str
    suggestions: List[Dict[str, Any]]
    layout_alternatives: List[SlideLayout]
    color_recommendations: List[str]

class AIImageRequest(BaseModel):
    prompt: str
    style: str = "realistic"  # realistic, illustration, abstract
    aspect_ratio: str = "16:9"

# ============== Storage (in-memory for demo) ==============

presentations_db: Dict[str, Presentation] = {}
slides_db: Dict[str, Slide] = {}
themes_db: Dict[str, Theme] = {}
templates_db: Dict[str, Presentation] = {}
comments_db: Dict[str, Comment] = {}

# WebSocket connections for collaboration
active_connections: Dict[str, Set[WebSocket]] = {}

# ============== Helper Functions ==============

def get_presentation(presentation_id: str) -> Presentation:
    if presentation_id not in presentations_db:
        raise HTTPException(status_code=404, detail="Presentation not found")
    return presentations_db[presentation_id]

def get_slide(slide_id: str) -> Slide:
    if slide_id not in slides_db:
        raise HTTPException(status_code=404, detail="Slide not found")
    return slides_db[slide_id]

def update_presentation_stats(presentation_id: str):
    """Update slide count and thumbnail."""
    if presentation_id not in presentations_db:
        return

    presentation = presentations_db[presentation_id]
    slides = [s for s in slides_db.values()
              if s.presentation_id == presentation_id and not s.is_hidden]
    presentation.slide_count = len(slides)
    presentation.updated_at = datetime.utcnow()

async def broadcast_to_presentation(presentation_id: str, event_type: str, data: Dict):
    """Broadcast changes to all collaborators."""
    if presentation_id in active_connections:
        message = {"type": event_type, "data": data}
        for ws in active_connections[presentation_id]:
            try:
                await ws.send_json(message)
            except:
                pass

# Initialize default themes
default_themes = [
    Theme(id="light", name="Light", colors={"primary": "#1a73e8", "background": "#ffffff", "text": "#202124"}),
    Theme(id="dark", name="Dark", colors={"primary": "#8ab4f8", "background": "#202124", "text": "#ffffff"}),
    Theme(id="blue", name="Ocean Blue", colors={"primary": "#0077b6", "background": "#caf0f8", "text": "#03045e"}),
    Theme(id="green", name="Forest", colors={"primary": "#2d6a4f", "background": "#d8f3dc", "text": "#1b4332"}),
    Theme(id="purple", name="Royal", colors={"primary": "#7209b7", "background": "#f8edfc", "text": "#3a0ca3"}),
]
for theme in default_themes:
    themes_db[theme.id] = theme

# ============== Presentation Endpoints ==============

@app.post("/presentations", response_model=Presentation)
async def create_presentation(
    workspace_id: str,
    user_id: str,
    data: PresentationCreate,
):
    """Create a new presentation."""
    theme = themes_db.get(data.theme_id, default_themes[0])

    presentation = Presentation(
        workspace_id=workspace_id,
        owner_id=user_id,
        title=data.title,
        description=data.description,
        theme=theme,
        settings=data.settings or PresentationSettings(),
    )

    # If creating from template
    if data.template_id and data.template_id in templates_db:
        template = templates_db[data.template_id]
        template_slides = [s for s in slides_db.values() if s.presentation_id == template.id]

        for slide in template_slides:
            new_slide = slide.model_copy()
            new_slide.id = str(uuid.uuid4())
            new_slide.presentation_id = presentation.id
            new_slide.created_at = datetime.utcnow()
            slides_db[new_slide.id] = new_slide
    else:
        # Create default title slide
        title_slide = Slide(
            presentation_id=presentation.id,
            layout=SlideLayout.TITLE,
            elements=[
                SlideElement(
                    type=ElementType.TEXT,
                    position=Position(x=10, y=35, width=80, height=20),
                    content=data.title,
                    text_style=TextStyle(font_size=48, font_weight="bold", text_align="center"),
                ),
                SlideElement(
                    type=ElementType.TEXT,
                    position=Position(x=10, y=55, width=80, height=10),
                    content="Click to add subtitle",
                    text_style=TextStyle(font_size=24, color="#5f6368", text_align="center"),
                ),
            ],
            order=0,
        )
        slides_db[title_slide.id] = title_slide

    presentations_db[presentation.id] = presentation
    update_presentation_stats(presentation.id)

    if presentation.is_template:
        templates_db[presentation.id] = presentation

    return presentation

@app.get("/presentations", response_model=List[Presentation])
async def list_presentations(
    workspace_id: str,
    user_id: str,
    status: Optional[PresentationStatus] = None,
    include_templates: bool = False,
):
    """List presentations."""
    presentations = [p for p in presentations_db.values()
                     if p.workspace_id == workspace_id
                     and p.owner_id == user_id]

    if status:
        presentations = [p for p in presentations if p.status == status]

    if not include_templates:
        presentations = [p for p in presentations if not p.is_template]

    presentations.sort(key=lambda x: x.updated_at, reverse=True)
    return presentations

@app.get("/presentations/{presentation_id}", response_model=Presentation)
async def get_presentation_details(presentation_id: str):
    """Get presentation details."""
    presentation = get_presentation(presentation_id)
    presentation.view_count += 1
    return presentation

@app.put("/presentations/{presentation_id}", response_model=Presentation)
async def update_presentation(
    presentation_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    theme_id: Optional[str] = None,
    settings: Optional[PresentationSettings] = None,
):
    """Update presentation."""
    presentation = get_presentation(presentation_id)

    if title:
        presentation.title = title
    if description is not None:
        presentation.description = description
    if theme_id and theme_id in themes_db:
        presentation.theme = themes_db[theme_id]
    if settings:
        presentation.settings = settings

    presentation.updated_at = datetime.utcnow()
    presentation.version += 1

    await broadcast_to_presentation(presentation_id, "presentation_updated", presentation.model_dump())

    return presentation

@app.delete("/presentations/{presentation_id}")
async def delete_presentation(presentation_id: str):
    """Delete a presentation."""
    presentation = get_presentation(presentation_id)

    # Delete slides
    slides_to_delete = [s.id for s in slides_db.values() if s.presentation_id == presentation_id]
    for slide_id in slides_to_delete:
        del slides_db[slide_id]

    # Delete comments
    comments_to_delete = [c.id for c in comments_db.values() if c.presentation_id == presentation_id]
    for comment_id in comments_to_delete:
        del comments_db[comment_id]

    del presentations_db[presentation_id]

    if presentation_id in templates_db:
        del templates_db[presentation_id]

    return {"message": "Presentation deleted"}

@app.post("/presentations/{presentation_id}/duplicate", response_model=Presentation)
async def duplicate_presentation(presentation_id: str, user_id: str):
    """Duplicate a presentation."""
    original = get_presentation(presentation_id)

    new_presentation = original.model_copy()
    new_presentation.id = str(uuid.uuid4())
    new_presentation.title = f"{original.title} (Copy)"
    new_presentation.owner_id = user_id
    new_presentation.status = PresentationStatus.DRAFT
    new_presentation.view_count = 0
    new_presentation.is_shared = False
    new_presentation.share_url = None
    new_presentation.created_at = datetime.utcnow()
    new_presentation.updated_at = datetime.utcnow()

    presentations_db[new_presentation.id] = new_presentation

    # Duplicate slides
    original_slides = [s for s in slides_db.values() if s.presentation_id == presentation_id]
    for slide in original_slides:
        new_slide = slide.model_copy()
        new_slide.id = str(uuid.uuid4())
        new_slide.presentation_id = new_presentation.id
        new_slide.created_at = datetime.utcnow()
        slides_db[new_slide.id] = new_slide

    update_presentation_stats(new_presentation.id)

    return new_presentation

@app.post("/presentations/{presentation_id}/share")
async def share_presentation(presentation_id: str):
    """Generate a share link for the presentation."""
    presentation = get_presentation(presentation_id)
    presentation.is_shared = True
    presentation.share_url = f"/view/{presentation_id}/{str(uuid.uuid4())[:8]}"
    return {"share_url": presentation.share_url}

# ============== Slide Endpoints ==============

@app.post("/slides", response_model=Slide)
async def create_slide(
    presentation_id: str,
    layout: SlideLayout = SlideLayout.TITLE_CONTENT,
    after_slide_id: Optional[str] = None,
):
    """Create a new slide."""
    presentation = get_presentation(presentation_id)

    # Determine order
    existing_slides = [s for s in slides_db.values() if s.presentation_id == presentation_id]
    if after_slide_id:
        after_slide = slides_db.get(after_slide_id)
        order = (after_slide.order + 1) if after_slide else len(existing_slides)
        # Shift subsequent slides
        for s in existing_slides:
            if s.order >= order:
                s.order += 1
    else:
        order = len(existing_slides)

    # Create elements based on layout
    elements = []
    if layout == SlideLayout.TITLE_CONTENT:
        elements = [
            SlideElement(
                type=ElementType.TEXT,
                position=Position(x=5, y=5, width=90, height=15),
                content="Click to add title",
                text_style=TextStyle(font_size=36, font_weight="bold"),
            ),
            SlideElement(
                type=ElementType.TEXT,
                position=Position(x=5, y=25, width=90, height=70),
                content="Click to add content",
                text_style=TextStyle(font_size=18),
            ),
        ]
    elif layout == SlideLayout.TITLE:
        elements = [
            SlideElement(
                type=ElementType.TEXT,
                position=Position(x=10, y=35, width=80, height=20),
                content="Click to add title",
                text_style=TextStyle(font_size=48, font_weight="bold", text_align="center"),
            ),
        ]
    elif layout == SlideLayout.SECTION_HEADER:
        elements = [
            SlideElement(
                type=ElementType.TEXT,
                position=Position(x=10, y=40, width=80, height=15),
                content="Section Title",
                text_style=TextStyle(font_size=42, font_weight="bold", text_align="center"),
            ),
        ]

    slide = Slide(
        presentation_id=presentation_id,
        layout=layout,
        elements=elements,
        order=order,
        background_color=presentation.theme.colors.get("background", "#ffffff"),
    )
    slides_db[slide.id] = slide

    update_presentation_stats(presentation_id)

    await broadcast_to_presentation(presentation_id, "slide_created", slide.model_dump())

    return slide

@app.get("/presentations/{presentation_id}/slides", response_model=List[Slide])
async def list_slides(presentation_id: str, include_hidden: bool = False):
    """List slides in a presentation."""
    slides = [s for s in slides_db.values() if s.presentation_id == presentation_id]

    if not include_hidden:
        slides = [s for s in slides if not s.is_hidden]

    slides.sort(key=lambda x: x.order)
    return slides

@app.get("/slides/{slide_id}", response_model=Slide)
async def get_slide_details(slide_id: str):
    """Get slide details."""
    return get_slide(slide_id)

@app.put("/slides/{slide_id}", response_model=Slide)
async def update_slide(
    slide_id: str,
    layout: Optional[SlideLayout] = None,
    elements: Optional[List[SlideElement]] = None,
    background_color: Optional[str] = None,
    background_image: Optional[str] = None,
    transition: Optional[TransitionType] = None,
    speaker_notes: Optional[SpeakerNote] = None,
    is_hidden: Optional[bool] = None,
):
    """Update a slide."""
    slide = get_slide(slide_id)

    if layout:
        slide.layout = layout
    if elements is not None:
        slide.elements = elements
    if background_color:
        slide.background_color = background_color
    if background_image is not None:
        slide.background_image = background_image
    if transition:
        slide.transition = transition
    if speaker_notes:
        slide.speaker_notes = speaker_notes
    if is_hidden is not None:
        slide.is_hidden = is_hidden

    slide.updated_at = datetime.utcnow()

    update_presentation_stats(slide.presentation_id)
    await broadcast_to_presentation(slide.presentation_id, "slide_updated", slide.model_dump())

    return slide

@app.delete("/slides/{slide_id}")
async def delete_slide(slide_id: str):
    """Delete a slide."""
    slide = get_slide(slide_id)
    presentation_id = slide.presentation_id

    # Reorder remaining slides
    remaining = [s for s in slides_db.values()
                 if s.presentation_id == presentation_id and s.id != slide_id]
    remaining.sort(key=lambda x: x.order)
    for i, s in enumerate(remaining):
        s.order = i

    del slides_db[slide_id]

    update_presentation_stats(presentation_id)
    await broadcast_to_presentation(presentation_id, "slide_deleted", {"slide_id": slide_id})

    return {"message": "Slide deleted"}

@app.post("/slides/{slide_id}/duplicate", response_model=Slide)
async def duplicate_slide(slide_id: str):
    """Duplicate a slide."""
    original = get_slide(slide_id)

    new_slide = original.model_copy()
    new_slide.id = str(uuid.uuid4())
    new_slide.order = original.order + 1
    new_slide.created_at = datetime.utcnow()
    new_slide.updated_at = datetime.utcnow()

    # Shift subsequent slides
    for s in slides_db.values():
        if s.presentation_id == original.presentation_id and s.order >= new_slide.order:
            s.order += 1

    slides_db[new_slide.id] = new_slide
    update_presentation_stats(original.presentation_id)

    return new_slide

@app.post("/slides/reorder")
async def reorder_slides(presentation_id: str, slide_orders: Dict[str, int]):
    """Reorder slides."""
    get_presentation(presentation_id)

    for slide_id, order in slide_orders.items():
        if slide_id in slides_db:
            slides_db[slide_id].order = order

    await broadcast_to_presentation(presentation_id, "slides_reordered", slide_orders)

    return {"message": "Slides reordered"}

# ============== Element Endpoints ==============

@app.post("/slides/{slide_id}/elements", response_model=SlideElement)
async def add_element(
    slide_id: str,
    type: ElementType,
    position: Optional[Position] = None,
    content: Optional[Any] = None,
    text_style: Optional[TextStyle] = None,
    shape_style: Optional[ShapeStyle] = None,
):
    """Add an element to a slide."""
    slide = get_slide(slide_id)

    element = SlideElement(
        type=type,
        position=position or Position(x=20, y=20, width=60, height=60),
        content=content,
        text_style=text_style,
        shape_style=shape_style,
    )
    slide.elements.append(element)
    slide.updated_at = datetime.utcnow()

    await broadcast_to_presentation(slide.presentation_id, "element_added", {
        "slide_id": slide_id,
        "element": element.model_dump(),
    })

    return element

@app.put("/slides/{slide_id}/elements/{element_id}", response_model=SlideElement)
async def update_element(
    slide_id: str,
    element_id: str,
    position: Optional[Position] = None,
    content: Optional[Any] = None,
    text_style: Optional[TextStyle] = None,
    shape_style: Optional[ShapeStyle] = None,
    animation: Optional[Animation] = None,
):
    """Update an element."""
    slide = get_slide(slide_id)

    element = None
    for e in slide.elements:
        if e.id == element_id:
            element = e
            break

    if not element:
        raise HTTPException(status_code=404, detail="Element not found")

    if position:
        element.position = position
    if content is not None:
        element.content = content
    if text_style:
        element.text_style = text_style
    if shape_style:
        element.shape_style = shape_style
    if animation:
        element.animation = animation

    slide.updated_at = datetime.utcnow()

    await broadcast_to_presentation(slide.presentation_id, "element_updated", {
        "slide_id": slide_id,
        "element": element.model_dump(),
    })

    return element

@app.delete("/slides/{slide_id}/elements/{element_id}")
async def delete_element(slide_id: str, element_id: str):
    """Delete an element from a slide."""
    slide = get_slide(slide_id)

    slide.elements = [e for e in slide.elements if e.id != element_id]
    slide.updated_at = datetime.utcnow()

    await broadcast_to_presentation(slide.presentation_id, "element_deleted", {
        "slide_id": slide_id,
        "element_id": element_id,
    })

    return {"message": "Element deleted"}

# ============== Theme Endpoints ==============

@app.get("/themes", response_model=List[Theme])
async def list_themes():
    """List available themes."""
    return list(themes_db.values())

@app.post("/themes", response_model=Theme)
async def create_theme(
    name: str,
    colors: Dict[str, str],
    fonts: Optional[Dict[str, str]] = None,
):
    """Create a custom theme."""
    theme = Theme(
        name=name,
        colors=colors,
        fonts=fonts or {"heading": "Inter", "body": "Inter"},
    )
    themes_db[theme.id] = theme
    return theme

@app.post("/presentations/{presentation_id}/apply-theme")
async def apply_theme(presentation_id: str, theme_id: str):
    """Apply a theme to a presentation."""
    presentation = get_presentation(presentation_id)

    if theme_id not in themes_db:
        raise HTTPException(status_code=404, detail="Theme not found")

    presentation.theme = themes_db[theme_id]
    presentation.updated_at = datetime.utcnow()

    # Update slide backgrounds
    for slide in slides_db.values():
        if slide.presentation_id == presentation_id:
            slide.background_color = presentation.theme.colors.get("background", "#ffffff")

    return {"message": "Theme applied"}

# ============== Template Endpoints ==============

@app.get("/templates", response_model=List[Presentation])
async def list_templates(category: Optional[str] = None):
    """List available templates."""
    return list(templates_db.values())

@app.post("/presentations/{presentation_id}/save-as-template")
async def save_as_template(presentation_id: str, name: str, description: Optional[str] = None):
    """Save a presentation as a template."""
    original = get_presentation(presentation_id)

    template = original.model_copy()
    template.id = str(uuid.uuid4())
    template.title = name
    template.description = description
    template.is_template = True
    template.status = PresentationStatus.PUBLISHED
    template.created_at = datetime.utcnow()

    presentations_db[template.id] = template
    templates_db[template.id] = template

    # Copy slides
    original_slides = [s for s in slides_db.values() if s.presentation_id == presentation_id]
    for slide in original_slides:
        new_slide = slide.model_copy()
        new_slide.id = str(uuid.uuid4())
        new_slide.presentation_id = template.id
        slides_db[new_slide.id] = new_slide

    return template

# ============== Export Endpoints ==============

@app.post("/presentations/{presentation_id}/export")
async def export_presentation(presentation_id: str, format: ExportFormat):
    """Export presentation to various formats."""
    presentation = get_presentation(presentation_id)
    slides = [s for s in slides_db.values()
              if s.presentation_id == presentation_id and not s.is_hidden]
    slides.sort(key=lambda x: x.order)

    # In real implementation, generate actual export
    return {
        "presentation_id": presentation_id,
        "format": format,
        "slide_count": len(slides),
        "download_url": f"/exports/{presentation_id}.{format.value}",
        "expires_at": datetime.utcnow().isoformat(),
    }

# ============== Presenter Mode ==============

@app.get("/presentations/{presentation_id}/present")
async def get_presenter_view(presentation_id: str):
    """Get presenter view data."""
    presentation = get_presentation(presentation_id)
    slides = [s for s in slides_db.values()
              if s.presentation_id == presentation_id and not s.is_hidden]
    slides.sort(key=lambda x: x.order)

    return {
        "presentation": presentation,
        "slides": slides,
        "presenter_tools": {
            "timer": True,
            "notes": True,
            "pointer": True,
            "zoom": True,
            "blackout": True,
        },
    }

# ============== Comments ==============

@app.post("/comments", response_model=Comment)
async def add_comment(
    presentation_id: str,
    slide_id: str,
    user_id: str,
    content: str,
    position: Optional[Position] = None,
):
    """Add a comment to a slide."""
    get_presentation(presentation_id)
    get_slide(slide_id)

    comment = Comment(
        presentation_id=presentation_id,
        slide_id=slide_id,
        user_id=user_id,
        content=content,
        position=position,
    )
    comments_db[comment.id] = comment

    return comment

@app.get("/presentations/{presentation_id}/comments", response_model=List[Comment])
async def list_comments(presentation_id: str, slide_id: Optional[str] = None):
    """List comments."""
    comments = [c for c in comments_db.values() if c.presentation_id == presentation_id]

    if slide_id:
        comments = [c for c in comments if c.slide_id == slide_id]

    return comments

# ============== AI Features ==============

@app.post("/ai/generate-presentation", response_model=Presentation)
async def ai_generate_presentation(workspace_id: str, user_id: str, request: AIGenerateRequest):
    """AI-powered presentation generation."""
    # Create presentation
    presentation = Presentation(
        workspace_id=workspace_id,
        owner_id=user_id,
        title=f"Presentation: {request.topic}",
        description=f"AI-generated presentation about {request.topic}",
        ai_generated=True,
    )
    presentations_db[presentation.id] = presentation

    # Generate slides based on topic
    slide_templates = [
        (SlideLayout.TITLE, "Title", request.topic),
        (SlideLayout.TITLE_BULLETS, "Introduction", f"Overview of {request.topic}"),
        (SlideLayout.TITLE_CONTENT, "Key Points", "Main concepts and ideas"),
        (SlideLayout.TITLE_TWO_COLUMNS, "Comparison", "Pros and cons"),
        (SlideLayout.BIG_NUMBER, "Statistics", "Key metrics"),
        (SlideLayout.TITLE_CONTENT, "Details", "In-depth analysis"),
        (SlideLayout.QUOTE, "Expert Opinion", "Notable quote"),
        (SlideLayout.TIMELINE, "Timeline", "Historical progression"),
        (SlideLayout.TITLE_CONTENT, "Case Study", "Real-world example"),
        (SlideLayout.TITLE_CONTENT, "Conclusion", "Summary and next steps"),
    ]

    for i, (layout, title, content) in enumerate(slide_templates[:request.slide_count]):
        elements = [
            SlideElement(
                type=ElementType.TEXT,
                position=Position(x=5, y=5, width=90, height=15),
                content=title,
                text_style=TextStyle(font_size=36, font_weight="bold"),
            ),
            SlideElement(
                type=ElementType.TEXT,
                position=Position(x=5, y=25, width=90, height=70),
                content=f"AI-generated content about: {content}",
                text_style=TextStyle(font_size=18),
            ),
        ]

        slide = Slide(
            presentation_id=presentation.id,
            layout=layout,
            elements=elements,
            order=i,
        )
        slides_db[slide.id] = slide

    update_presentation_stats(presentation.id)

    return presentation

@app.post("/ai/generate-content")
async def ai_generate_content(request: AIContentRequest):
    """AI-powered content generation for slides."""
    slide = get_slide(request.slide_id)

    # In real implementation, use LLM
    content_templates = {
        "title": f"AI Generated Title for {request.context or 'your topic'}",
        "bullets": [
            "Key point one with supporting detail",
            "Key point two with evidence",
            "Key point three with example",
            "Key point four with conclusion",
        ],
        "paragraph": f"This is an AI-generated paragraph about {request.context}. It provides detailed information and insights on the topic at hand.",
        "conclusion": f"In summary, {request.context or 'this topic'} demonstrates the importance of understanding key concepts and their applications.",
    }

    return {
        "slide_id": request.slide_id,
        "content_type": request.content_type,
        "generated_content": content_templates.get(request.content_type, "Generated content"),
        "alternatives": ["Alternative 1", "Alternative 2"],
    }

@app.post("/ai/design-suggestions", response_model=AIDesignSuggestion)
async def ai_design_suggestions(slide_id: str):
    """AI-powered design suggestions for a slide."""
    slide = get_slide(slide_id)

    return AIDesignSuggestion(
        slide_id=slide_id,
        suggestions=[
            {"type": "layout", "suggestion": "Consider using a two-column layout for better readability"},
            {"type": "font", "suggestion": "Increase title font size for better visibility"},
            {"type": "spacing", "suggestion": "Add more whitespace between elements"},
            {"type": "visual", "suggestion": "Add an icon or image to support the content"},
        ],
        layout_alternatives=[SlideLayout.TITLE_TWO_COLUMNS, SlideLayout.TITLE_IMAGE],
        color_recommendations=["#1a73e8", "#34a853", "#ea4335"],
    )

@app.post("/ai/generate-image")
async def ai_generate_image(request: AIImageRequest):
    """AI-powered image generation for slides."""
    # In real implementation, call image generation API
    return {
        "prompt": request.prompt,
        "image_url": f"/generated-images/{str(uuid.uuid4())}.png",
        "style": request.style,
        "alternatives": [
            f"/generated-images/{str(uuid.uuid4())}.png",
            f"/generated-images/{str(uuid.uuid4())}.png",
        ],
    }

@app.post("/ai/improve-slide")
async def ai_improve_slide(slide_id: str):
    """AI-powered slide improvement."""
    slide = get_slide(slide_id)

    return {
        "slide_id": slide_id,
        "improvements": [
            {
                "element_id": slide.elements[0].id if slide.elements else None,
                "original": slide.elements[0].content if slide.elements else "",
                "improved": "Enhanced version of the content with better clarity",
                "reason": "Improved readability and impact",
            },
        ],
        "layout_suggestion": SlideLayout.TITLE_CONTENT,
        "visual_suggestions": ["Add supporting image", "Use bullet points"],
    }

@app.post("/ai/generate-speaker-notes")
async def ai_generate_speaker_notes(slide_id: str):
    """AI-powered speaker notes generation."""
    slide = get_slide(slide_id)

    # Extract content from slide
    content = " ".join([e.content for e in slide.elements if e.content and isinstance(e.content, str)])

    # In real implementation, use LLM
    notes = f"""Speaking points for this slide:

1. Start by introducing the main topic
2. Explain the key points shown on the slide
3. Provide additional context and examples
4. Transition to the next topic

Timing: Aim for 2-3 minutes on this slide
Tips: Make eye contact, pause for emphasis"""

    slide.speaker_notes = SpeakerNote(content=notes, timing_seconds=150)

    return {
        "slide_id": slide_id,
        "speaker_notes": notes,
        "suggested_timing_seconds": 150,
    }

# ============== WebSocket for Collaboration ==============

@app.websocket("/ws/{presentation_id}")
async def websocket_endpoint(websocket: WebSocket, presentation_id: str):
    """WebSocket for real-time collaboration."""
    await websocket.accept()

    if presentation_id not in active_connections:
        active_connections[presentation_id] = set()
    active_connections[presentation_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            # Broadcast to other connections
            for conn in active_connections[presentation_id]:
                if conn != websocket:
                    try:
                        await conn.send_json(data)
                    except:
                        pass

    except WebSocketDisconnect:
        active_connections[presentation_id].discard(websocket)

# ============== Statistics ==============

@app.get("/stats/{workspace_id}")
async def get_presentation_stats(workspace_id: str):
    """Get presentation statistics."""
    presentations = [p for p in presentations_db.values() if p.workspace_id == workspace_id]

    return {
        "total_presentations": len(presentations),
        "published": len([p for p in presentations if p.status == PresentationStatus.PUBLISHED]),
        "total_slides": sum(p.slide_count for p in presentations),
        "total_views": sum(p.view_count for p in presentations),
        "ai_generated": len([p for p in presentations if p.ai_generated]),
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-presentations",
        "version": "1.0.0",
        "presentations": len(presentations_db),
        "slides": len(slides_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8013)
