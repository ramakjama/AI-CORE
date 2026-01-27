/**
 * RAG Types
 * Interfaces for Retrieval-Augmented Generation
 */

import type { KnowledgeType, ChunkStatus } from './enums';

/**
 * Knowledge Document
 */
export interface KnowledgeDocument {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: KnowledgeType;

  // Content
  content: string;
  contentHash: string;

  // Source
  sourceUrl?: string;
  sourceType?: string;
  fileName?: string;
  mimeType?: string;

  // Categorization
  category?: string;
  department?: string;
  tags: string[];

  // Version
  version: string;
  publishedAt?: Date;
  effectiveFrom?: Date;
  effectiveTo?: Date;

  // State
  isPublished: boolean;
  isArchived: boolean;

  // Chunks
  chunks?: KnowledgeChunk[];

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Knowledge Chunk
 */
export interface KnowledgeChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  status: ChunkStatus;

  // Content
  content: string;
  contentHash: string;

  // Position
  startChar?: number;
  endChar?: number;
  pageNumber?: number;
  sectionTitle?: string;

  // Tokens
  tokenCount: number;

  // Overlap
  overlapPrevious: number;
  overlapNext: number;

  // Embedding
  embedding?: number[];

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Embedding
 */
export interface Embedding {
  id: string;
  chunkId: string;

  // Vector
  vector: number[];
  vectorModel: string;
  dimensions: number;

  version: number;
  createdAt: Date;

  metadata?: Record<string, unknown>;
}

/**
 * Chunking Configuration
 */
export interface ChunkingConfig {
  // Strategy
  strategy: 'fixed' | 'sentence' | 'paragraph' | 'semantic' | 'recursive';

  // Size
  chunkSize: number;
  chunkOverlap: number;

  // Separators for recursive strategy
  separators?: string[];

  // Sentence splitter options
  minSentenceLength?: number;
  maxSentenceLength?: number;

  // Semantic chunking options
  similarityThreshold?: number;

  // Metadata to preserve
  preserveMetadata?: boolean;
}

/**
 * Embedding Configuration
 */
export interface EmbeddingConfig {
  model: string;
  dimensions?: number;
  batchSize: number;
  maxRetries: number;
  timeout: number;
}

/**
 * Vector Search Query
 */
export interface VectorSearchQuery {
  // Query
  query?: string;
  embedding?: number[];

  // Filters
  documentIds?: string[];
  categories?: string[];
  departments?: string[];
  tags?: string[];
  types?: KnowledgeType[];

  // Date range
  publishedAfter?: Date;
  publishedBefore?: Date;

  // Search parameters
  topK: number;
  similarityThreshold?: number;

  // Include metadata
  includeContent?: boolean;
  includeMetadata?: boolean;

  // Pagination
  offset?: number;
}

/**
 * Vector Search Result
 */
export interface VectorSearchResult {
  chunk: KnowledgeChunk;
  document?: KnowledgeDocument;

  // Similarity
  similarity: number;
  distance?: number;

  // Relevance (after reranking)
  relevanceScore?: number;

  // Highlight
  highlights?: string[];
}

/**
 * Retrieval Query
 */
export interface RetrievalQuery {
  query: string;
  conversationId?: string;
  userId?: string;

  // Knowledge base filter
  knowledgeBaseIds?: string[];

  // Search parameters
  topK?: number;
  similarityThreshold?: number;

  // Reranking
  useReranking?: boolean;
  rerankTopK?: number;

  // Max tokens
  maxTokens?: number;

  // Context
  context?: {
    previousQueries?: string[];
    currentTopic?: string;
    userIntent?: string;
  };

  metadata?: Record<string, unknown>;
}

/**
 * Retrieval Result
 */
export interface RetrievalResult {
  query: string;
  results: VectorSearchResult[];

  // Aggregated content
  context: string;
  tokenCount: number;

  // Sources
  sources: Array<{
    documentId: string;
    documentTitle: string;
    chunkIndex: number;
    relevance: number;
  }>;

  // Timing
  retrievalTime: number;
  rerankingTime?: number;

  // Metadata
  searchParams: {
    topK: number;
    similarityThreshold: number;
    useReranking: boolean;
  };

  metadata?: Record<string, unknown>;
}

/**
 * Reranking Request
 */
export interface RerankingRequest {
  query: string;
  documents: Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>;

  topK?: number;
  model?: string;
}

/**
 * Reranking Result
 */
export interface RerankingResult {
  results: Array<{
    id: string;
    content: string;
    score: number;
    rank: number;
  }>;

  model: string;
  processingTime: number;
}

/**
 * Document Ingestion Request
 */
export interface DocumentIngestionRequest {
  // Document info
  code?: string;
  title: string;
  description?: string;
  type?: KnowledgeType;

  // Content
  content?: string;
  fileUrl?: string;
  filePath?: string;
  base64Content?: string;
  mimeType?: string;

  // Categorization
  category?: string;
  department?: string;
  tags?: string[];

  // Chunking
  chunkingConfig?: ChunkingConfig;

  // Processing
  extractMetadata?: boolean;
  generateSummary?: boolean;

  metadata?: Record<string, unknown>;
  createdBy?: string;
}

/**
 * Document Ingestion Result
 */
export interface DocumentIngestionResult {
  success: boolean;
  documentId: string;

  // Processing results
  chunksCreated: number;
  embeddingsGenerated: number;

  // Extracted info
  extractedMetadata?: Record<string, unknown>;
  summary?: string;

  // Timing
  processingTime: number;

  // Errors
  errors?: Array<{
    stage: string;
    error: string;
  }>;
}

/**
 * Knowledge Query (for tracking)
 */
export interface KnowledgeQuery {
  id: string;
  documentId?: string;

  // Query
  queryText: string;
  queryVector?: number[];

  // Results
  resultsCount: number;
  topChunkIds: string[];
  topScores: number[];
  retrievalTime?: number;

  // Context
  userId?: string;
  conversationId?: string;
  executionId?: string;

  // Feedback
  wasHelpful?: boolean;
  feedback?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Vector Store Configuration
 */
export interface VectorStoreConfig {
  // Connection
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;

  // Collection/Table
  tableName: string;
  embeddingColumn: string;
  contentColumn: string;

  // Index
  indexType: 'ivfflat' | 'hnsw' | 'none';
  indexParams?: {
    lists?: number;
    m?: number;
    efConstruction?: number;
  };

  // Distance metric
  distanceMetric: 'cosine' | 'l2' | 'inner_product';

  // Dimensions
  dimensions: number;
}

/**
 * Hybrid Search Query
 */
export interface HybridSearchQuery extends VectorSearchQuery {
  // Full-text search
  textQuery?: string;
  textWeight?: number;
  vectorWeight?: number;

  // Fusion method
  fusionMethod?: 'rrf' | 'weighted' | 'convex';
}

/**
 * RAG Pipeline Configuration
 */
export interface RAGPipelineConfig {
  // Retrieval
  retriever: {
    topK: number;
    similarityThreshold: number;
    hybridSearch: boolean;
    textWeight?: number;
    vectorWeight?: number;
  };

  // Reranking
  reranker?: {
    enabled: boolean;
    model: string;
    topK: number;
  };

  // Context
  contextConfig: {
    maxTokens: number;
    includeMetadata: boolean;
    sourceAttribution: boolean;
  };

  // Generation
  generation: {
    systemPrompt?: string;
    includeInstructions: boolean;
    citationStyle: 'inline' | 'footnote' | 'none';
  };
}
