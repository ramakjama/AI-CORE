/**
 * Resolvers Index
 * Aggregates all domain resolvers
 */

import { partyResolvers } from './party.resolver';
import { insuranceResolvers } from './insurance.resolver';
import { communicationResolvers } from './communication.resolver';
import { workflowResolvers } from './workflow.resolver';
import { analyticsResolvers } from './analytics.resolver';
import { GraphQLContext, MetricsData } from '../types';
import { getFederationHealth } from '../services/federation.service';

// ============================================================================
// Base Resolvers
// ============================================================================

const baseResolvers = {
  Query: {
    _health: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const federationHealth = await getFederationHealth();
      const uptime = process.uptime();

      return {
        status: federationHealth.healthy ? 'HEALTHY' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(uptime),
        subgraphs: federationHealth.subgraphs.map(s => ({
          name: s.name,
          status: s.healthy ? 'HEALTHY' : 'UNHEALTHY',
          responseTime: s.responseTime,
          lastCheck: s.lastCheck.toISOString(),
        })),
      };
    },

    _service: () => ({
      sdl: '', // Would be populated with actual SDL
      name: 'ai-gateway',
      version: process.env.npm_package_version || '1.0.0',
    }),
  },

  Mutation: {
    _noop: () => true,
  },
};

// ============================================================================
// Scalar Resolvers
// ============================================================================

import { GraphQLScalarType, Kind } from 'graphql';

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'ISO-8601 formatted date-time string',
  serialize(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).toISOString();
    }
    throw new Error('Invalid DateTime value');
  },
  parseValue(value: unknown): Date {
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid DateTime string');
      }
      return date;
    }
    throw new Error('Invalid DateTime value');
  },
  parseLiteral(ast): Date {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      const date = new Date(ast.kind === Kind.INT ? parseInt(ast.value, 10) : ast.value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid DateTime string');
      }
      return date;
    }
    throw new Error('Invalid DateTime literal');
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize(value: unknown): unknown {
    return value;
  },
  parseValue(value: unknown): unknown {
    return value;
  },
  parseLiteral(ast, variables): unknown {
    switch (ast.kind) {
      case Kind.STRING:
        return ast.value;
      case Kind.INT:
        return parseInt(ast.value, 10);
      case Kind.FLOAT:
        return parseFloat(ast.value);
      case Kind.BOOLEAN:
        return ast.value;
      case Kind.NULL:
        return null;
      case Kind.LIST:
        return ast.values.map(v => JSONScalar.parseLiteral(v, variables));
      case Kind.OBJECT:
        const obj: Record<string, unknown> = {};
        ast.fields.forEach(field => {
          obj[field.name.value] = JSONScalar.parseLiteral(field.value, variables);
        });
        return obj;
      default:
        return null;
    }
  },
});

const UUIDScalar = new GraphQLScalarType({
  name: 'UUID',
  description: 'UUID string',
  serialize(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    throw new Error('Invalid UUID value');
  },
  parseValue(value: unknown): string {
    if (typeof value === 'string') {
      // Basic UUID validation
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(value)) {
        return value;
      }
      throw new Error('Invalid UUID format');
    }
    throw new Error('Invalid UUID value');
  },
  parseLiteral(ast): string {
    if (ast.kind === Kind.STRING) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(ast.value)) {
        return ast.value;
      }
      throw new Error('Invalid UUID format');
    }
    throw new Error('Invalid UUID literal');
  },
});

const DecimalScalar = new GraphQLScalarType({
  name: 'Decimal',
  description: 'Decimal number for monetary values',
  serialize(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    throw new Error('Invalid Decimal value');
  },
  parseValue(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        throw new Error('Invalid Decimal string');
      }
      return num;
    }
    throw new Error('Invalid Decimal value');
  },
  parseLiteral(ast): number {
    if (ast.kind === Kind.INT) {
      return parseInt(ast.value, 10);
    }
    if (ast.kind === Kind.FLOAT) {
      return parseFloat(ast.value);
    }
    if (ast.kind === Kind.STRING) {
      return parseFloat(ast.value);
    }
    throw new Error('Invalid Decimal literal');
  },
});

const scalarResolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,
  UUID: UUIDScalar,
  Decimal: DecimalScalar,
};

// ============================================================================
// Merge Resolvers
// ============================================================================

function mergeResolvers(...resolverSets: Record<string, unknown>[]): Record<string, unknown> {
  const merged: Record<string, unknown> = {};

  for (const resolvers of resolverSets) {
    for (const [key, value] of Object.entries(resolvers)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = {
          ...((merged[key] as Record<string, unknown>) || {}),
          ...(value as Record<string, unknown>),
        };
      } else {
        merged[key] = value;
      }
    }
  }

  return merged;
}

// ============================================================================
// Combined Resolvers
// ============================================================================

export const resolvers = mergeResolvers(
  scalarResolvers,
  baseResolvers,
  partyResolvers,
  insuranceResolvers,
  communicationResolvers,
  workflowResolvers,
  analyticsResolvers
);

// ============================================================================
// Individual Exports
// ============================================================================

export { partyResolvers } from './party.resolver';
export { insuranceResolvers } from './insurance.resolver';
export { communicationResolvers } from './communication.resolver';
export { workflowResolvers } from './workflow.resolver';
export { analyticsResolvers } from './analytics.resolver';
export {
  DateTimeScalar,
  JSONScalar,
  UUIDScalar,
  DecimalScalar,
  scalarResolvers,
};

export default resolvers;
