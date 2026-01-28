"""
Embedding Service: Generate text embeddings for semantic search.

Supports:
- Local models via sentence-transformers
- OpenAI text-embedding-ada-002
- Cohere embeddings
- Custom embedding models
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from enum import Enum
import structlog
from functools import lru_cache

logger = structlog.get_logger(__name__)


class EmbeddingProvider(str, Enum):
    """Supported embedding providers."""
    SENTENCE_TRANSFORMERS = "sentence_transformers"
    OPENAI = "openai"
    COHERE = "cohere"
    OLLAMA = "ollama"


class BaseEmbedder(ABC):
    """Base class for embedding providers."""

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Return embedding dimension."""
        pass

    @abstractmethod
    async def embed(self, text: str) -> List[float]:
        """Embed a single text."""
        pass

    @abstractmethod
    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple texts."""
        pass


class SentenceTransformerEmbedder(BaseEmbedder):
    """Local embeddings using sentence-transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer

        self.model = SentenceTransformer(model_name)
        self._dimension = self.model.get_sentence_embedding_dimension()
        logger.info("sentence_transformer_loaded", model=model_name, dim=self._dimension)

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed(self, text: str) -> List[float]:
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.tolist()


class OpenAIEmbedder(BaseEmbedder):
    """OpenAI embeddings (text-embedding-ada-002, text-embedding-3-small/large)."""

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
    ):
        from openai import AsyncOpenAI

        self.client = AsyncOpenAI(api_key=api_key)
        self.model = model
        self._dimensions = {
            "text-embedding-ada-002": 1536,
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072,
        }
        self._dimension = self._dimensions.get(model, 1536)

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed(self, text: str) -> List[float]:
        response = await self.client.embeddings.create(
            model=self.model,
            input=text
        )
        return response.data[0].embedding

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        # OpenAI supports batch embedding
        response = await self.client.embeddings.create(
            model=self.model,
            input=texts
        )
        return [item.embedding for item in response.data]


class OllamaEmbedder(BaseEmbedder):
    """Local embeddings using Ollama."""

    def __init__(
        self,
        model: str = "nomic-embed-text",
        base_url: str = "http://localhost:11434"
    ):
        import ollama

        self.client = ollama.AsyncClient(host=base_url)
        self.model = model
        self._dimension = 768  # Default for nomic-embed-text

    @property
    def dimension(self) -> int:
        return self._dimension

    async def embed(self, text: str) -> List[float]:
        response = await self.client.embeddings(model=self.model, prompt=text)
        return response["embedding"]

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        # Ollama doesn't support batch, so we do it sequentially
        embeddings = []
        for text in texts:
            embedding = await self.embed(text)
            embeddings.append(embedding)
        return embeddings


class EmbeddingService:
    """
    Unified embedding service for AI-Suite.

    Features:
    - Multiple provider support
    - Automatic fallback
    - Caching for repeated texts
    - Batch processing optimization
    """

    def __init__(
        self,
        provider: EmbeddingProvider = EmbeddingProvider.SENTENCE_TRANSFORMERS,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None,
        fallback_provider: Optional[EmbeddingProvider] = None,
    ):
        self.provider = provider
        self.fallback_provider = fallback_provider

        # Initialize primary embedder
        self.embedder = self._create_embedder(provider, model_name, api_key)

        # Initialize fallback if specified
        self.fallback_embedder = None
        if fallback_provider:
            self.fallback_embedder = self._create_embedder(fallback_provider)

        # Simple cache for repeated embeddings
        self._cache: dict = {}
        self._cache_max_size = 10000

    def _create_embedder(
        self,
        provider: EmbeddingProvider,
        model_name: Optional[str] = None,
        api_key: Optional[str] = None
    ) -> BaseEmbedder:
        """Create an embedder for a given provider."""
        if provider == EmbeddingProvider.SENTENCE_TRANSFORMERS:
            return SentenceTransformerEmbedder(model_name or "all-MiniLM-L6-v2")

        elif provider == EmbeddingProvider.OPENAI:
            if not api_key:
                raise ValueError("OpenAI API key required")
            return OpenAIEmbedder(api_key, model_name or "text-embedding-3-small")

        elif provider == EmbeddingProvider.OLLAMA:
            return OllamaEmbedder(model_name or "nomic-embed-text")

        else:
            raise ValueError(f"Unsupported provider: {provider}")

    @property
    def dimension(self) -> int:
        """Get the embedding dimension."""
        return self.embedder.dimension

    async def embed(self, text: str, use_cache: bool = True) -> List[float]:
        """
        Embed a single text.

        Args:
            text: Text to embed
            use_cache: Whether to use caching

        Returns:
            List of floats representing the embedding
        """
        # Check cache
        cache_key = hash(text)
        if use_cache and cache_key in self._cache:
            return self._cache[cache_key]

        try:
            embedding = await self.embedder.embed(text)
        except Exception as e:
            if self.fallback_embedder:
                logger.warning(f"Primary embedder failed, using fallback: {e}")
                embedding = await self.fallback_embedder.embed(text)
            else:
                raise

        # Update cache
        if use_cache:
            if len(self._cache) >= self._cache_max_size:
                # Simple eviction: clear half the cache
                keys_to_remove = list(self._cache.keys())[:self._cache_max_size // 2]
                for key in keys_to_remove:
                    del self._cache[key]
            self._cache[cache_key] = embedding

        return embedding

    async def embed_batch(
        self,
        texts: List[str],
        batch_size: int = 100
    ) -> List[List[float]]:
        """
        Embed multiple texts efficiently.

        Args:
            texts: List of texts to embed
            batch_size: Size of batches for processing

        Returns:
            List of embeddings
        """
        all_embeddings = []

        # Process in batches
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]

            try:
                embeddings = await self.embedder.embed_batch(batch)
            except Exception as e:
                if self.fallback_embedder:
                    logger.warning(f"Primary embedder failed on batch, using fallback: {e}")
                    embeddings = await self.fallback_embedder.embed_batch(batch)
                else:
                    raise

            all_embeddings.extend(embeddings)

            logger.debug(
                "batch_embedded",
                batch_num=i // batch_size + 1,
                batch_size=len(batch),
                total_progress=len(all_embeddings)
            )

        return all_embeddings

    async def similarity(self, text1: str, text2: str) -> float:
        """
        Calculate cosine similarity between two texts.

        Returns:
            Similarity score between 0 and 1
        """
        import numpy as np

        emb1 = await self.embed(text1)
        emb2 = await self.embed(text2)

        # Cosine similarity
        dot_product = np.dot(emb1, emb2)
        norm1 = np.linalg.norm(emb1)
        norm2 = np.linalg.norm(emb2)

        return float(dot_product / (norm1 * norm2))

    def clear_cache(self):
        """Clear the embedding cache."""
        self._cache.clear()
        logger.info("embedding_cache_cleared")
