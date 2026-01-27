/**
 * Integration Service
 * Gestión de integraciones con sistemas externos
 */

import { v4 as uuidv4 } from 'uuid';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  Integration,
  IntegrationConfig,
  IntegrationCredentials,
  IntegrationType,
  IntegrationStatus,
  IntegrationLog,
  AuthType,
  OperationResult,
  PaginatedResult,
  QueryFilters
} from '../types';

/**
 * Almacenamiento en memoria (reemplazar por base de datos en producción)
 */
const integrations: Map<string, Integration> = new Map();
const integrationLogs: Map<string, IntegrationLog[]> = new Map();
const axiosInstances: Map<string, AxiosInstance> = new Map();

/**
 * Servicio de Integraciones
 */
export class IntegrationService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Registrar una nueva integración
   */
  async register(
    integrationType: IntegrationType,
    config: IntegrationConfig,
    credentials: IntegrationCredentials,
    options?: {
      name?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<OperationResult<Integration>> {
    try {
      const id = uuidv4();
      const now = new Date();

      const integration: Integration = {
        id,
        name: options?.name || `${integrationType} Integration`,
        description: options?.description,
        type: integrationType,
        status: IntegrationStatus.PENDING_CONFIG,
        config,
        credentials,
        metadata: options?.metadata,
        errorCount: 0,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        tenantId: this.tenantId
      };

      // Validar configuración básica
      const validationResult = this.validateConfig(config, credentials);
      if (!validationResult.success) {
        return validationResult as OperationResult<Integration>;
      }

      // Crear instancia de Axios
      const axiosInstance = this.createAxiosInstance(integration);
      axiosInstances.set(id, axiosInstance);

      // Guardar integración
      integrations.set(id, integration);
      integrationLogs.set(id, []);

      // Log de creación
      await this.addLog(id, 'REGISTER', 'SUCCESS', 'Integration registered successfully');

      return {
        success: true,
        data: integration,
        metadata: {
          timestamp: now,
          requestId: uuidv4()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to register integration',
          details: error
        }
      };
    }
  }

  /**
   * Configurar una integración existente
   */
  async configure(
    integrationId: string,
    settings: Partial<IntegrationConfig & { credentials?: Partial<IntegrationCredentials> }>
  ): Promise<OperationResult<Integration>> {
    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      // Actualizar configuración
      if (settings.baseUrl) integration.config.baseUrl = settings.baseUrl;
      if (settings.timeout) integration.config.timeout = settings.timeout;
      if (settings.retryAttempts) integration.config.retryAttempts = settings.retryAttempts;
      if (settings.retryDelay) integration.config.retryDelay = settings.retryDelay;
      if (settings.rateLimit) integration.config.rateLimit = settings.rateLimit;
      if (settings.proxy) integration.config.proxy = settings.proxy;
      if (settings.ssl) integration.config.ssl = settings.ssl;
      if (settings.customOptions) {
        integration.config.customOptions = {
          ...integration.config.customOptions,
          ...settings.customOptions
        };
      }

      // Actualizar credenciales si se proporcionan
      if (settings.credentials) {
        integration.credentials = {
          ...integration.credentials,
          ...settings.credentials
        };
      }

      integration.updatedAt = new Date();

      // Recrear instancia de Axios
      const axiosInstance = this.createAxiosInstance(integration);
      axiosInstances.set(integrationId, axiosInstance);

      // Log de configuración
      await this.addLog(integrationId, 'CONFIGURE', 'SUCCESS', 'Integration configured successfully');

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: error instanceof Error ? error.message : 'Failed to configure integration'
        }
      };
    }
  }

  /**
   * Probar conexión de una integración
   */
  async test(integrationId: string): Promise<OperationResult<{ connected: boolean; latency: number }>> {
    const startTime = Date.now();

    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      const axiosInstance = axiosInstances.get(integrationId);
      if (!axiosInstance) {
        return {
          success: false,
          error: {
            code: 'NO_INSTANCE',
            message: 'Axios instance not found for integration'
          }
        };
      }

      // Intentar conexión
      const testEndpoint = this.getTestEndpoint(integration.type);
      await axiosInstance.get(testEndpoint, { timeout: 10000 });

      const latency = Date.now() - startTime;

      // Actualizar estado
      integration.status = IntegrationStatus.ACTIVE;
      integration.errorCount = 0;
      integration.lastError = undefined;
      integration.updatedAt = new Date();

      // Log de test exitoso
      await this.addLog(integrationId, 'TEST', 'SUCCESS', `Connection test successful (${latency}ms)`);

      return {
        success: true,
        data: {
          connected: true,
          latency
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      const integration = integrations.get(integrationId);

      if (integration) {
        integration.status = IntegrationStatus.ERROR;
        integration.errorCount = (integration.errorCount || 0) + 1;
        integration.lastError = error instanceof Error ? error.message : 'Connection test failed';
        integration.updatedAt = new Date();
      }

      // Log de test fallido
      await this.addLog(
        integrationId,
        'TEST',
        'ERROR',
        error instanceof Error ? error.message : 'Connection test failed'
      );

      return {
        success: false,
        data: {
          connected: false,
          latency
        },
        error: {
          code: 'CONNECTION_ERROR',
          message: error instanceof Error ? error.message : 'Connection test failed'
        }
      };
    }
  }

  /**
   * Habilitar una integración
   */
  async enable(integrationId: string): Promise<OperationResult<Integration>> {
    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      // Verificar conexión antes de habilitar
      const testResult = await this.test(integrationId);
      if (!testResult.success || !testResult.data?.connected) {
        return {
          success: false,
          error: {
            code: 'CONNECTION_FAILED',
            message: 'Cannot enable integration: connection test failed'
          }
        };
      }

      integration.status = IntegrationStatus.ACTIVE;
      integration.updatedAt = new Date();

      await this.addLog(integrationId, 'ENABLE', 'SUCCESS', 'Integration enabled');

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ENABLE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to enable integration'
        }
      };
    }
  }

  /**
   * Deshabilitar una integración
   */
  async disable(integrationId: string): Promise<OperationResult<Integration>> {
    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      integration.status = IntegrationStatus.INACTIVE;
      integration.updatedAt = new Date();

      await this.addLog(integrationId, 'DISABLE', 'SUCCESS', 'Integration disabled');

      return {
        success: true,
        data: integration
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISABLE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to disable integration'
        }
      };
    }
  }

  /**
   * Obtener estado de una integración
   */
  async getStatus(integrationId: string): Promise<OperationResult<{
    integration: Integration;
    health: {
      status: string;
      lastCheck: Date;
      uptime: number;
      errorRate: number;
    };
  }>> {
    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      const logs = integrationLogs.get(integrationId) || [];
      const recentLogs = logs.filter(
        log => log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      const errorLogs = recentLogs.filter(log => log.status === 'ERROR');

      return {
        success: true,
        data: {
          integration,
          health: {
            status: integration.status,
            lastCheck: integration.updatedAt,
            uptime: this.calculateUptime(integrationId),
            errorRate: recentLogs.length > 0 ? (errorLogs.length / recentLogs.length) * 100 : 0
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATUS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get integration status'
        }
      };
    }
  }

  /**
   * Obtener todas las integraciones
   */
  async getIntegrations(filters?: QueryFilters): Promise<PaginatedResult<Integration>> {
    const allIntegrations = Array.from(integrations.values())
      .filter(i => i.tenantId === this.tenantId);

    let filtered = allIntegrations;

    // Aplicar filtros
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        i => i.name.toLowerCase().includes(search) ||
             i.description?.toLowerCase().includes(search) ||
             i.type.toLowerCase().includes(search)
      );
    }

    if (filters?.filters) {
      if (filters.filters.status) {
        filtered = filtered.filter(i => i.status === filters.filters!.status);
      }
      if (filters.filters.type) {
        filtered = filtered.filter(i => i.type === filters.filters!.type);
      }
    }

    // Ordenar
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[filters.sortBy!];
        const bVal = (b as Record<string, unknown>)[filters.sortBy!];
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    // Paginar
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
      hasNext: end < filtered.length,
      hasPrevious: page > 1
    };
  }

  /**
   * Obtener logs de una integración
   */
  async getIntegrationLogs(
    integrationId: string,
    filters?: QueryFilters
  ): Promise<PaginatedResult<IntegrationLog>> {
    const logs = integrationLogs.get(integrationId) || [];

    let filtered = [...logs];

    // Aplicar filtros de fecha
    if (filters?.dateFrom) {
      filtered = filtered.filter(l => l.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(l => l.timestamp <= filters.dateTo!);
    }

    // Filtrar por estado
    if (filters?.filters?.status) {
      filtered = filtered.filter(l => l.status === filters.filters!.status);
    }

    // Ordenar por fecha descendente
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Paginar
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      items,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
      hasNext: end < filtered.length,
      hasPrevious: page > 1
    };
  }

  /**
   * Ejecutar petición a través de la integración
   */
  async executeRequest<T>(
    integrationId: string,
    config: AxiosRequestConfig
  ): Promise<OperationResult<T>> {
    const startTime = Date.now();

    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      if (integration.status !== IntegrationStatus.ACTIVE) {
        return {
          success: false,
          error: {
            code: 'INACTIVE',
            message: 'Integration is not active'
          }
        };
      }

      const axiosInstance = axiosInstances.get(integrationId);
      if (!axiosInstance) {
        return {
          success: false,
          error: {
            code: 'NO_INSTANCE',
            message: 'HTTP client not initialized'
          }
        };
      }

      const response = await axiosInstance.request<T>(config);
      const duration = Date.now() - startTime;

      // Log exitoso
      await this.addLog(
        integrationId,
        config.method?.toUpperCase() || 'REQUEST',
        'SUCCESS',
        `Request to ${config.url} completed`,
        {
          request: {
            method: config.method || 'GET',
            url: config.url || '',
            headers: config.headers as Record<string, string>,
            body: config.data
          },
          response: {
            status: response.status,
            headers: response.headers as Record<string, string>,
            body: response.data
          },
          duration
        }
      );

      integration.lastSync = new Date();

      return {
        success: true,
        data: response.data,
        metadata: {
          duration,
          timestamp: new Date()
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      await this.addLog(
        integrationId,
        config.method?.toUpperCase() || 'REQUEST',
        'ERROR',
        error instanceof Error ? error.message : 'Request failed',
        {
          request: {
            method: config.method || 'GET',
            url: config.url || ''
          },
          duration
        }
      );

      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error instanceof Error ? error.message : 'Request failed',
          details: error
        },
        metadata: {
          duration
        }
      };
    }
  }

  /**
   * Eliminar una integración
   */
  async delete(integrationId: string): Promise<OperationResult<void>> {
    try {
      const integration = integrations.get(integrationId);
      if (!integration) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Integration ${integrationId} not found`
          }
        };
      }

      integrations.delete(integrationId);
      integrationLogs.delete(integrationId);
      axiosInstances.delete(integrationId);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete integration'
        }
      };
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Validar configuración
   */
  private validateConfig(
    config: IntegrationConfig,
    credentials: IntegrationCredentials
  ): OperationResult<void> {
    if (!config.baseUrl) {
      return {
        success: false,
        error: {
          code: 'INVALID_CONFIG',
          message: 'Base URL is required'
        }
      };
    }

    if (!credentials.authType) {
      return {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Authentication type is required'
        }
      };
    }

    // Validar credenciales según tipo
    switch (credentials.authType) {
      case AuthType.API_KEY:
        if (!credentials.apiKey) {
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'API Key is required for API_KEY authentication'
            }
          };
        }
        break;
      case AuthType.OAUTH2:
        if (!credentials.clientId || !credentials.clientSecret) {
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Client ID and Secret are required for OAuth2 authentication'
            }
          };
        }
        break;
      case AuthType.BASIC:
        if (!credentials.username || !credentials.password) {
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Username and password are required for Basic authentication'
            }
          };
        }
        break;
      case AuthType.CERTIFICATE:
        if (!credentials.certificate) {
          return {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Certificate is required for Certificate authentication'
            }
          };
        }
        break;
    }

    return { success: true };
  }

  /**
   * Crear instancia de Axios configurada
   */
  private createAxiosInstance(integration: Integration): AxiosInstance {
    const config: AxiosRequestConfig = {
      baseURL: integration.config.baseUrl,
      timeout: integration.config.timeout || 30000,
      headers: {}
    };

    // Configurar autenticación
    switch (integration.credentials.authType) {
      case AuthType.API_KEY:
        config.headers!['X-API-Key'] = integration.credentials.apiKey;
        break;
      case AuthType.BEARER:
        config.headers!['Authorization'] = `Bearer ${integration.credentials.accessToken}`;
        break;
      case AuthType.BASIC:
        const basicAuth = Buffer.from(
          `${integration.credentials.username}:${integration.credentials.password}`
        ).toString('base64');
        config.headers!['Authorization'] = `Basic ${basicAuth}`;
        break;
    }

    // Agregar headers personalizados
    if (integration.credentials.customHeaders) {
      Object.assign(config.headers!, integration.credentials.customHeaders);
    }

    // Configurar proxy
    if (integration.config.proxy) {
      config.proxy = {
        host: integration.config.proxy.host,
        port: integration.config.proxy.port,
        auth: integration.config.proxy.auth
      };
    }

    return axios.create(config);
  }

  /**
   * Obtener endpoint de prueba según tipo de integración
   */
  private getTestEndpoint(type: IntegrationType): string {
    const testEndpoints: Record<string, string> = {
      [IntegrationType.CRM_SALESFORCE]: '/services/data',
      [IntegrationType.CRM_HUBSPOT]: '/crm/v3/objects/contacts',
      [IntegrationType.ERP_SAP]: '/sap/opu/odata/sap',
      [IntegrationType.BANKING_OPEN_BANKING]: '/open-banking/v3.1/accounts',
      [IntegrationType.GOVERNMENT_AEAT_SII]: '/wlpl/SSII-FACT/ws/fe/SiiFactFEV1SOAP'
    };

    return testEndpoints[type] || '/health';
  }

  /**
   * Calcular uptime de la integración
   */
  private calculateUptime(integrationId: string): number {
    const logs = integrationLogs.get(integrationId) || [];
    if (logs.length === 0) return 100;

    const last24h = logs.filter(
      l => l.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    if (last24h.length === 0) return 100;

    const successLogs = last24h.filter(l => l.status === 'SUCCESS');
    return (successLogs.length / last24h.length) * 100;
  }

  /**
   * Agregar log de integración
   */
  private async addLog(
    integrationId: string,
    action: string,
    status: 'SUCCESS' | 'ERROR' | 'WARNING',
    message: string,
    details?: Partial<IntegrationLog>
  ): Promise<void> {
    const logs = integrationLogs.get(integrationId) || [];

    const log: IntegrationLog = {
      id: uuidv4(),
      integrationId,
      action,
      status,
      message,
      request: details?.request,
      response: details?.response,
      duration: details?.duration,
      timestamp: new Date()
    };

    logs.push(log);

    // Mantener solo últimos 1000 logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }

    integrationLogs.set(integrationId, logs);
  }
}

/**
 * Factory para crear instancia del servicio
 */
export function createIntegrationService(tenantId: string): IntegrationService {
  return new IntegrationService(tenantId);
}

export default IntegrationService;
