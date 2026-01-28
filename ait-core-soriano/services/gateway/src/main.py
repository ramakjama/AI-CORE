"""
AI-Suite API Gateway

Central entry point for all AI-Suite services.
Handles routing, authentication, rate limiting, and cross-cutting concerns.
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import structlog
import uvicorn
from typing import Optional

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
    ]
)
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting AI-Suite API Gateway")
    yield
    logger.info("Shutting down AI-Suite API Gateway")


app = FastAPI(
    title="AI-Suite API Gateway",
    description="Central API Gateway for AI-Suite productivity applications",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-suite-gateway",
        "version": "1.0.0"
    }


# Service discovery endpoints
@app.get("/api/v1/services")
async def list_services():
    """List all available services."""
    return {
        "services": [
            {
                "name": "documents",
                "description": "AI-Docs service",
                "status": "active",
                "base_path": "/api/v1/docs"
            },
            {
                "name": "spreadsheets",
                "description": "AI-Sheets service",
                "status": "active",
                "base_path": "/api/v1/sheets"
            },
            {
                "name": "presentations",
                "description": "AI-Slides service",
                "status": "active",
                "base_path": "/api/v1/slides"
            },
            {
                "name": "mail",
                "description": "AI-Mail service",
                "status": "active",
                "base_path": "/api/v1/mail"
            },
            {
                "name": "collaboration",
                "description": "AI-Collab service",
                "status": "active",
                "base_path": "/api/v1/collab"
            },
            {
                "name": "notes",
                "description": "AI-Notes service",
                "status": "active",
                "base_path": "/api/v1/notes"
            },
            {
                "name": "calendar",
                "description": "AI-Calendar service",
                "status": "active",
                "base_path": "/api/v1/calendar"
            },
            {
                "name": "storage",
                "description": "AI-Drive service",
                "status": "active",
                "base_path": "/api/v1/drive"
            },
            {
                "name": "forms",
                "description": "AI-Forms service",
                "status": "active",
                "base_path": "/api/v1/forms"
            },
            {
                "name": "tasks",
                "description": "AI-Tasks service",
                "status": "active",
                "base_path": "/api/v1/tasks"
            },
            {
                "name": "whiteboard",
                "description": "AI-Whiteboard service",
                "status": "active",
                "base_path": "/api/v1/whiteboard"
            },
            {
                "name": "analytics",
                "description": "AI-Analytics service",
                "status": "active",
                "base_path": "/api/v1/analytics"
            },
            {
                "name": "code",
                "description": "AI-Code service",
                "status": "active",
                "base_path": "/api/v1/code"
            },
            {
                "name": "database",
                "description": "AI-Database service",
                "status": "active",
                "base_path": "/api/v1/database"
            },
            {
                "name": "cms",
                "description": "AI-CMS service",
                "status": "active",
                "base_path": "/api/v1/cms"
            },
            {
                "name": "workflow",
                "description": "AI-Workflow service",
                "status": "active",
                "base_path": "/api/v1/workflow"
            },
            {
                "name": "assistant",
                "description": "AI-Assistant service",
                "status": "active",
                "base_path": "/api/v1/assistant"
            },
        ]
    }


# AI Assistant endpoint (omnipresent)
@app.post("/api/v1/assistant/chat")
async def assistant_chat(request: Request):
    """Universal AI assistant endpoint."""
    body = await request.json()

    # This would forward to the assistant service
    return {
        "message": "Assistant endpoint - forward to assistant service",
        "body": body
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "status_code": 500
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
