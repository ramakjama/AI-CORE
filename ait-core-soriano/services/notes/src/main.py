"""
AI-Notes Service: Intelligent note-taking with AI-powered features.

Features:
- Rich text notes with markdown
- Notebooks and sections organization
- Tags and categories
- AI-powered summarization
- Semantic search
- OCR for images
- Auto-linking between notes
- Templates
- Collaboration
"""

from fastapi import FastAPI, HTTPException, Depends, Query, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Set
from datetime import datetime, timedelta
from enum import Enum
import uuid
import asyncio
import re

app = FastAPI(
    title="AI-Notes Service",
    description="Intelligent note-taking with AI capabilities",
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

class NoteType(str, Enum):
    TEXT = "text"
    CHECKLIST = "checklist"
    MARKDOWN = "markdown"
    RICH_TEXT = "rich_text"
    CANVAS = "canvas"
    AUDIO = "audio"
    HANDWRITTEN = "handwritten"

class NoteColor(str, Enum):
    DEFAULT = "#ffffff"
    RED = "#f28b82"
    ORANGE = "#fbbc04"
    YELLOW = "#fff475"
    GREEN = "#ccff90"
    TEAL = "#a7ffeb"
    BLUE = "#cbf0f8"
    PURPLE = "#d7aefb"
    PINK = "#fdcfe8"
    BROWN = "#e6c9a8"
    GRAY = "#e8eaed"

class ContentBlockType(str, Enum):
    PARAGRAPH = "paragraph"
    HEADING1 = "heading1"
    HEADING2 = "heading2"
    HEADING3 = "heading3"
    BULLET_LIST = "bullet_list"
    NUMBERED_LIST = "numbered_list"
    CHECKLIST = "checklist"
    QUOTE = "quote"
    CODE = "code"
    DIVIDER = "divider"
    IMAGE = "image"
    FILE = "file"
    TABLE = "table"
    EMBED = "embed"
    CALLOUT = "callout"
    TOGGLE = "toggle"
    MATH = "math"

class SharePermission(str, Enum):
    VIEW = "view"
    COMMENT = "comment"
    EDIT = "edit"

# ============== Models ==============

class ContentBlock(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: ContentBlockType = ContentBlockType.PARAGRAPH
    content: str = ""
    checked: Optional[bool] = None  # For checklist items
    language: Optional[str] = None  # For code blocks
    url: Optional[str] = None  # For images, files, embeds
    children: Optional[List["ContentBlock"]] = None
    metadata: Dict[str, Any] = {}

class Attachment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content_type: str
    size: int
    url: str
    thumbnail_url: Optional[str] = None
    ocr_text: Optional[str] = None  # Extracted text from images
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NoteCreate(BaseModel):
    title: str = ""
    content: Optional[str] = None  # Plain text or markdown
    blocks: Optional[List[ContentBlock]] = None  # Structured content
    note_type: NoteType = NoteType.MARKDOWN
    notebook_id: Optional[str] = None
    section_id: Optional[str] = None
    tags: List[str] = []
    color: NoteColor = NoteColor.DEFAULT
    is_pinned: bool = False
    metadata: Dict[str, Any] = {}

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    blocks: Optional[List[ContentBlock]] = None
    tags: Optional[List[str]] = None
    color: Optional[NoteColor] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None
    notebook_id: Optional[str] = None
    section_id: Optional[str] = None

class Note(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str = ""
    content: Optional[str] = None
    blocks: List[ContentBlock] = []
    note_type: NoteType = NoteType.MARKDOWN
    notebook_id: Optional[str] = None
    section_id: Optional[str] = None
    tags: List[str] = []
    color: NoteColor = NoteColor.DEFAULT
    attachments: List[Attachment] = []
    is_pinned: bool = False
    is_archived: bool = False
    is_trashed: bool = False
    word_count: int = 0
    character_count: int = 0
    reading_time_minutes: int = 0
    # Links
    links_to: List[str] = []  # Note IDs this note links to
    linked_from: List[str] = []  # Note IDs that link to this note
    # Sharing
    is_shared: bool = False
    shared_with: List[Dict[str, Any]] = []
    public_link: Optional[str] = None
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_viewed_at: Optional[datetime] = None
    # AI fields
    ai_summary: Optional[str] = None
    ai_tags: Optional[List[str]] = None
    ai_entities: Optional[List[Dict[str, Any]]] = None
    embedding: Optional[List[float]] = None  # Vector embedding for search

class Notebook(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None  # Emoji or icon name
    color: NoteColor = NoteColor.DEFAULT
    is_default: bool = False
    note_count: int = 0
    sections: List["Section"] = []
    is_shared: bool = False
    shared_with: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Section(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    notebook_id: str
    name: str
    icon: Optional[str] = None
    order: int = 0
    note_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Tag(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    color: Optional[str] = None
    note_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Template(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: Optional[str] = None  # None for system templates
    name: str
    description: Optional[str] = None
    category: str = "general"
    content: str = ""
    blocks: List[ContentBlock] = []
    is_public: bool = False
    usage_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class NoteVersion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    note_id: str
    title: str
    content: Optional[str] = None
    blocks: List[ContentBlock] = []
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============== AI Models ==============

class AISummarizeRequest(BaseModel):
    note_ids: Optional[List[str]] = None
    max_length: int = 200

class AIExtractRequest(BaseModel):
    note_id: str
    extract_type: str = "all"  # tasks, dates, entities, keywords

class AISearchRequest(BaseModel):
    query: str
    search_type: str = "semantic"  # semantic, keyword, hybrid
    notebook_id: Optional[str] = None
    tags: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = 20

class AIWriteRequest(BaseModel):
    prompt: str
    context: Optional[str] = None
    style: str = "professional"  # professional, casual, academic
    length: str = "medium"

class AIOCRRequest(BaseModel):
    image_url: str
    language: str = "en"

class AILinkSuggestion(BaseModel):
    target_note_id: str
    target_note_title: str
    relevance_score: float
    context: str

# ============== Storage (in-memory for demo) ==============

notes_db: Dict[str, Note] = {}
notebooks_db: Dict[str, Notebook] = {}
sections_db: Dict[str, Section] = {}
tags_db: Dict[str, Tag] = {}
templates_db: Dict[str, Template] = {}
versions_db: Dict[str, List[NoteVersion]] = {}
attachments_db: Dict[str, Attachment] = {}

# WebSocket connections
active_connections: Dict[str, Set[WebSocket]] = {}

# ============== Helper Functions ==============

def get_note(note_id: str) -> Note:
    if note_id not in notes_db:
        raise HTTPException(status_code=404, detail="Note not found")
    return notes_db[note_id]

def get_notebook(notebook_id: str) -> Notebook:
    if notebook_id not in notebooks_db:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return notebooks_db[notebook_id]

def calculate_stats(content: str) -> Dict[str, int]:
    """Calculate word count, character count, and reading time."""
    if not content:
        return {"word_count": 0, "character_count": 0, "reading_time_minutes": 0}

    # Remove markdown syntax for accurate count
    clean_content = re.sub(r'[#*_\[\]()>`~]', '', content)
    words = clean_content.split()

    return {
        "word_count": len(words),
        "character_count": len(content),
        "reading_time_minutes": max(1, len(words) // 200),  # ~200 words per minute
    }

def extract_links(content: str) -> List[str]:
    """Extract note links from content (format: [[note-id]] or [[note-title]])."""
    pattern = r'\[\[([^\]]+)\]\]'
    matches = re.findall(pattern, content or "")
    return matches

def update_backlinks(note: Note):
    """Update backlinks for all linked notes."""
    for linked_id in note.links_to:
        if linked_id in notes_db:
            if note.id not in notes_db[linked_id].linked_from:
                notes_db[linked_id].linked_from.append(note.id)

async def notify_subscribers(note_id: str, event_type: str, data: Dict):
    """Notify WebSocket subscribers of note updates."""
    if note_id in active_connections:
        message = {"type": event_type, "data": data}
        for connection in active_connections[note_id]:
            try:
                await connection.send_json(message)
            except:
                pass

# ============== Notebook Endpoints ==============

@app.post("/notebooks", response_model=Notebook)
async def create_notebook(
    user_id: str,
    name: str,
    description: Optional[str] = None,
    icon: Optional[str] = None,
    color: NoteColor = NoteColor.DEFAULT,
):
    """Create a new notebook."""
    is_default = len([n for n in notebooks_db.values() if n.user_id == user_id]) == 0

    notebook = Notebook(
        user_id=user_id,
        name=name,
        description=description,
        icon=icon,
        color=color,
        is_default=is_default,
    )
    notebooks_db[notebook.id] = notebook
    return notebook

@app.get("/notebooks", response_model=List[Notebook])
async def list_notebooks(user_id: str, include_shared: bool = True):
    """List all notebooks for a user."""
    notebooks = [n for n in notebooks_db.values() if n.user_id == user_id]

    # Update note counts
    for notebook in notebooks:
        notebook.note_count = len([n for n in notes_db.values()
                                   if n.notebook_id == notebook.id and not n.is_trashed])

    return notebooks

@app.get("/notebooks/{notebook_id}", response_model=Notebook)
async def get_notebook_details(notebook_id: str):
    """Get notebook with sections."""
    notebook = get_notebook(notebook_id)
    notebook.sections = [s for s in sections_db.values() if s.notebook_id == notebook_id]
    return notebook

@app.put("/notebooks/{notebook_id}", response_model=Notebook)
async def update_notebook(
    notebook_id: str,
    name: Optional[str] = None,
    description: Optional[str] = None,
    icon: Optional[str] = None,
    color: Optional[NoteColor] = None,
):
    """Update notebook."""
    notebook = get_notebook(notebook_id)

    if name:
        notebook.name = name
    if description is not None:
        notebook.description = description
    if icon is not None:
        notebook.icon = icon
    if color:
        notebook.color = color

    notebook.updated_at = datetime.utcnow()
    return notebook

@app.delete("/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str, move_notes_to: Optional[str] = None):
    """Delete a notebook."""
    notebook = get_notebook(notebook_id)

    if notebook.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default notebook")

    # Move or delete notes
    for note in notes_db.values():
        if note.notebook_id == notebook_id:
            if move_notes_to:
                note.notebook_id = move_notes_to
            else:
                note.is_trashed = True

    # Delete sections
    sections_to_delete = [s.id for s in sections_db.values() if s.notebook_id == notebook_id]
    for section_id in sections_to_delete:
        del sections_db[section_id]

    del notebooks_db[notebook_id]
    return {"message": "Notebook deleted"}

# ============== Section Endpoints ==============

@app.post("/sections", response_model=Section)
async def create_section(
    notebook_id: str,
    name: str,
    icon: Optional[str] = None,
):
    """Create a new section in a notebook."""
    notebook = get_notebook(notebook_id)

    existing_sections = [s for s in sections_db.values() if s.notebook_id == notebook_id]
    order = len(existing_sections)

    section = Section(
        notebook_id=notebook_id,
        name=name,
        icon=icon,
        order=order,
    )
    sections_db[section.id] = section
    return section

@app.get("/sections", response_model=List[Section])
async def list_sections(notebook_id: str):
    """List all sections in a notebook."""
    sections = [s for s in sections_db.values() if s.notebook_id == notebook_id]
    sections.sort(key=lambda x: x.order)
    return sections

@app.delete("/sections/{section_id}")
async def delete_section(section_id: str):
    """Delete a section."""
    if section_id not in sections_db:
        raise HTTPException(status_code=404, detail="Section not found")

    # Move notes out of section
    for note in notes_db.values():
        if note.section_id == section_id:
            note.section_id = None

    del sections_db[section_id]
    return {"message": "Section deleted"}

# ============== Note Endpoints ==============

@app.post("/notes", response_model=Note)
async def create_note(user_id: str, note_data: NoteCreate):
    """Create a new note."""
    # Calculate stats
    stats = calculate_stats(note_data.content)

    note = Note(
        user_id=user_id,
        title=note_data.title,
        content=note_data.content,
        blocks=note_data.blocks or [],
        note_type=note_data.note_type,
        notebook_id=note_data.notebook_id,
        section_id=note_data.section_id,
        tags=note_data.tags,
        color=note_data.color,
        is_pinned=note_data.is_pinned,
        word_count=stats["word_count"],
        character_count=stats["character_count"],
        reading_time_minutes=stats["reading_time_minutes"],
    )

    # Extract and update links
    note.links_to = extract_links(note.content)
    update_backlinks(note)

    # Update tag counts
    for tag_name in note.tags:
        for tag in tags_db.values():
            if tag.user_id == user_id and tag.name == tag_name:
                tag.note_count += 1
                break
        else:
            # Create new tag
            new_tag = Tag(user_id=user_id, name=tag_name, note_count=1)
            tags_db[new_tag.id] = new_tag

    notes_db[note.id] = note
    return note

@app.get("/notes", response_model=List[Note])
async def list_notes(
    user_id: str,
    notebook_id: Optional[str] = None,
    section_id: Optional[str] = None,
    tag: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    is_archived: Optional[bool] = None,
    is_trashed: Optional[bool] = False,
    search: Optional[str] = None,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
):
    """List notes with filtering and sorting."""
    notes = [n for n in notes_db.values() if n.user_id == user_id]

    # Apply filters
    if notebook_id:
        notes = [n for n in notes if n.notebook_id == notebook_id]
    if section_id:
        notes = [n for n in notes if n.section_id == section_id]
    if tag:
        notes = [n for n in notes if tag in n.tags]
    if is_pinned is not None:
        notes = [n for n in notes if n.is_pinned == is_pinned]
    if is_archived is not None:
        notes = [n for n in notes if n.is_archived == is_archived]
    if is_trashed is not None:
        notes = [n for n in notes if n.is_trashed == is_trashed]
    if search:
        search_lower = search.lower()
        notes = [n for n in notes if
                 search_lower in n.title.lower() or
                 search_lower in (n.content or "").lower()]

    # Sort
    reverse = sort_order == "desc"
    if sort_by == "updated_at":
        notes.sort(key=lambda x: x.updated_at, reverse=reverse)
    elif sort_by == "created_at":
        notes.sort(key=lambda x: x.created_at, reverse=reverse)
    elif sort_by == "title":
        notes.sort(key=lambda x: x.title.lower(), reverse=reverse)

    # Pinned notes first
    pinned = [n for n in notes if n.is_pinned]
    unpinned = [n for n in notes if not n.is_pinned]
    notes = pinned + unpinned

    # Paginate
    start = (page - 1) * page_size
    end = start + page_size

    return notes[start:end]

@app.get("/notes/{note_id}", response_model=Note)
async def get_note_details(note_id: str):
    """Get note details."""
    note = get_note(note_id)
    note.last_viewed_at = datetime.utcnow()
    return note

@app.put("/notes/{note_id}", response_model=Note)
async def update_note(note_id: str, update: NoteUpdate):
    """Update a note."""
    note = get_note(note_id)

    # Save version before update
    version = NoteVersion(
        note_id=note_id,
        title=note.title,
        content=note.content,
        blocks=note.blocks,
        created_by=note.user_id,
    )
    if note_id not in versions_db:
        versions_db[note_id] = []
    versions_db[note_id].append(version)

    # Apply updates
    if update.title is not None:
        note.title = update.title
    if update.content is not None:
        note.content = update.content
        stats = calculate_stats(note.content)
        note.word_count = stats["word_count"]
        note.character_count = stats["character_count"]
        note.reading_time_minutes = stats["reading_time_minutes"]
        # Update links
        note.links_to = extract_links(note.content)
        update_backlinks(note)
    if update.blocks is not None:
        note.blocks = update.blocks
    if update.tags is not None:
        note.tags = update.tags
    if update.color is not None:
        note.color = update.color
    if update.is_pinned is not None:
        note.is_pinned = update.is_pinned
    if update.is_archived is not None:
        note.is_archived = update.is_archived
    if update.notebook_id is not None:
        note.notebook_id = update.notebook_id
    if update.section_id is not None:
        note.section_id = update.section_id

    note.updated_at = datetime.utcnow()

    # Notify subscribers
    await notify_subscribers(note_id, "note_updated", {"note_id": note_id})

    return note

@app.delete("/notes/{note_id}")
async def delete_note(note_id: str, permanent: bool = False):
    """Move note to trash or delete permanently."""
    note = get_note(note_id)

    if permanent:
        # Update backlinks
        for linked_id in note.links_to:
            if linked_id in notes_db:
                notes_db[linked_id].linked_from = [
                    id for id in notes_db[linked_id].linked_from if id != note_id
                ]

        del notes_db[note_id]
        return {"message": "Note permanently deleted"}
    else:
        note.is_trashed = True
        note.updated_at = datetime.utcnow()
        return {"message": "Note moved to trash"}

@app.post("/notes/{note_id}/restore")
async def restore_note(note_id: str):
    """Restore a note from trash."""
    note = get_note(note_id)
    note.is_trashed = False
    note.updated_at = datetime.utcnow()
    return {"message": "Note restored"}

@app.post("/notes/{note_id}/duplicate", response_model=Note)
async def duplicate_note(note_id: str):
    """Duplicate a note."""
    original = get_note(note_id)

    new_note = original.model_copy()
    new_note.id = str(uuid.uuid4())
    new_note.title = f"{original.title} (Copy)"
    new_note.created_at = datetime.utcnow()
    new_note.updated_at = datetime.utcnow()
    new_note.is_shared = False
    new_note.shared_with = []
    new_note.public_link = None

    notes_db[new_note.id] = new_note
    return new_note

@app.get("/notes/{note_id}/versions", response_model=List[NoteVersion])
async def get_note_versions(note_id: str):
    """Get version history of a note."""
    get_note(note_id)  # Verify note exists
    return versions_db.get(note_id, [])

@app.post("/notes/{note_id}/restore-version")
async def restore_note_version(note_id: str, version_id: str):
    """Restore a note to a previous version."""
    note = get_note(note_id)
    versions = versions_db.get(note_id, [])

    version = None
    for v in versions:
        if v.id == version_id:
            version = v
            break

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Save current as new version
    current_version = NoteVersion(
        note_id=note_id,
        title=note.title,
        content=note.content,
        blocks=note.blocks,
        created_by=note.user_id,
    )
    versions_db[note_id].append(current_version)

    # Restore
    note.title = version.title
    note.content = version.content
    note.blocks = version.blocks
    note.updated_at = datetime.utcnow()

    return {"message": "Version restored"}

# ============== Tag Endpoints ==============

@app.get("/tags", response_model=List[Tag])
async def list_tags(user_id: str):
    """List all tags for a user."""
    tags = [t for t in tags_db.values() if t.user_id == user_id]
    tags.sort(key=lambda x: x.note_count, reverse=True)
    return tags

@app.put("/tags/{tag_id}")
async def rename_tag(tag_id: str, new_name: str):
    """Rename a tag."""
    if tag_id not in tags_db:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag = tags_db[tag_id]
    old_name = tag.name

    # Update all notes with this tag
    for note in notes_db.values():
        if old_name in note.tags:
            note.tags = [new_name if t == old_name else t for t in note.tags]

    tag.name = new_name
    return {"message": "Tag renamed"}

@app.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str):
    """Delete a tag."""
    if tag_id not in tags_db:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag = tags_db[tag_id]

    # Remove from all notes
    for note in notes_db.values():
        if tag.name in note.tags:
            note.tags.remove(tag.name)

    del tags_db[tag_id]
    return {"message": "Tag deleted"}

# ============== Template Endpoints ==============

@app.post("/templates", response_model=Template)
async def create_template(
    user_id: str,
    name: str,
    description: Optional[str] = None,
    category: str = "general",
    content: str = "",
    blocks: List[ContentBlock] = [],
    is_public: bool = False,
):
    """Create a note template."""
    template = Template(
        user_id=user_id,
        name=name,
        description=description,
        category=category,
        content=content,
        blocks=blocks,
        is_public=is_public,
    )
    templates_db[template.id] = template
    return template

@app.get("/templates", response_model=List[Template])
async def list_templates(
    user_id: Optional[str] = None,
    category: Optional[str] = None,
    include_public: bool = True,
):
    """List available templates."""
    templates = []

    for t in templates_db.values():
        if t.user_id == user_id:
            templates.append(t)
        elif include_public and t.is_public:
            templates.append(t)
        elif t.user_id is None:  # System templates
            templates.append(t)

    if category:
        templates = [t for t in templates if t.category == category]

    return templates

@app.post("/templates/{template_id}/use", response_model=Note)
async def use_template(template_id: str, user_id: str, notebook_id: Optional[str] = None):
    """Create a new note from a template."""
    if template_id not in templates_db:
        raise HTTPException(status_code=404, detail="Template not found")

    template = templates_db[template_id]
    template.usage_count += 1

    note = Note(
        user_id=user_id,
        title=f"New {template.name}",
        content=template.content,
        blocks=template.blocks,
        notebook_id=notebook_id,
    )
    notes_db[note.id] = note
    return note

# ============== Attachment Endpoints ==============

@app.post("/notes/{note_id}/attachments")
async def upload_attachment(note_id: str, file: UploadFile = File(...)):
    """Upload an attachment to a note."""
    note = get_note(note_id)
    content = await file.read()

    attachment = Attachment(
        filename=file.filename,
        content_type=file.content_type,
        size=len(content),
        url=f"/attachments/{str(uuid.uuid4())}/{file.filename}",
    )

    # OCR for images
    if file.content_type and file.content_type.startswith("image/"):
        # In real implementation, perform OCR
        attachment.ocr_text = "[OCR extracted text would appear here]"

    attachments_db[attachment.id] = attachment
    note.attachments.append(attachment)
    note.updated_at = datetime.utcnow()

    return attachment

@app.get("/notes/{note_id}/attachments", response_model=List[Attachment])
async def list_attachments(note_id: str):
    """List all attachments of a note."""
    note = get_note(note_id)
    return note.attachments

# ============== Sharing Endpoints ==============

@app.post("/notes/{note_id}/share")
async def share_note(
    note_id: str,
    email: str,
    permission: SharePermission = SharePermission.VIEW,
):
    """Share a note with another user."""
    note = get_note(note_id)

    share_info = {
        "email": email,
        "permission": permission,
        "shared_at": datetime.utcnow().isoformat(),
    }

    note.shared_with.append(share_info)
    note.is_shared = True

    return {"message": f"Note shared with {email}"}

@app.post("/notes/{note_id}/public-link")
async def create_public_link(note_id: str):
    """Create a public link for a note."""
    note = get_note(note_id)

    link_id = str(uuid.uuid4())[:8]
    note.public_link = f"/public/notes/{link_id}"
    note.is_shared = True

    return {"public_link": note.public_link}

@app.delete("/notes/{note_id}/public-link")
async def remove_public_link(note_id: str):
    """Remove public link from a note."""
    note = get_note(note_id)
    note.public_link = None
    return {"message": "Public link removed"}

# ============== AI Features ==============

@app.post("/ai/summarize")
async def ai_summarize(user_id: str, request: AISummarizeRequest):
    """AI-powered note summarization."""
    notes_to_summarize = []

    if request.note_ids:
        for note_id in request.note_ids:
            if note_id in notes_db:
                notes_to_summarize.append(notes_db[note_id])

    if not notes_to_summarize:
        raise HTTPException(status_code=400, detail="No notes found to summarize")

    # In real implementation, call LLM
    combined_content = "\n\n".join([
        f"## {n.title}\n{n.content}" for n in notes_to_summarize
    ])

    summary = f"Summary of {len(notes_to_summarize)} note(s): Key points from the content would appear here. " \
              f"This covers topics from {notes_to_summarize[0].title}"

    # Store summary in first note
    notes_to_summarize[0].ai_summary = summary

    return {
        "summary": summary,
        "note_count": len(notes_to_summarize),
        "word_count": sum(n.word_count for n in notes_to_summarize),
        "key_points": ["Key point 1", "Key point 2", "Key point 3"],
    }

@app.post("/ai/extract")
async def ai_extract_info(request: AIExtractRequest):
    """AI-powered information extraction."""
    note = get_note(request.note_id)

    # In real implementation, use NER and LLM
    extractions = {
        "tasks": [
            {"task": "Complete the report", "due": "tomorrow"},
            {"task": "Review meeting notes", "due": None},
        ],
        "dates": [
            {"date": "2024-01-15", "context": "Project deadline"},
            {"date": "2024-01-20", "context": "Team meeting"},
        ],
        "entities": {
            "people": ["John Smith", "Jane Doe"],
            "organizations": ["Acme Corp"],
            "locations": ["New York"],
            "products": [],
        },
        "keywords": ["project", "deadline", "meeting", "review"],
    }

    # Store in note
    note.ai_entities = extractions["entities"]

    if request.extract_type != "all":
        return {request.extract_type: extractions.get(request.extract_type, [])}

    return extractions

@app.post("/ai/search")
async def ai_semantic_search(user_id: str, request: AISearchRequest):
    """AI-powered semantic search."""
    # In real implementation, use embeddings and vector search

    results = []
    query_lower = request.query.lower()

    for note in notes_db.values():
        if note.user_id != user_id:
            continue
        if note.is_trashed:
            continue
        if request.notebook_id and note.notebook_id != request.notebook_id:
            continue
        if request.tags and not any(t in note.tags for t in request.tags):
            continue

        # Simple keyword matching (real impl would use embeddings)
        score = 0
        if query_lower in note.title.lower():
            score += 0.5
        if query_lower in (note.content or "").lower():
            score += 0.3
        if any(query_lower in tag.lower() for tag in note.tags):
            score += 0.2

        if score > 0:
            results.append({
                "note": note,
                "score": score,
                "snippet": (note.content or "")[:200] + "..." if note.content else "",
                "matched_on": "content",
            })

    # Sort by score
    results.sort(key=lambda x: x["score"], reverse=True)

    return {
        "query": request.query,
        "search_type": request.search_type,
        "results": results[:request.limit],
        "total": len(results),
    }

@app.post("/ai/write")
async def ai_write_content(request: AIWriteRequest):
    """AI-powered content writing."""
    # In real implementation, call LLM

    generated = f"""Based on your prompt: "{request.prompt}"

Here is generated content in a {request.style} style:

[AI-generated content would appear here based on the prompt and context provided.
This would be a {request.length} length response covering the requested topic.]

Key points covered:
- Main topic addressed
- Supporting details
- Conclusion or next steps
"""

    return {
        "generated_content": generated,
        "word_count": len(generated.split()),
        "style_applied": request.style,
        "suggestions": [
            "Consider adding more specific examples",
            "You might want to include relevant links",
        ],
    }

@app.post("/ai/auto-tag")
async def ai_auto_tag(note_id: str):
    """AI-powered automatic tagging."""
    note = get_note(note_id)

    # In real implementation, use NLP to extract topics
    suggested_tags = ["project", "meeting", "todo", "important", "follow-up"]

    # Filter to relevant tags based on content
    content_lower = (note.content or "").lower()
    relevant_tags = [tag for tag in suggested_tags if tag in content_lower]

    # Store in note
    note.ai_tags = relevant_tags

    return {
        "note_id": note_id,
        "suggested_tags": relevant_tags,
        "confidence_scores": {tag: 0.8 for tag in relevant_tags},
    }

@app.post("/ai/link-suggestions", response_model=List[AILinkSuggestion])
async def ai_suggest_links(note_id: str, user_id: str):
    """AI-powered link suggestions between notes."""
    note = get_note(note_id)

    # Find related notes based on content similarity
    suggestions = []
    note_words = set((note.content or "").lower().split())

    for other_note in notes_db.values():
        if other_note.id == note_id:
            continue
        if other_note.user_id != user_id:
            continue
        if other_note.is_trashed:
            continue

        other_words = set((other_note.content or "").lower().split())
        common_words = note_words & other_words

        if len(common_words) > 5:  # Arbitrary threshold
            relevance = len(common_words) / max(len(note_words), 1)
            suggestions.append(AILinkSuggestion(
                target_note_id=other_note.id,
                target_note_title=other_note.title,
                relevance_score=min(relevance, 1.0),
                context=f"Shared topics: {', '.join(list(common_words)[:5])}",
            ))

    # Sort by relevance
    suggestions.sort(key=lambda x: x.relevance_score, reverse=True)

    return suggestions[:10]

@app.post("/ai/ocr")
async def ai_ocr_image(request: AIOCRRequest):
    """AI-powered OCR for images."""
    # In real implementation, use OCR service (Tesseract, Google Vision, etc.)

    return {
        "image_url": request.image_url,
        "language": request.language,
        "extracted_text": "[OCR would extract text from the image here]",
        "confidence": 0.95,
        "blocks": [
            {"text": "Line 1 of extracted text", "confidence": 0.98},
            {"text": "Line 2 of extracted text", "confidence": 0.92},
        ],
    }

@app.post("/ai/grammar-check")
async def ai_grammar_check(note_id: str):
    """AI-powered grammar and style checking."""
    note = get_note(note_id)

    # In real implementation, use language model
    return {
        "note_id": note_id,
        "issues": [
            {
                "type": "grammar",
                "text": "example text",
                "suggestion": "corrected text",
                "position": {"start": 0, "end": 12},
            },
        ],
        "style_suggestions": [
            "Consider using active voice",
            "Sentence at position 5 is too long",
        ],
        "readability_score": 75,
        "tone": "professional",
    }

# ============== WebSocket for Real-time Collaboration ==============

@app.websocket("/ws/notes/{note_id}")
async def websocket_endpoint(websocket: WebSocket, note_id: str):
    """WebSocket endpoint for real-time note collaboration."""
    await websocket.accept()

    if note_id not in active_connections:
        active_connections[note_id] = set()
    active_connections[note_id].add(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            # Broadcast to other connections
            for connection in active_connections[note_id]:
                if connection != websocket:
                    try:
                        await connection.send_json(data)
                    except:
                        pass

            # Handle specific operations
            if data.get("type") == "update":
                note = notes_db.get(note_id)
                if note:
                    note.content = data.get("content", note.content)
                    note.updated_at = datetime.utcnow()

    except WebSocketDisconnect:
        active_connections[note_id].discard(websocket)

# ============== Statistics ==============

@app.get("/stats/{user_id}")
async def get_note_stats(user_id: str):
    """Get note statistics for a user."""
    notes = [n for n in notes_db.values() if n.user_id == user_id]

    total_words = sum(n.word_count for n in notes if not n.is_trashed)
    total_characters = sum(n.character_count for n in notes if not n.is_trashed)

    return {
        "total_notes": len([n for n in notes if not n.is_trashed]),
        "total_notebooks": len([nb for nb in notebooks_db.values() if nb.user_id == user_id]),
        "total_tags": len([t for t in tags_db.values() if t.user_id == user_id]),
        "total_words": total_words,
        "total_characters": total_characters,
        "pinned_notes": len([n for n in notes if n.is_pinned and not n.is_trashed]),
        "archived_notes": len([n for n in notes if n.is_archived and not n.is_trashed]),
        "trashed_notes": len([n for n in notes if n.is_trashed]),
        "shared_notes": len([n for n in notes if n.is_shared and not n.is_trashed]),
        "notes_by_type": {
            note_type.value: len([n for n in notes if n.note_type == note_type and not n.is_trashed])
            for note_type in NoteType
        },
        "most_used_tags": sorted(
            [(t.name, t.note_count) for t in tags_db.values() if t.user_id == user_id],
            key=lambda x: x[1],
            reverse=True
        )[:10],
    }

# ============== Health Check ==============

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-notes",
        "version": "1.0.0",
        "notes": len(notes_db),
        "notebooks": len(notebooks_db),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8007)
