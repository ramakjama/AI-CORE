/**
 * AI-CORE AI/LLM Configuration
 * Configuration for all AI models and providers
 */

import { z } from 'zod';

// -----------------------------------------------------------------------------
// Anthropic Configuration Schema
// -----------------------------------------------------------------------------
const AnthropicConfigSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().default('claude-sonnet-4-20250514'),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  topK: z.number().int().positive().optional(),
  enabled: z.boolean().default(false),
  models: z.object({
    default: z.string().default('claude-sonnet-4-20250514'),
    fast: z.string().default('claude-3-5-haiku-20241022'),
    powerful: z.string().default('claude-opus-4-20250514'),
    balanced: z.string().default('claude-sonnet-4-20250514'),
  }),
});

// -----------------------------------------------------------------------------
// OpenAI Configuration Schema
// -----------------------------------------------------------------------------
const OpenAIConfigSchema = z.object({
  apiKey: z.string().optional(),
  organization: z.string().optional(),
  model: z.string().default('gpt-4-turbo'),
  embeddingModel: z.string().default('text-embedding-3-large'),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
  enabled: z.boolean().default(false),
  models: z.object({
    default: z.string().default('gpt-4-turbo'),
    fast: z.string().default('gpt-4o-mini'),
    powerful: z.string().default('gpt-4o'),
    embedding: z.string().default('text-embedding-3-large'),
    embeddingSmall: z.string().default('text-embedding-3-small'),
    vision: z.string().default('gpt-4o'),
    audio: z.string().default('whisper-1'),
    tts: z.string().default('tts-1-hd'),
  }),
});

// -----------------------------------------------------------------------------
// Azure OpenAI Configuration Schema
// -----------------------------------------------------------------------------
const AzureOpenAIConfigSchema = z.object({
  apiKey: z.string().optional(),
  endpoint: z.string().url().optional(),
  deployment: z.string().optional(),
  apiVersion: z.string().default('2024-02-15-preview'),
  enabled: z.boolean().default(false),
  deployments: z.object({
    chat: z.string().optional(),
    embedding: z.string().optional(),
    completion: z.string().optional(),
  }).optional(),
});

// -----------------------------------------------------------------------------
// Google AI Configuration Schema
// -----------------------------------------------------------------------------
const GoogleAIConfigSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().default('gemini-pro'),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
  topK: z.number().int().positive().default(40),
  enabled: z.boolean().default(false),
  models: z.object({
    default: z.string().default('gemini-pro'),
    vision: z.string().default('gemini-pro-vision'),
    flash: z.string().default('gemini-1.5-flash'),
    pro: z.string().default('gemini-1.5-pro'),
  }),
});

// -----------------------------------------------------------------------------
// Cohere Configuration Schema
// -----------------------------------------------------------------------------
const CohereConfigSchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().default('command-r-plus'),
  embeddingModel: z.string().default('embed-multilingual-v3.0'),
  maxTokens: z.number().int().positive().default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
  enabled: z.boolean().default(false),
  models: z.object({
    default: z.string().default('command-r-plus'),
    fast: z.string().default('command-r'),
    embedding: z.string().default('embed-multilingual-v3.0'),
    rerank: z.string().default('rerank-multilingual-v3.0'),
  }),
});

// -----------------------------------------------------------------------------
// HuggingFace Configuration Schema
// -----------------------------------------------------------------------------
const HuggingFaceConfigSchema = z.object({
  apiKey: z.string().optional(),
  inferenceEndpoint: z.string().url().optional(),
  enabled: z.boolean().default(false),
  models: z.object({
    textGeneration: z.string().optional(),
    embedding: z.string().optional(),
    classification: z.string().optional(),
    ner: z.string().optional(),
    summarization: z.string().optional(),
    translation: z.string().optional(),
  }).optional(),
});

// -----------------------------------------------------------------------------
// Local/Self-hosted Models Configuration Schema
// -----------------------------------------------------------------------------
const LocalModelsConfigSchema = z.object({
  enabled: z.boolean().default(false),
  ollama: z.object({
    baseUrl: z.string().url().default('http://localhost:11434'),
    model: z.string().default('llama3'),
    enabled: z.boolean().default(false),
  }),
  llamaCpp: z.object({
    modelPath: z.string().optional(),
    contextSize: z.number().int().positive().default(4096),
    gpuLayers: z.number().int().min(0).default(0),
    enabled: z.boolean().default(false),
  }),
  vllm: z.object({
    baseUrl: z.string().url().optional(),
    model: z.string().optional(),
    enabled: z.boolean().default(false),
  }),
});

// -----------------------------------------------------------------------------
// AI Agent Configuration Schema
// -----------------------------------------------------------------------------
const AIAgentConfigSchema = z.object({
  maxIterations: z.number().int().positive().default(10),
  maxExecutionTime: z.number().int().positive().default(300000), // 5 minutes
  memoryType: z.enum(['buffer', 'summary', 'vector']).default('buffer'),
  memoryMaxTokens: z.number().int().positive().default(4000),
  tools: z.object({
    webSearch: z.boolean().default(true),
    codeExecution: z.boolean().default(false),
    fileSystem: z.boolean().default(false),
    database: z.boolean().default(true),
    api: z.boolean().default(true),
  }),
});

// -----------------------------------------------------------------------------
// RAG Configuration Schema
// -----------------------------------------------------------------------------
const RAGConfigSchema = z.object({
  enabled: z.boolean().default(true),
  chunkSize: z.number().int().positive().default(1000),
  chunkOverlap: z.number().int().min(0).default(200),
  retrievalK: z.number().int().positive().default(5),
  retrievalScoreThreshold: z.number().min(0).max(1).default(0.7),
  rerankEnabled: z.boolean().default(true),
  rerankTopN: z.number().int().positive().default(3),
  hybridSearch: z.boolean().default(true),
  hybridSearchAlpha: z.number().min(0).max(1).default(0.5),
});

// -----------------------------------------------------------------------------
// Prompt Management Configuration Schema
// -----------------------------------------------------------------------------
const PromptConfigSchema = z.object({
  versioning: z.boolean().default(true),
  caching: z.boolean().default(true),
  cacheTTL: z.number().int().positive().default(3600), // 1 hour
  templates: z.object({
    directory: z.string().default('./prompts'),
    format: z.enum(['handlebars', 'jinja2', 'mustache']).default('handlebars'),
  }),
});

// -----------------------------------------------------------------------------
// Model Routing Configuration Schema
// -----------------------------------------------------------------------------
const ModelRoutingConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultProvider: z.enum(['anthropic', 'openai', 'azure', 'google', 'cohere', 'local']).default('anthropic'),
  fallbackProvider: z.enum(['anthropic', 'openai', 'azure', 'google', 'cohere', 'local']).optional(),
  costOptimization: z.boolean().default(false),
  latencyOptimization: z.boolean().default(false),
  loadBalancing: z.boolean().default(false),
  routing: z.object({
    chat: z.enum(['anthropic', 'openai', 'azure', 'google', 'cohere', 'local']).default('anthropic'),
    embedding: z.enum(['openai', 'cohere', 'local']).default('openai'),
    vision: z.enum(['anthropic', 'openai', 'google']).default('anthropic'),
    code: z.enum(['anthropic', 'openai', 'azure']).default('anthropic'),
    analysis: z.enum(['anthropic', 'openai', 'google']).default('anthropic'),
  }),
});

// -----------------------------------------------------------------------------
// Rate Limiting & Quotas Configuration Schema
// -----------------------------------------------------------------------------
const AIRateLimitConfigSchema = z.object({
  enabled: z.boolean().default(true),
  requestsPerMinute: z.number().int().positive().default(60),
  tokensPerMinute: z.number().int().positive().default(100000),
  tokensPerDay: z.number().int().positive().default(1000000),
  concurrentRequests: z.number().int().positive().default(10),
  queueEnabled: z.boolean().default(true),
  queueMaxSize: z.number().int().positive().default(100),
});

// -----------------------------------------------------------------------------
// Complete AI Configuration Schema
// -----------------------------------------------------------------------------
export const AIConfigSchema = z.object({
  anthropic: AnthropicConfigSchema,
  openai: OpenAIConfigSchema,
  azure: AzureOpenAIConfigSchema,
  google: GoogleAIConfigSchema,
  cohere: CohereConfigSchema,
  huggingface: HuggingFaceConfigSchema,
  local: LocalModelsConfigSchema,
  agents: AIAgentConfigSchema,
  rag: RAGConfigSchema,
  prompts: PromptConfigSchema,
  routing: ModelRoutingConfigSchema,
  rateLimit: AIRateLimitConfigSchema,
});

export type AIConfig = z.infer<typeof AIConfigSchema>;

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseFloat(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// -----------------------------------------------------------------------------
// Build AI Configuration
// -----------------------------------------------------------------------------
export const aiConfig: AIConfig = {
  // === ANTHROPIC ===
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
    maxTokens: parseNumber(process.env.ANTHROPIC_MAX_TOKENS, 4096),
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE, 0.7),
    topP: parseFloat(process.env.ANTHROPIC_TOP_P, 1),
    topK: process.env.ANTHROPIC_TOP_K ? parseNumber(process.env.ANTHROPIC_TOP_K, 40) : undefined,
    enabled: !!process.env.ANTHROPIC_API_KEY,
    models: {
      default: 'claude-sonnet-4-20250514',
      fast: 'claude-3-5-haiku-20241022',
      powerful: 'claude-opus-4-20250514',
      balanced: 'claude-sonnet-4-20250514',
    },
  },

  // === OPENAI ===
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo',
    embeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large',
    maxTokens: parseNumber(process.env.OPENAI_MAX_TOKENS, 4096),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE, 0.7),
    topP: parseFloat(process.env.OPENAI_TOP_P, 1),
    frequencyPenalty: parseFloat(process.env.OPENAI_FREQUENCY_PENALTY, 0),
    presencePenalty: parseFloat(process.env.OPENAI_PRESENCE_PENALTY, 0),
    enabled: !!process.env.OPENAI_API_KEY,
    models: {
      default: 'gpt-4-turbo',
      fast: 'gpt-4o-mini',
      powerful: 'gpt-4o',
      embedding: 'text-embedding-3-large',
      embeddingSmall: 'text-embedding-3-small',
      vision: 'gpt-4o',
      audio: 'whisper-1',
      tts: 'tts-1-hd',
    },
  },

  // === AZURE OPENAI ===
  azure: {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview',
    enabled: !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT,
    deployments: {
      chat: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT,
      embedding: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT,
      completion: process.env.AZURE_OPENAI_COMPLETION_DEPLOYMENT,
    },
  },

  // === GOOGLE AI ===
  google: {
    apiKey: process.env.GOOGLE_AI_API_KEY,
    model: process.env.GOOGLE_AI_MODEL || 'gemini-pro',
    maxTokens: parseNumber(process.env.GOOGLE_AI_MAX_TOKENS, 4096),
    temperature: parseFloat(process.env.GOOGLE_AI_TEMPERATURE, 0.7),
    topP: parseFloat(process.env.GOOGLE_AI_TOP_P, 1),
    topK: parseNumber(process.env.GOOGLE_AI_TOP_K, 40),
    enabled: !!process.env.GOOGLE_AI_API_KEY,
    models: {
      default: 'gemini-pro',
      vision: 'gemini-pro-vision',
      flash: 'gemini-1.5-flash',
      pro: 'gemini-1.5-pro',
    },
  },

  // === COHERE ===
  cohere: {
    apiKey: process.env.COHERE_API_KEY,
    model: process.env.COHERE_MODEL || 'command-r-plus',
    embeddingModel: process.env.COHERE_EMBEDDING_MODEL || 'embed-multilingual-v3.0',
    maxTokens: parseNumber(process.env.COHERE_MAX_TOKENS, 4096),
    temperature: parseFloat(process.env.COHERE_TEMPERATURE, 0.7),
    enabled: !!process.env.COHERE_API_KEY,
    models: {
      default: 'command-r-plus',
      fast: 'command-r',
      embedding: 'embed-multilingual-v3.0',
      rerank: 'rerank-multilingual-v3.0',
    },
  },

  // === HUGGING FACE ===
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY,
    inferenceEndpoint: process.env.HUGGINGFACE_INFERENCE_ENDPOINT,
    enabled: !!process.env.HUGGINGFACE_API_KEY,
    models: {
      textGeneration: process.env.HUGGINGFACE_TEXT_GENERATION_MODEL,
      embedding: process.env.HUGGINGFACE_EMBEDDING_MODEL,
      classification: process.env.HUGGINGFACE_CLASSIFICATION_MODEL,
      ner: process.env.HUGGINGFACE_NER_MODEL,
      summarization: process.env.HUGGINGFACE_SUMMARIZATION_MODEL,
      translation: process.env.HUGGINGFACE_TRANSLATION_MODEL,
    },
  },

  // === LOCAL MODELS ===
  local: {
    enabled: parseBoolean(process.env.LOCAL_MODELS_ENABLED),
    ollama: {
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3',
      enabled: parseBoolean(process.env.OLLAMA_ENABLED),
    },
    llamaCpp: {
      modelPath: process.env.LLAMA_CPP_MODEL_PATH,
      contextSize: parseNumber(process.env.LLAMA_CPP_CONTEXT_SIZE, 4096),
      gpuLayers: parseNumber(process.env.LLAMA_CPP_GPU_LAYERS, 0),
      enabled: parseBoolean(process.env.LLAMA_CPP_ENABLED),
    },
    vllm: {
      baseUrl: process.env.VLLM_BASE_URL,
      model: process.env.VLLM_MODEL,
      enabled: parseBoolean(process.env.VLLM_ENABLED),
    },
  },

  // === AI AGENTS ===
  agents: {
    maxIterations: parseNumber(process.env.AI_AGENT_MAX_ITERATIONS, 10),
    maxExecutionTime: parseNumber(process.env.AI_AGENT_MAX_EXECUTION_TIME, 300000),
    memoryType: (process.env.AI_AGENT_MEMORY_TYPE as 'buffer' | 'summary' | 'vector') || 'buffer',
    memoryMaxTokens: parseNumber(process.env.AI_AGENT_MEMORY_MAX_TOKENS, 4000),
    tools: {
      webSearch: parseBoolean(process.env.AI_AGENT_TOOL_WEB_SEARCH, true),
      codeExecution: parseBoolean(process.env.AI_AGENT_TOOL_CODE_EXECUTION),
      fileSystem: parseBoolean(process.env.AI_AGENT_TOOL_FILE_SYSTEM),
      database: parseBoolean(process.env.AI_AGENT_TOOL_DATABASE, true),
      api: parseBoolean(process.env.AI_AGENT_TOOL_API, true),
    },
  },

  // === RAG ===
  rag: {
    enabled: parseBoolean(process.env.RAG_ENABLED, true),
    chunkSize: parseNumber(process.env.RAG_CHUNK_SIZE, 1000),
    chunkOverlap: parseNumber(process.env.RAG_CHUNK_OVERLAP, 200),
    retrievalK: parseNumber(process.env.RAG_RETRIEVAL_K, 5),
    retrievalScoreThreshold: parseFloat(process.env.RAG_RETRIEVAL_SCORE_THRESHOLD, 0.7),
    rerankEnabled: parseBoolean(process.env.RAG_RERANK_ENABLED, true),
    rerankTopN: parseNumber(process.env.RAG_RERANK_TOP_N, 3),
    hybridSearch: parseBoolean(process.env.RAG_HYBRID_SEARCH, true),
    hybridSearchAlpha: parseFloat(process.env.RAG_HYBRID_SEARCH_ALPHA, 0.5),
  },

  // === PROMPTS ===
  prompts: {
    versioning: parseBoolean(process.env.PROMPTS_VERSIONING, true),
    caching: parseBoolean(process.env.PROMPTS_CACHING, true),
    cacheTTL: parseNumber(process.env.PROMPTS_CACHE_TTL, 3600),
    templates: {
      directory: process.env.PROMPTS_TEMPLATES_DIRECTORY || './prompts',
      format: (process.env.PROMPTS_TEMPLATES_FORMAT as 'handlebars' | 'jinja2' | 'mustache') || 'handlebars',
    },
  },

  // === MODEL ROUTING ===
  routing: {
    enabled: parseBoolean(process.env.AI_ROUTING_ENABLED, true),
    defaultProvider: (process.env.AI_DEFAULT_PROVIDER as any) || 'anthropic',
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER as any,
    costOptimization: parseBoolean(process.env.AI_COST_OPTIMIZATION),
    latencyOptimization: parseBoolean(process.env.AI_LATENCY_OPTIMIZATION),
    loadBalancing: parseBoolean(process.env.AI_LOAD_BALANCING),
    routing: {
      chat: (process.env.AI_ROUTING_CHAT as any) || 'anthropic',
      embedding: (process.env.AI_ROUTING_EMBEDDING as any) || 'openai',
      vision: (process.env.AI_ROUTING_VISION as any) || 'anthropic',
      code: (process.env.AI_ROUTING_CODE as any) || 'anthropic',
      analysis: (process.env.AI_ROUTING_ANALYSIS as any) || 'anthropic',
    },
  },

  // === RATE LIMITING ===
  rateLimit: {
    enabled: parseBoolean(process.env.AI_RATE_LIMIT_ENABLED, true),
    requestsPerMinute: parseNumber(process.env.AI_RATE_LIMIT_RPM, 60),
    tokensPerMinute: parseNumber(process.env.AI_RATE_LIMIT_TPM, 100000),
    tokensPerDay: parseNumber(process.env.AI_RATE_LIMIT_TPD, 1000000),
    concurrentRequests: parseNumber(process.env.AI_RATE_LIMIT_CONCURRENT, 10),
    queueEnabled: parseBoolean(process.env.AI_RATE_LIMIT_QUEUE_ENABLED, true),
    queueMaxSize: parseNumber(process.env.AI_RATE_LIMIT_QUEUE_MAX_SIZE, 100),
  },
};

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Get enabled AI providers
 */
export function getEnabledProviders(): string[] {
  const providers: string[] = [];

  if (aiConfig.anthropic.enabled) providers.push('anthropic');
  if (aiConfig.openai.enabled) providers.push('openai');
  if (aiConfig.azure.enabled) providers.push('azure');
  if (aiConfig.google.enabled) providers.push('google');
  if (aiConfig.cohere.enabled) providers.push('cohere');
  if (aiConfig.huggingface.enabled) providers.push('huggingface');
  if (aiConfig.local.ollama.enabled) providers.push('ollama');
  if (aiConfig.local.llamaCpp.enabled) providers.push('llama-cpp');
  if (aiConfig.local.vllm.enabled) providers.push('vllm');

  return providers;
}

/**
 * Get default model for a specific task
 */
export function getModelForTask(task: 'chat' | 'embedding' | 'vision' | 'code' | 'analysis'): string {
  const provider = aiConfig.routing.routing[task];

  switch (provider) {
    case 'anthropic':
      return aiConfig.anthropic.model;
    case 'openai':
      return task === 'embedding' ? aiConfig.openai.embeddingModel : aiConfig.openai.model;
    case 'google':
      return aiConfig.google.model;
    case 'cohere':
      return task === 'embedding' ? aiConfig.cohere.embeddingModel : aiConfig.cohere.model;
    default:
      return aiConfig.anthropic.model;
  }
}

/**
 * Check if any AI provider is available
 */
export function isAIAvailable(): boolean {
  return getEnabledProviders().length > 0;
}

/**
 * Get provider configuration by name
 */
export function getProviderConfig(
  provider: 'anthropic' | 'openai' | 'azure' | 'google' | 'cohere'
): typeof aiConfig.anthropic | typeof aiConfig.openai | typeof aiConfig.azure | typeof aiConfig.google | typeof aiConfig.cohere {
  return aiConfig[provider];
}

export default aiConfig;
