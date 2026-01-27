/**
 * Federation Service
 * Apollo Federation 2.0 supergraph building and subgraph management
 */

import { buildSubgraphSchema } from '@apollo/subgraph';
import { DocumentNode, parse, print } from 'graphql';
import gql from 'graphql-tag';
import {
  SubgraphConfig,
  FederationConfig,
  SubgraphHealthMetrics,
  GatewayError,
} from '../types';

// ============================================================================
// Types
// ============================================================================

interface SubgraphInfo {
  config: SubgraphConfig;
  schema?: DocumentNode;
  sdl?: string;
  health: SubgraphHealthMetrics;
  lastIntrospection?: Date;
}

interface SupergraphBuildResult {
  supergraphSdl: string;
  subgraphs: Map<string, SubgraphInfo>;
  errors: string[];
  warnings: string[];
}

interface IntrospectionResult {
  success: boolean;
  sdl?: string;
  schema?: DocumentNode;
  error?: string;
}

// ============================================================================
// State Management
// ============================================================================

const subgraphs = new Map<string, SubgraphInfo>();
let federationConfig: FederationConfig | null = null;
let pollingInterval: NodeJS.Timer | null = null;

// ============================================================================
// Configuration
// ============================================================================

/**
 * Initialize federation service with configuration
 */
export function initializeFederation(config: FederationConfig): void {
  federationConfig = config;

  // Register all configured subgraphs
  for (const subgraphConfig of config.subgraphs) {
    registerSubgraph(subgraphConfig);
  }

  // Start polling if enabled
  if (config.polling?.enabled) {
    startPolling(config.polling.intervalMs);
  }
}

/**
 * Get federation configuration
 */
export function getFederationConfig(): FederationConfig | null {
  return federationConfig;
}

// ============================================================================
// Subgraph Registration
// ============================================================================

/**
 * Register a new subgraph
 */
export function registerSubgraph(config: SubgraphConfig): void {
  const existing = subgraphs.get(config.name);

  subgraphs.set(config.name, {
    config,
    schema: existing?.schema,
    sdl: existing?.sdl,
    health: existing?.health || {
      name: config.name,
      healthy: false,
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 0,
      requestCount: 0,
    },
    lastIntrospection: existing?.lastIntrospection,
  });

  console.log(`Registered subgraph: ${config.name} at ${config.url}`);
}

/**
 * Unregister a subgraph
 */
export function unregisterSubgraph(name: string): boolean {
  const deleted = subgraphs.delete(name);
  if (deleted) {
    console.log(`Unregistered subgraph: ${name}`);
  }
  return deleted;
}

/**
 * Get all registered subgraphs
 */
export function getSubgraphs(): Map<string, SubgraphInfo> {
  return new Map(subgraphs);
}

/**
 * Get subgraph by name
 */
export function getSubgraph(name: string): SubgraphInfo | undefined {
  return subgraphs.get(name);
}

// ============================================================================
// Schema Introspection
// ============================================================================

/**
 * Introspect a subgraph to get its schema
 */
export async function introspectSubgraph(url: string): Promise<IntrospectionResult> {
  const introspectionQuery = `
    query IntrospectionQuery {
      _service {
        sdl
      }
    }
  `;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: introspectionQuery,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const result = await response.json();

    if (result.errors) {
      return {
        success: false,
        error: result.errors.map((e: { message: string }) => e.message).join(', '),
      };
    }

    const sdl = result.data?._service?.sdl;
    if (!sdl) {
      return {
        success: false,
        error: 'No SDL returned from introspection',
      };
    }

    // Parse the SDL to validate it
    const schema = parse(sdl);

    return {
      success: true,
      sdl,
      schema,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Introspect all registered subgraphs
 */
export async function introspectAllSubgraphs(): Promise<Map<string, IntrospectionResult>> {
  const results = new Map<string, IntrospectionResult>();

  const promises = Array.from(subgraphs.entries()).map(async ([name, info]) => {
    const result = await introspectSubgraph(info.config.url);

    if (result.success) {
      info.sdl = result.sdl;
      info.schema = result.schema;
      info.lastIntrospection = new Date();
    }

    results.set(name, result);
  });

  await Promise.all(promises);
  return results;
}

// ============================================================================
// Supergraph Building
// ============================================================================

/**
 * Build supergraph from all registered subgraphs
 */
export async function buildSupergraph(
  subgraphConfigs?: SubgraphConfig[]
): Promise<SupergraphBuildResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const subgraphMap = new Map<string, SubgraphInfo>();

  // Use provided configs or registered subgraphs
  const configs = subgraphConfigs || Array.from(subgraphs.values()).map(s => s.config);

  // Introspect all subgraphs
  for (const config of configs) {
    const result = await introspectSubgraph(config.url);

    if (!result.success) {
      errors.push(`Failed to introspect ${config.name}: ${result.error}`);
      continue;
    }

    const info: SubgraphInfo = {
      config,
      sdl: result.sdl,
      schema: result.schema,
      health: {
        name: config.name,
        healthy: true,
        lastCheck: new Date(),
        responseTime: 0,
        errorRate: 0,
        requestCount: 0,
      },
      lastIntrospection: new Date(),
    };

    subgraphMap.set(config.name, info);
  }

  if (subgraphMap.size === 0) {
    return {
      supergraphSdl: '',
      subgraphs: subgraphMap,
      errors: ['No subgraphs available'],
      warnings,
    };
  }

  // Compose supergraph SDL
  // Note: In production, you'd use @apollo/composition for proper federation composition
  // This is a simplified version that concatenates schemas
  const supergraphParts: string[] = [];

  // Add federation directives
  supergraphParts.push(`
    directive @link(url: String!, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA
    scalar link__Import
    enum link__Purpose { SECURITY EXECUTION }
  `);

  // Add each subgraph's schema
  for (const [name, info] of subgraphMap) {
    if (info.sdl) {
      supergraphParts.push(`# Subgraph: ${name}`);
      supergraphParts.push(info.sdl);
    }
  }

  const supergraphSdl = supergraphParts.join('\n\n');

  return {
    supergraphSdl,
    subgraphs: subgraphMap,
    errors,
    warnings,
  };
}

/**
 * Build subgraph schema from type definitions and resolvers
 */
export function buildLocalSubgraphSchema(
  typeDefs: DocumentNode | string,
  resolvers: Record<string, unknown>
): ReturnType<typeof buildSubgraphSchema> {
  const typeDefsDoc = typeof typeDefs === 'string' ? gql(typeDefs) : typeDefs;

  return buildSubgraphSchema([
    {
      typeDefs: typeDefsDoc,
      resolvers: resolvers as never,
    },
  ]);
}

// ============================================================================
// Health Checks
// ============================================================================

/**
 * Perform health check on a subgraph
 */
export async function healthCheck(subgraphName: string): Promise<SubgraphHealthMetrics> {
  const info = subgraphs.get(subgraphName);

  if (!info) {
    throw new GatewayError(`Subgraph '${subgraphName}' not found`, 'NOT_FOUND', 404);
  }

  const healthPath = info.config.healthCheckPath || '/health';
  const url = new URL(healthPath, info.config.url).toString();
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: info.config.headers,
      signal: AbortSignal.timeout(info.config.timeout || 5000),
    });

    const responseTime = Date.now() - startTime;
    const healthy = response.ok;

    info.health = {
      name: subgraphName,
      healthy,
      lastCheck: new Date(),
      responseTime,
      errorRate: healthy ? 0 : info.health.errorRate + 0.1,
      requestCount: info.health.requestCount + 1,
    };

    return info.health;
  } catch (error) {
    const responseTime = Date.now() - startTime;

    info.health = {
      name: subgraphName,
      healthy: false,
      lastCheck: new Date(),
      responseTime,
      errorRate: info.health.errorRate + 0.1,
      requestCount: info.health.requestCount + 1,
    };

    return info.health;
  }
}

/**
 * Perform health check on all subgraphs
 */
export async function healthCheckAll(): Promise<Map<string, SubgraphHealthMetrics>> {
  const results = new Map<string, SubgraphHealthMetrics>();

  const promises = Array.from(subgraphs.keys()).map(async (name) => {
    const health = await healthCheck(name);
    results.set(name, health);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Get overall federation health
 */
export async function getFederationHealth(): Promise<{
  healthy: boolean;
  subgraphs: SubgraphHealthMetrics[];
  unhealthyCount: number;
}> {
  const healthResults = await healthCheckAll();
  const subgraphsArray = Array.from(healthResults.values());
  const unhealthyCount = subgraphsArray.filter(s => !s.healthy).length;

  return {
    healthy: unhealthyCount === 0,
    subgraphs: subgraphsArray,
    unhealthyCount,
  };
}

// ============================================================================
// Polling
// ============================================================================

/**
 * Start polling for subgraph health and schema changes
 */
export function startPolling(intervalMs: number): void {
  if (pollingInterval) {
    stopPolling();
  }

  pollingInterval = setInterval(async () => {
    try {
      // Health check all subgraphs
      await healthCheckAll();

      // Optionally re-introspect schemas
      // await introspectAllSubgraphs();
    } catch (error) {
      console.error('Federation polling error:', error);
    }
  }, intervalMs);

  console.log(`Federation polling started with interval ${intervalMs}ms`);
}

/**
 * Stop polling
 */
export function stopPolling(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('Federation polling stopped');
  }
}

// ============================================================================
// Query Routing
// ============================================================================

/**
 * Determine which subgraph should handle a query
 */
export function routeQuery(
  operationType: 'query' | 'mutation' | 'subscription',
  fieldName: string
): SubgraphInfo | null {
  // In a real implementation, you'd use the supergraph schema to determine routing
  // This is a simplified version that just returns the first available subgraph
  for (const info of subgraphs.values()) {
    if (info.health.healthy) {
      return info;
    }
  }
  return null;
}

/**
 * Execute federated query
 */
export async function executeFederatedQuery(
  query: string,
  variables?: Record<string, unknown>,
  headers?: Record<string, string>
): Promise<unknown> {
  // Parse query to determine operation type and field
  const document = parse(query);
  const operation = document.definitions[0];

  if (operation.kind !== 'OperationDefinition') {
    throw new GatewayError('Invalid query', 'INVALID_QUERY', 400);
  }

  // Find subgraph to handle query
  const subgraph = routeQuery(
    operation.operation,
    operation.selectionSet.selections[0]?.kind === 'Field'
      ? (operation.selectionSet.selections[0] as { name: { value: string } }).name.value
      : ''
  );

  if (!subgraph) {
    throw new GatewayError('No healthy subgraph available', 'SERVICE_UNAVAILABLE', 503);
  }

  // Execute query against subgraph
  const response = await fetch(subgraph.config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...subgraph.config.headers,
      ...headers,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new GatewayError(
      `Subgraph error: ${response.statusText}`,
      'SUBGRAPH_ERROR',
      response.status
    );
  }

  return response.json();
}

// ============================================================================
// Entity Resolution
// ============================================================================

/**
 * Resolve federated entity references
 */
export async function resolveEntityReferences(
  typename: string,
  representations: Array<{ __typename: string; [key: string]: unknown }>
): Promise<unknown[]> {
  // Find subgraph that owns this entity type
  // In a real implementation, you'd look this up in the supergraph schema
  const subgraph = Array.from(subgraphs.values()).find(s => s.health.healthy);

  if (!subgraph) {
    throw new GatewayError('No healthy subgraph available', 'SERVICE_UNAVAILABLE', 503);
  }

  const query = `
    query ResolveReferences($representations: [_Any!]!) {
      _entities(representations: $representations) {
        ... on ${typename} {
          __typename
        }
      }
    }
  `;

  const response = await fetch(subgraph.config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...subgraph.config.headers,
    },
    body: JSON.stringify({
      query,
      variables: { representations },
    }),
  });

  const result = await response.json();
  return result.data?._entities || [];
}

// ============================================================================
// Schema Management
// ============================================================================

/**
 * Get combined schema SDL
 */
export function getCombinedSchema(): string {
  const parts: string[] = [];

  for (const [name, info] of subgraphs) {
    if (info.sdl) {
      parts.push(`# Subgraph: ${name}\n${info.sdl}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Validate schema compatibility
 */
export function validateSchemaCompatibility(
  newSdl: string,
  subgraphName: string
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Parse the new SDL
    parse(newSdl);

    // TODO: Implement proper compatibility checking
    // - Check for breaking changes
    // - Validate federation directives
    // - Check entity key compatibility

    return { valid: true, errors, warnings };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Invalid SDL');
    return { valid: false, errors, warnings };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  initializeFederation,
  getFederationConfig,
  registerSubgraph,
  unregisterSubgraph,
  getSubgraphs,
  getSubgraph,
  introspectSubgraph,
  introspectAllSubgraphs,
  buildSupergraph,
  buildLocalSubgraphSchema,
  healthCheck,
  healthCheckAll,
  getFederationHealth,
  startPolling,
  stopPolling,
  routeQuery,
  executeFederatedQuery,
  resolveEntityReferences,
  getCombinedSchema,
  validateSchemaCompatibility,
};
