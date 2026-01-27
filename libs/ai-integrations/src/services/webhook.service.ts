/**
 * Webhook Service
 * Gestión de webhooks para notificaciones en tiempo real
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  Webhook,
  WebhookEvent,
  WebhookDelivery,
  WebhookLog,
  WebhookFilter,
  RetryPolicy,
  DeliveryStatus,
  OperationResult,
  PaginatedResult,
  QueryFilters
} from '../types';

/**
 * Almacenamiento en memoria (reemplazar por base de datos en producción)
 */
const webhooks: Map<string, Webhook> = new Map();
const deliveries: Map<string, WebhookDelivery[]> = new Map();
const webhookLogs: Map<string, WebhookLog[]> = new Map();

/**
 * Cola de reintentos
 */
const retryQueue: Map<string, NodeJS.Timeout> = new Map();

/**
 * Configuración por defecto de política de reintentos
 */
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  retryDelay: 60, // segundos
  backoffMultiplier: 2,
  maxDelay: 3600 // 1 hora
};

/**
 * Servicio de Webhooks
 */
export class WebhookService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Registrar un nuevo webhook
   */
  async register(
    events: WebhookEvent[],
    url: string,
    secret: string,
    options?: {
      name?: string;
      description?: string;
      headers?: Record<string, string>;
      retryPolicy?: Partial<RetryPolicy>;
      filters?: WebhookFilter[];
    }
  ): Promise<OperationResult<Webhook>> {
    try {
      // Validar URL
      if (!this.isValidUrl(url)) {
        return {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Invalid webhook URL'
          }
        };
      }

      // Validar eventos
      if (!events || events.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_EVENTS',
            message: 'At least one event is required'
          }
        };
      }

      const id = uuidv4();
      const now = new Date();

      const webhook: Webhook = {
        id,
        name: options?.name || `Webhook ${id.substring(0, 8)}`,
        description: options?.description,
        url,
        secret,
        events,
        headers: options?.headers,
        enabled: true,
        retryPolicy: {
          ...DEFAULT_RETRY_POLICY,
          ...options?.retryPolicy
        },
        filters: options?.filters,
        createdAt: now,
        updatedAt: now,
        tenantId: this.tenantId
      };

      webhooks.set(id, webhook);
      deliveries.set(id, []);
      webhookLogs.set(id, []);

      return {
        success: true,
        data: webhook
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to register webhook'
        }
      };
    }
  }

  /**
   * Actualizar configuración de webhook
   */
  async update(
    webhookId: string,
    config: Partial<{
      name: string;
      description: string;
      url: string;
      events: WebhookEvent[];
      headers: Record<string, string>;
      enabled: boolean;
      retryPolicy: Partial<RetryPolicy>;
      filters: WebhookFilter[];
    }>
  ): Promise<OperationResult<Webhook>> {
    try {
      const webhook = webhooks.get(webhookId);
      if (!webhook) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Webhook ${webhookId} not found`
          }
        };
      }

      // Validar URL si se proporciona
      if (config.url && !this.isValidUrl(config.url)) {
        return {
          success: false,
          error: {
            code: 'INVALID_URL',
            message: 'Invalid webhook URL'
          }
        };
      }

      // Actualizar campos
      if (config.name) webhook.name = config.name;
      if (config.description !== undefined) webhook.description = config.description;
      if (config.url) webhook.url = config.url;
      if (config.events) webhook.events = config.events;
      if (config.headers) webhook.headers = config.headers;
      if (config.enabled !== undefined) webhook.enabled = config.enabled;
      if (config.retryPolicy) {
        webhook.retryPolicy = {
          ...webhook.retryPolicy,
          ...config.retryPolicy
        };
      }
      if (config.filters) webhook.filters = config.filters;

      webhook.updatedAt = new Date();

      return {
        success: true,
        data: webhook
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to update webhook'
        }
      };
    }
  }

  /**
   * Eliminar webhook
   */
  async delete(webhookId: string): Promise<OperationResult<void>> {
    try {
      const webhook = webhooks.get(webhookId);
      if (!webhook) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Webhook ${webhookId} not found`
          }
        };
      }

      // Cancelar reintentos pendientes
      const webhookDeliveries = deliveries.get(webhookId) || [];
      for (const delivery of webhookDeliveries) {
        const timeout = retryQueue.get(delivery.id);
        if (timeout) {
          clearTimeout(timeout);
          retryQueue.delete(delivery.id);
        }
      }

      webhooks.delete(webhookId);
      deliveries.delete(webhookId);
      webhookLogs.delete(webhookId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to delete webhook'
        }
      };
    }
  }

  /**
   * Disparar evento de webhook
   */
  async trigger(
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<OperationResult<{ triggered: number; failed: number }>> {
    try {
      const matchingWebhooks = Array.from(webhooks.values()).filter(w =>
        w.enabled &&
        w.tenantId === this.tenantId &&
        w.events.includes(event) &&
        this.matchesFilters(payload, w.filters)
      );

      let triggered = 0;
      let failed = 0;

      const deliveryPromises = matchingWebhooks.map(async webhook => {
        const result = await this.deliverWebhook(webhook, event, payload);
        if (result.success) {
          triggered++;
        } else {
          failed++;
        }
      });

      await Promise.all(deliveryPromises);

      return {
        success: true,
        data: { triggered, failed }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TRIGGER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to trigger webhooks'
        }
      };
    }
  }

  /**
   * Reintentar entrega fallida
   */
  async retryDelivery(deliveryId: string): Promise<OperationResult<WebhookDelivery>> {
    try {
      // Buscar entrega
      let foundDelivery: WebhookDelivery | undefined;
      let webhookId: string | undefined;

      for (const [wId, dels] of deliveries) {
        const delivery = dels.find(d => d.id === deliveryId);
        if (delivery) {
          foundDelivery = delivery;
          webhookId = wId;
          break;
        }
      }

      if (!foundDelivery || !webhookId) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Delivery ${deliveryId} not found`
          }
        };
      }

      if (foundDelivery.status === DeliveryStatus.DELIVERED) {
        return {
          success: false,
          error: {
            code: 'ALREADY_DELIVERED',
            message: 'Webhook was already delivered successfully'
          }
        };
      }

      const webhook = webhooks.get(webhookId);
      if (!webhook) {
        return {
          success: false,
          error: {
            code: 'WEBHOOK_NOT_FOUND',
            message: 'Associated webhook not found'
          }
        };
      }

      // Ejecutar entrega
      const result = await this.executeDelivery(
        webhook,
        foundDelivery.event,
        foundDelivery.payload,
        foundDelivery
      );

      return {
        success: result.success,
        data: foundDelivery,
        error: result.error
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RETRY_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retry delivery'
        }
      };
    }
  }

  /**
   * Obtener historial de entregas
   */
  async getDeliveryHistory(
    webhookId: string,
    filters?: QueryFilters
  ): Promise<PaginatedResult<WebhookDelivery>> {
    const webhookDeliveries = deliveries.get(webhookId) || [];

    let filtered = [...webhookDeliveries];

    // Filtrar por fecha
    if (filters?.dateFrom) {
      filtered = filtered.filter(d => d.createdAt >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(d => d.createdAt <= filters.dateTo!);
    }

    // Filtrar por estado
    if (filters?.filters?.status) {
      filtered = filtered.filter(d => d.status === filters.filters!.status);
    }

    // Filtrar por evento
    if (filters?.filters?.event) {
      filtered = filtered.filter(d => d.event === filters.filters!.event);
    }

    // Ordenar por fecha descendente
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginar
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
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
   * Verificar firma de webhook
   */
  verifySignature(
    payload: string | Record<string, unknown>,
    signature: string,
    secret: string
  ): boolean {
    try {
      const payloadString = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload);

      const expectedSignature = this.generateSignature(payloadString, secret);

      // Comparación segura para evitar timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Obtener webhook por ID
   */
  async getWebhook(webhookId: string): Promise<OperationResult<Webhook>> {
    const webhook = webhooks.get(webhookId);
    if (!webhook) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Webhook ${webhookId} not found`
        }
      };
    }

    return {
      success: true,
      data: webhook
    };
  }

  /**
   * Obtener todos los webhooks
   */
  async getWebhooks(filters?: QueryFilters): Promise<PaginatedResult<Webhook>> {
    const allWebhooks = Array.from(webhooks.values())
      .filter(w => w.tenantId === this.tenantId);

    let filtered = allWebhooks;

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        w => w.name.toLowerCase().includes(search) ||
             w.description?.toLowerCase().includes(search) ||
             w.url.toLowerCase().includes(search)
      );
    }

    if (filters?.filters?.enabled !== undefined) {
      filtered = filtered.filter(w => w.enabled === filters.filters!.enabled);
    }

    if (filters?.filters?.event) {
      filtered = filtered.filter(w => w.events.includes(filters.filters!.event as WebhookEvent));
    }

    // Ordenar
    filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

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
   * Obtener logs de webhook
   */
  async getWebhookLogs(
    webhookId: string,
    filters?: QueryFilters
  ): Promise<PaginatedResult<WebhookLog>> {
    const logs = webhookLogs.get(webhookId) || [];

    let filtered = [...logs];

    if (filters?.dateFrom) {
      filtered = filtered.filter(l => l.timestamp >= filters.dateFrom!);
    }
    if (filters?.dateTo) {
      filtered = filtered.filter(l => l.timestamp <= filters.dateTo!);
    }

    if (filters?.filters?.success !== undefined) {
      filtered = filtered.filter(l => l.success === filters.filters!.success);
    }

    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

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
   * Test webhook (enviar ping)
   */
  async testWebhook(webhookId: string): Promise<OperationResult<{
    success: boolean;
    statusCode?: number;
    latency: number;
  }>> {
    const startTime = Date.now();

    try {
      const webhook = webhooks.get(webhookId);
      if (!webhook) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Webhook ${webhookId} not found`
          }
        };
      }

      const testPayload = {
        event: 'webhook.test',
        timestamp: new Date().toISOString(),
        webhookId,
        test: true
      };

      const signature = this.generateSignature(JSON.stringify(testPayload), webhook.secret);

      const response = await axios.post(webhook.url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': 'webhook.test',
          ...webhook.headers
        },
        timeout: 10000,
        validateStatus: () => true
      });

      const latency = Date.now() - startTime;

      return {
        success: response.status >= 200 && response.status < 300,
        data: {
          success: response.status >= 200 && response.status < 300,
          statusCode: response.status,
          latency
        }
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        success: false,
        data: {
          success: false,
          latency
        },
        error: {
          code: 'TEST_ERROR',
          message: error instanceof Error ? error.message : 'Test failed'
        }
      };
    }
  }

  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================

  /**
   * Validar URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Verificar si payload cumple con filtros
   */
  private matchesFilters(
    payload: Record<string, unknown>,
    filters?: WebhookFilter[]
  ): boolean {
    if (!filters || filters.length === 0) return true;

    return filters.every(filter => {
      const value = this.getNestedValue(payload, filter.field);

      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'neq':
          return value !== filter.value;
        case 'contains':
          return typeof value === 'string' &&
                 typeof filter.value === 'string' &&
                 value.includes(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        default:
          return true;
      }
    });
  }

  /**
   * Entregar webhook
   */
  private async deliverWebhook(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, unknown>
  ): Promise<OperationResult<WebhookDelivery>> {
    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: webhook.id,
      event,
      payload,
      status: DeliveryStatus.PENDING,
      attempts: 0,
      createdAt: new Date()
    };

    // Guardar entrega
    const webhookDeliveries = deliveries.get(webhook.id) || [];
    webhookDeliveries.push(delivery);
    deliveries.set(webhook.id, webhookDeliveries);

    return this.executeDelivery(webhook, event, payload, delivery);
  }

  /**
   * Ejecutar entrega de webhook
   */
  private async executeDelivery(
    webhook: Webhook,
    event: WebhookEvent,
    payload: Record<string, unknown>,
    delivery: WebhookDelivery
  ): Promise<OperationResult<WebhookDelivery>> {
    const startTime = Date.now();

    try {
      delivery.attempts++;
      delivery.lastAttempt = new Date();
      delivery.status = DeliveryStatus.PENDING;

      const body = JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data: payload
      });

      const signature = this.generateSignature(body, webhook.secret);

      const response = await axios.post(webhook.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-Delivery': delivery.id,
          'X-Webhook-Timestamp': new Date().toISOString(),
          ...webhook.headers
        },
        timeout: 30000,
        validateStatus: () => true
      });

      const duration = Date.now() - startTime;

      // Guardar log
      await this.addLog(webhook.id, delivery.id, event, {
        method: 'POST',
        url: webhook.url,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event
        },
        body
      }, {
        status: response.status,
        headers: response.headers as Record<string, string>,
        body: typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data)
      }, duration, response.status >= 200 && response.status < 300);

      if (response.status >= 200 && response.status < 300) {
        delivery.status = DeliveryStatus.DELIVERED;
        delivery.response = {
          status: response.status,
          body: typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data),
          headers: response.headers as Record<string, string>
        };

        return {
          success: true,
          data: delivery
        };
      } else {
        // Programar reintento si es necesario
        await this.scheduleRetry(webhook, delivery);

        return {
          success: false,
          data: delivery,
          error: {
            code: 'DELIVERY_FAILED',
            message: `HTTP ${response.status}`
          }
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      delivery.error = error instanceof Error ? error.message : 'Delivery failed';
      delivery.status = DeliveryStatus.FAILED;

      await this.addLog(webhook.id, delivery.id, event, {
        method: 'POST',
        url: webhook.url,
        headers: {},
        body: JSON.stringify(payload)
      }, undefined, duration, false, delivery.error);

      // Programar reintento
      await this.scheduleRetry(webhook, delivery);

      return {
        success: false,
        data: delivery,
        error: {
          code: 'DELIVERY_ERROR',
          message: delivery.error
        }
      };
    }
  }

  /**
   * Programar reintento de entrega
   */
  private async scheduleRetry(
    webhook: Webhook,
    delivery: WebhookDelivery
  ): Promise<void> {
    const retryPolicy = webhook.retryPolicy || DEFAULT_RETRY_POLICY;

    if (delivery.attempts >= retryPolicy.maxRetries) {
      delivery.status = DeliveryStatus.FAILED;
      return;
    }

    delivery.status = DeliveryStatus.RETRYING;

    // Calcular delay con backoff exponencial
    let delay = retryPolicy.retryDelay * Math.pow(
      retryPolicy.backoffMultiplier || 2,
      delivery.attempts - 1
    );

    if (retryPolicy.maxDelay) {
      delay = Math.min(delay, retryPolicy.maxDelay);
    }

    delivery.nextRetry = new Date(Date.now() + delay * 1000);

    // Programar reintento
    const timeout = setTimeout(async () => {
      retryQueue.delete(delivery.id);
      await this.executeDelivery(webhook, delivery.event, delivery.payload, delivery);
    }, delay * 1000);

    retryQueue.set(delivery.id, timeout);
  }

  /**
   * Generar firma HMAC
   */
  private generateSignature(payload: string, secret: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `${timestamp}.${payload}`;

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(signaturePayload);

    return `t=${timestamp},v1=${hmac.digest('hex')}`;
  }

  /**
   * Agregar log de webhook
   */
  private async addLog(
    webhookId: string,
    deliveryId: string,
    event: WebhookEvent,
    request: {
      method: string;
      url: string;
      headers: Record<string, string>;
      body: string;
    },
    response?: {
      status: number;
      headers?: Record<string, string>;
      body?: string;
    },
    duration?: number,
    success?: boolean,
    error?: string
  ): Promise<void> {
    const logs = webhookLogs.get(webhookId) || [];

    logs.push({
      id: uuidv4(),
      webhookId,
      deliveryId,
      event,
      request,
      response,
      duration: duration || 0,
      success: success || false,
      error,
      timestamp: new Date()
    });

    // Mantener solo últimos 500 logs
    if (logs.length > 500) {
      logs.splice(0, logs.length - 500);
    }

    webhookLogs.set(webhookId, logs);
  }

  /**
   * Obtener valor anidado de objeto
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}

/**
 * Factory para crear instancia del servicio
 */
export function createWebhookService(tenantId: string): WebhookService {
  return new WebhookService(tenantId);
}

export default WebhookService;
