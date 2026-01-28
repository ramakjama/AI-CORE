"""
AI-Suite Core: LLM Orchestrator with Multi-Model Support

This package provides:
- Multi-model LLM routing (local + cloud)
- RAG pipeline with vector stores
- AI agents for each application
- Fine-tuning utilities
"""

from .orchestrator.router import LLMOrchestrator
from .orchestrator.model_registry import ModelRegistry
from .rag.retriever import RAGRetriever
from .rag.embeddings import EmbeddingService

__version__ = "1.0.0"
__all__ = [
    "LLMOrchestrator",
    "ModelRegistry",
    "RAGRetriever",
    "EmbeddingService",
]
