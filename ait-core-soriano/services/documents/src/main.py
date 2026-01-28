"""
AI-Docs Service

Backend service for document management with AI capabilities.
"""

from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
import structlog
import uvicorn
import json

logger = structlog.get_logger(__name__)


# Pydantic Models
class DocumentCreate(BaseModel):
    title: str
    content: Optional[Dict[str, Any]] = Field(default_factory=dict)
    folder_id: Optional[UUID] = None
    template_id: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    folder_id: Optional[UUID] = None


class AIGenerateRequest(BaseModel):
    prompt: str
    document_id: Optional[UUID] = None
    context: Optional[str] = None
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class AIEditRequest(BaseModel):
    document_id: UUID
    selected_text: str
    instruction: str
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class Document(BaseModel):
    id: UUID
    title: str
    content: Dict[str, Any]
    owner_id: UUID
    folder_id: Optional[UUID]
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting AI-Docs Service")
    # Initialize AI agents, database connections, etc.
    yield
    logger.info("Shutting down AI-Docs Service")


app = FastAPI(
    title="AI-Docs Service",
    description="Document management service with AI capabilities",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database)
documents_db: Dict[UUID, Dict] = {}

# WebSocket connections for collaboration
collaborators: Dict[UUID, List[WebSocket]] = {}


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-docs"}


# Document CRUD endpoints
@app.get("/api/v1/docs/documents", response_model=List[Document])
async def list_documents(
    folder_id: Optional[UUID] = None,
    limit: int = 50,
    offset: int = 0,
):
    """List all documents, optionally filtered by folder."""
    docs = list(documents_db.values())

    if folder_id:
        docs = [d for d in docs if d.get("folder_id") == folder_id]

    return docs[offset:offset + limit]


@app.post("/api/v1/docs/documents", response_model=Document)
async def create_document(doc: DocumentCreate):
    """Create a new document."""
    doc_id = uuid4()
    now = datetime.utcnow()

    document = {
        "id": doc_id,
        "title": doc.title,
        "content": doc.content or {"type": "doc", "content": []},
        "owner_id": uuid4(),  # Would come from auth
        "folder_id": doc.folder_id,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }

    documents_db[doc_id] = document
    logger.info("Document created", doc_id=str(doc_id), title=doc.title)

    return document


@app.get("/api/v1/docs/documents/{doc_id}", response_model=Document)
async def get_document(doc_id: UUID):
    """Get a document by ID."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    return documents_db[doc_id]


@app.put("/api/v1/docs/documents/{doc_id}", response_model=Document)
async def update_document(doc_id: UUID, update: DocumentUpdate):
    """Update a document."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = documents_db[doc_id]

    if update.title is not None:
        doc["title"] = update.title
    if update.content is not None:
        doc["content"] = update.content
    if update.folder_id is not None:
        doc["folder_id"] = update.folder_id

    doc["version"] += 1
    doc["updated_at"] = datetime.utcnow()

    logger.info("Document updated", doc_id=str(doc_id), version=doc["version"])

    return doc


@app.delete("/api/v1/docs/documents/{doc_id}")
async def delete_document(doc_id: UUID):
    """Delete a document."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    del documents_db[doc_id]
    logger.info("Document deleted", doc_id=str(doc_id))

    return {"status": "deleted", "id": doc_id}


# Version history
@app.get("/api/v1/docs/documents/{doc_id}/versions")
async def get_versions(doc_id: UUID):
    """Get version history for a document."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    # In production, this would fetch from version history table
    doc = documents_db[doc_id]
    return {
        "document_id": doc_id,
        "current_version": doc["version"],
        "versions": [
            {
                "version": doc["version"],
                "created_at": doc["updated_at"],
                "author": "current_user"
            }
        ]
    }


# AI endpoints
@app.post("/api/v1/docs/ai/generate")
async def ai_generate(request: AIGenerateRequest):
    """Generate content using AI."""
    # This would use the DocsAgent
    logger.info("AI generate request", prompt=request.prompt[:50])

    async def generate_stream():
        # Simulated streaming response
        # In production, this uses the LLM Orchestrator
        response = f"Generated content for: {request.prompt}"
        for char in response:
            yield f"data: {json.dumps({'chunk': char})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream"
    )


@app.post("/api/v1/docs/ai/edit")
async def ai_edit(request: AIEditRequest):
    """Edit text using AI."""
    logger.info(
        "AI edit request",
        doc_id=str(request.document_id),
        instruction=request.instruction[:50]
    )

    async def edit_stream():
        # Simulated streaming response
        response = f"Edited text based on: {request.instruction}"
        for char in response:
            yield f"data: {json.dumps({'chunk': char})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        edit_stream(),
        media_type="text/event-stream"
    )


@app.post("/api/v1/docs/ai/summarize")
async def ai_summarize(doc_id: UUID, style: str = "bullet_points"):
    """Summarize a document."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = documents_db[doc_id]

    # Would use DocsAgent.summarize()
    return {
        "document_id": doc_id,
        "summary": f"Summary of {doc['title']}",
        "style": style
    }


@app.post("/api/v1/docs/ai/translate")
async def ai_translate(doc_id: UUID, target_language: str):
    """Translate a document."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    # Would use DocsAgent.translate()
    return {
        "document_id": doc_id,
        "target_language": target_language,
        "status": "translation_started"
    }


# Real-time collaboration WebSocket
@app.websocket("/api/v1/docs/documents/{doc_id}/collaborate")
async def collaborate(websocket: WebSocket, doc_id: UUID):
    """WebSocket endpoint for real-time collaboration."""
    await websocket.accept()

    if doc_id not in documents_db:
        await websocket.close(code=4004, reason="Document not found")
        return

    # Add to collaborators
    if doc_id not in collaborators:
        collaborators[doc_id] = []
    collaborators[doc_id].append(websocket)

    logger.info("Collaborator joined", doc_id=str(doc_id))

    try:
        while True:
            data = await websocket.receive_json()

            # Handle different operation types
            op_type = data.get("type")

            if op_type == "update":
                # Broadcast update to other collaborators
                for ws in collaborators[doc_id]:
                    if ws != websocket:
                        await ws.send_json({
                            "type": "update",
                            "data": data.get("data"),
                            "from": str(websocket.client)
                        })

            elif op_type == "cursor":
                # Broadcast cursor position
                for ws in collaborators[doc_id]:
                    if ws != websocket:
                        await ws.send_json({
                            "type": "cursor",
                            "position": data.get("position"),
                            "user": data.get("user")
                        })

            elif op_type == "selection":
                # Broadcast selection
                for ws in collaborators[doc_id]:
                    if ws != websocket:
                        await ws.send_json({
                            "type": "selection",
                            "selection": data.get("selection"),
                            "user": data.get("user")
                        })

    except WebSocketDisconnect:
        collaborators[doc_id].remove(websocket)
        logger.info("Collaborator left", doc_id=str(doc_id))


# Export endpoints
@app.get("/api/v1/docs/documents/{doc_id}/export/{format}")
async def export_document(doc_id: UUID, format: str):
    """Export document to different formats."""
    if doc_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")

    supported_formats = ["pdf", "docx", "html", "markdown", "txt"]
    if format not in supported_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format. Supported: {supported_formats}"
        )

    doc = documents_db[doc_id]

    # In production, this would generate the actual file
    return {
        "document_id": doc_id,
        "format": format,
        "download_url": f"/downloads/{doc_id}.{format}",
        "expires_in": 3600
    }


# Template endpoints
@app.get("/api/v1/docs/templates")
async def list_templates():
    """List available document templates."""
    return {
        "templates": [
            {"id": "blank", "name": "Blank Document", "category": "general"},
            {"id": "report", "name": "Business Report", "category": "business"},
            {"id": "proposal", "name": "Project Proposal", "category": "business"},
            {"id": "meeting_notes", "name": "Meeting Notes", "category": "productivity"},
            {"id": "article", "name": "Article", "category": "writing"},
            {"id": "resume", "name": "Resume", "category": "personal"},
            {"id": "letter", "name": "Formal Letter", "category": "correspondence"},
            {"id": "contract", "name": "Contract Template", "category": "legal"},
        ]
    }


@app.post("/api/v1/docs/documents/from-template/{template_id}")
async def create_from_template(template_id: str, title: str = "Untitled"):
    """Create a document from a template."""
    # Would load template content and create document
    doc_id = uuid4()
    now = datetime.utcnow()

    document = {
        "id": doc_id,
        "title": title,
        "content": {"type": "doc", "content": [], "template": template_id},
        "owner_id": uuid4(),
        "folder_id": None,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }

    documents_db[doc_id] = document

    return document


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
