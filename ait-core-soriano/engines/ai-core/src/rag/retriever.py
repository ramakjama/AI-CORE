"""
RAG Retriever: Retrieval Augmented Generation pipeline.

Supports:
- Pinecone (cloud vector store)
- Qdrant (local/cloud vector store)
- Semantic search with reranking
- Multi-document retrieval
- Cross-app knowledge base
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import structlog

logger = structlog.get_logger(__name__)


class VectorStoreProvider(str, Enum):
    """Supported vector store providers."""
    PINECONE = "pinecone"
    QDRANT = "qdrant"
    CHROMA = "chroma"  # For local development


@dataclass
class Document:
    """A document chunk with metadata."""
    id: str
    content: str
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None
    score: Optional[float] = None


@dataclass
class RetrievalResult:
    """Result of a retrieval query."""
    query: str
    documents: List[Document]
    total_found: int
    search_time_ms: float


class BaseVectorStore(ABC):
    """Base class for vector store implementations."""

    @abstractmethod
    async def upsert(self, documents: List[Document], namespace: str = "default") -> int:
        """Insert or update documents."""
        pass

    @abstractmethod
    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        namespace: str = "default",
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Search for similar documents."""
        pass

    @abstractmethod
    async def delete(self, ids: List[str], namespace: str = "default") -> int:
        """Delete documents by ID."""
        pass


class PineconeStore(BaseVectorStore):
    """Pinecone vector store implementation."""

    def __init__(self, api_key: str, index_name: str, environment: str = "gcp-starter"):
        from pinecone import Pinecone

        self.pc = Pinecone(api_key=api_key)
        self.index = self.pc.Index(index_name)
        self.index_name = index_name

    async def upsert(self, documents: List[Document], namespace: str = "default") -> int:
        vectors = [
            {
                "id": doc.id,
                "values": doc.embedding,
                "metadata": {
                    "content": doc.content[:1000],  # Limit metadata size
                    **doc.metadata
                }
            }
            for doc in documents
            if doc.embedding
        ]

        if not vectors:
            return 0

        response = self.index.upsert(vectors=vectors, namespace=namespace)
        logger.info("pinecone_upsert", count=len(vectors), namespace=namespace)
        return response.upserted_count

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        namespace: str = "default",
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        response = self.index.query(
            vector=query_embedding,
            top_k=top_k,
            namespace=namespace,
            filter=filters,
            include_metadata=True,
        )

        documents = []
        for match in response.matches:
            doc = Document(
                id=match.id,
                content=match.metadata.get("content", ""),
                metadata={k: v for k, v in match.metadata.items() if k != "content"},
                score=match.score
            )
            documents.append(doc)

        return documents

    async def delete(self, ids: List[str], namespace: str = "default") -> int:
        self.index.delete(ids=ids, namespace=namespace)
        logger.info("pinecone_delete", count=len(ids), namespace=namespace)
        return len(ids)


class QdrantStore(BaseVectorStore):
    """Qdrant vector store implementation (local or cloud)."""

    def __init__(
        self,
        url: str = "http://localhost:6333",
        api_key: Optional[str] = None,
        collection_name: str = "ai_suite"
    ):
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams

        self.client = QdrantClient(url=url, api_key=api_key)
        self.collection_name = collection_name

        # Ensure collection exists
        collections = self.client.get_collections().collections
        if not any(c.name == collection_name for c in collections):
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
            )

    async def upsert(self, documents: List[Document], namespace: str = "default") -> int:
        from qdrant_client.models import PointStruct

        points = [
            PointStruct(
                id=hash(doc.id) % (2**63),  # Qdrant uses int64 IDs
                vector=doc.embedding,
                payload={
                    "doc_id": doc.id,
                    "content": doc.content,
                    "namespace": namespace,
                    **doc.metadata
                }
            )
            for doc in documents
            if doc.embedding
        ]

        if not points:
            return 0

        self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info("qdrant_upsert", count=len(points), namespace=namespace)
        return len(points)

    async def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        namespace: str = "default",
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        from qdrant_client.models import Filter, FieldCondition, MatchValue

        # Build filter
        must_conditions = [FieldCondition(key="namespace", match=MatchValue(value=namespace))]

        if filters:
            for key, value in filters.items():
                must_conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )

        query_filter = Filter(must=must_conditions) if must_conditions else None

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k,
            query_filter=query_filter,
        )

        documents = []
        for point in results:
            doc = Document(
                id=point.payload.get("doc_id", str(point.id)),
                content=point.payload.get("content", ""),
                metadata={k: v for k, v in point.payload.items()
                         if k not in ("doc_id", "content", "namespace")},
                score=point.score
            )
            documents.append(doc)

        return documents

    async def delete(self, ids: List[str], namespace: str = "default") -> int:
        from qdrant_client.models import Filter, FieldCondition, MatchAny

        self.client.delete(
            collection_name=self.collection_name,
            points_selector=Filter(
                must=[
                    FieldCondition(key="doc_id", match=MatchAny(any=ids))
                ]
            )
        )
        logger.info("qdrant_delete", count=len(ids), namespace=namespace)
        return len(ids)


class RAGRetriever:
    """
    RAG Retriever for AI-Suite.

    Manages document indexing and retrieval across all applications.
    """

    def __init__(
        self,
        vector_store: BaseVectorStore,
        embedding_service: "EmbeddingService",  # Forward reference
        reranker: Optional["Reranker"] = None,
    ):
        self.vector_store = vector_store
        self.embedder = embedding_service
        self.reranker = reranker

    async def index_documents(
        self,
        documents: List[Dict[str, Any]],
        namespace: str = "default",
        chunk_size: int = 512,
        chunk_overlap: int = 50,
    ) -> int:
        """
        Index documents into the vector store.

        Args:
            documents: List of documents with 'id', 'content', and optional 'metadata'
            namespace: Namespace for isolation (e.g., user_id, app_name)
            chunk_size: Size of text chunks
            chunk_overlap: Overlap between chunks

        Returns:
            Number of chunks indexed
        """
        from .chunker import TextChunker

        chunker = TextChunker(chunk_size=chunk_size, overlap=chunk_overlap)
        all_chunks = []

        for doc in documents:
            chunks = chunker.split(doc["content"])

            for i, chunk_text in enumerate(chunks):
                chunk_doc = Document(
                    id=f"{doc['id']}_chunk_{i}",
                    content=chunk_text,
                    metadata={
                        "source_id": doc["id"],
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        **(doc.get("metadata", {}))
                    }
                )
                all_chunks.append(chunk_doc)

        # Generate embeddings
        texts = [chunk.content for chunk in all_chunks]
        embeddings = await self.embedder.embed_batch(texts)

        for chunk, embedding in zip(all_chunks, embeddings):
            chunk.embedding = embedding

        # Store in vector database
        return await self.vector_store.upsert(all_chunks, namespace=namespace)

    async def retrieve(
        self,
        query: str,
        namespace: str = "default",
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        min_score: float = 0.7,
    ) -> RetrievalResult:
        """
        Retrieve relevant documents for a query.

        Args:
            query: Search query
            namespace: Namespace to search in
            top_k: Number of results to return
            filters: Optional metadata filters
            min_score: Minimum relevance score

        Returns:
            RetrievalResult with matching documents
        """
        import time

        start_time = time.time()

        # Embed query
        query_embedding = await self.embedder.embed(query)

        # Search vector store
        documents = await self.vector_store.search(
            query_embedding=query_embedding,
            top_k=top_k * 2,  # Over-fetch for reranking
            namespace=namespace,
            filters=filters,
        )

        # Filter by minimum score
        documents = [doc for doc in documents if (doc.score or 0) >= min_score]

        # Rerank if available
        if self.reranker and documents:
            documents = await self.reranker.rerank(query, documents)

        # Limit to top_k
        documents = documents[:top_k]

        search_time_ms = (time.time() - start_time) * 1000

        logger.info(
            "rag_retrieve",
            query_length=len(query),
            namespace=namespace,
            results=len(documents),
            search_time_ms=search_time_ms
        )

        return RetrievalResult(
            query=query,
            documents=documents,
            total_found=len(documents),
            search_time_ms=search_time_ms
        )

    async def augmented_generate(
        self,
        query: str,
        namespace: str = "default",
        top_k: int = 5,
        system_prompt: Optional[str] = None,
    ) -> str:
        """
        Generate a response augmented with retrieved context.

        This combines retrieval with generation in a single call.
        """
        from .orchestrator import get_orchestrator, TaskType

        # Retrieve relevant documents
        result = await self.retrieve(query, namespace=namespace, top_k=top_k)

        # Build context from retrieved documents
        context_parts = []
        for i, doc in enumerate(result.documents, 1):
            context_parts.append(f"[Source {i}]: {doc.content}")

        context = "\n\n".join(context_parts)

        # Build augmented prompt
        augmented_prompt = f"""Based on the following context, answer the question.

CONTEXT:
{context}

QUESTION: {query}

INSTRUCTIONS:
- Answer based on the provided context
- If the context doesn't contain relevant information, say so
- Cite sources using [Source N] when referencing specific information
"""

        # Generate response
        orchestrator = await get_orchestrator()
        response = await orchestrator.generate(
            prompt=augmented_prompt,
            task_type=TaskType.CHAT,
            system_prompt=system_prompt or "You are a helpful assistant that answers questions based on provided context."
        )

        return response

    async def delete_documents(
        self,
        document_ids: List[str],
        namespace: str = "default"
    ) -> int:
        """Delete documents from the index."""
        return await self.vector_store.delete(document_ids, namespace=namespace)
