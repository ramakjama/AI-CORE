/**
 * API Client for AIT-CORE Backend Communication
 * Handles GraphQL requests and REST API calls
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
const REST_API_URL = process.env.NEXT_PUBLIC_REST_API_URL || 'http://localhost:4000/api';

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>;
}

interface RequestOptions {
  token?: string;
  headers?: Record<string, string>;
}

/**
 * Execute a GraphQL query or mutation
 */
export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
  options?: RequestOptions
): Promise<GraphQLResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Execute a REST API request
 */
export async function restRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: Record<string, unknown>,
  options?: RequestOptions
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${REST_API_URL}${endpoint}`, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

/**
 * GraphQL Queries
 */
export const queries = {
  // Agents
  GET_AGENTS: `
    query GetAgents {
      agents {
        id
        name
        description
        type
        status
        runs
        lastRun
        successRate
        avgResponseTime
        capabilities
      }
    }
  `,

  GET_AGENT: `
    query GetAgent($id: ID!) {
      agent(id: $id) {
        id
        name
        description
        type
        status
        runs
        lastRun
        successRate
        avgResponseTime
        capabilities
        configuration
      }
    }
  `,

  // Clients
  GET_CLIENTS: `
    query GetClients($limit: Int, $offset: Int) {
      clients(limit: $limit, offset: $offset) {
        items {
          id
          name
          email
          phone
          company
          status
          createdAt
        }
        total
      }
    }
  `,

  // Policies
  GET_POLICIES: `
    query GetPolicies($clientId: ID, $status: String) {
      policies(clientId: $clientId, status: $status) {
        items {
          id
          number
          type
          client { id name }
          premium
          startDate
          endDate
          status
        }
        total
      }
    }
  `,

  // Workflows
  GET_WORKFLOWS: `
    query GetWorkflows {
      workflows {
        id
        name
        description
        trigger
        status
        executions
        lastRun
        steps
      }
    }
  `,

  // Analytics
  GET_DASHBOARD_STATS: `
    query GetDashboardStats {
      dashboardStats {
        activeClients
        activePolicies
        messagesCount
        aiAgentsCount
        revenue
        renewalRate
      }
    }
  `,
};

/**
 * GraphQL Mutations
 */
export const mutations = {
  // Agents
  TOGGLE_AGENT_STATUS: `
    mutation ToggleAgentStatus($id: ID!) {
      toggleAgentStatus(id: $id) {
        id
        status
      }
    }
  `,

  EXECUTE_AGENT: `
    mutation ExecuteAgent($id: ID!, $input: JSON) {
      executeAgent(id: $id, input: $input) {
        success
        result
        executionTime
      }
    }
  `,

  // Clients
  CREATE_CLIENT: `
    mutation CreateClient($input: CreateClientInput!) {
      createClient(input: $input) {
        id
        name
        email
      }
    }
  `,

  // Workflows
  EXECUTE_WORKFLOW: `
    mutation ExecuteWorkflow($id: ID!) {
      executeWorkflow(id: $id) {
        success
        executionId
      }
    }
  `,
};
