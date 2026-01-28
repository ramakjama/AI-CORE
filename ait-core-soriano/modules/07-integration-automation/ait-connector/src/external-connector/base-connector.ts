/**
 * AIT-CONNECTOR - Base External Connector
 * Abstract base class for all external connectors
 */

import {
  ExternalConnector,
  ConnectorType,
  ConnectorConfig,
  ConnectorCredentials,
  ConnectionStatus,
  Logger
} from '../types';
import { EventEmitter } from 'events';

export abstract class BaseConnector extends EventEmitter implements ExternalConnector {
  public id: string;
  public name: string;
  public type: ConnectorType;
  public provider: string;
  public version: string;
  public config: ConnectorConfig;
  public credentials?: ConnectorCredentials;
  public status: ConnectionStatus;
  protected logger: Logger;

  constructor(
    id: string,
    name: string,
    type: ConnectorType,
    provider: string,
    version: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super();
    this.id = id;
    this.name = name;
    this.type = type;
    this.provider = provider;
    this.version = version;
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config
    };
    this.credentials = credentials;
    this.status = ConnectionStatus.DISCONNECTED;
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Initialize the connector
   */
  async initialize(): Promise<void> {
    this.logger.info(`Initializing connector: ${this.name}`);

    // Validate configuration
    this.validateConfig();

    // Validate credentials
    if (this.credentials) {
      this.validateCredentials();
    }

    await this.onInitialize();
  }

  /**
   * Connect to the external service
   */
  async connect(): Promise<void> {
    if (this.status === ConnectionStatus.CONNECTED) {
      this.logger.warn(`Connector ${this.name} is already connected`);
      return;
    }

    try {
      this.status = ConnectionStatus.CONNECTING;
      this.emit('connecting', { connectorId: this.id });

      await this.onConnect();

      this.status = ConnectionStatus.CONNECTED;
      this.emit('connected', { connectorId: this.id });
      this.logger.info(`Connected to ${this.name}`);
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      this.emit('error', { connectorId: this.id, error });
      this.logger.error(`Failed to connect to ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Disconnect from the external service
   */
  async disconnect(): Promise<void> {
    if (this.status === ConnectionStatus.DISCONNECTED) {
      return;
    }

    try {
      await this.onDisconnect();

      this.status = ConnectionStatus.DISCONNECTED;
      this.emit('disconnected', { connectorId: this.id });
      this.logger.info(`Disconnected from ${this.name}`);
    } catch (error) {
      this.logger.error(`Error disconnecting from ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Perform health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.status !== ConnectionStatus.CONNECTED) {
        return false;
      }

      const healthy = await this.onHealthCheck();
      this.emit('health-check', { connectorId: this.id, healthy });

      return healthy;
    } catch (error) {
      this.logger.error(`Health check failed for ${this.name}:`, error);
      return false;
    }
  }

  /**
   * Execute an action on the external service
   */
  async execute(action: string, params: any): Promise<any> {
    if (this.status !== ConnectionStatus.CONNECTED) {
      throw new Error(`Connector ${this.name} is not connected`);
    }

    try {
      this.logger.debug(`Executing action ${action} on ${this.name}`, params);

      const startTime = Date.now();
      const result = await this.onExecute(action, params);
      const duration = Date.now() - startTime;

      this.emit('action-executed', {
        connectorId: this.id,
        action,
        duration,
        success: true
      });

      return result;
    } catch (error) {
      this.emit('action-failed', {
        connectorId: this.id,
        action,
        error
      });

      this.logger.error(`Action ${action} failed on ${this.name}:`, error);
      throw error;
    }
  }

  /**
   * Retry a failed operation
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries ?? this.config.retries ?? 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.warn(
            `Retry attempt ${attempt + 1}/${retries} after ${delay}ms`
          );
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate configuration
   */
  protected validateConfig(): void {
    if (this.config.timeout && this.config.timeout < 0) {
      throw new Error('Timeout must be positive');
    }

    if (this.config.retries && this.config.retries < 0) {
      throw new Error('Retries must be non-negative');
    }
  }

  /**
   * Validate credentials
   */
  protected validateCredentials(): void {
    if (!this.credentials) {
      throw new Error('Credentials are required');
    }

    switch (this.credentials.type) {
      case 'api-key':
        if (!this.credentials.apiKey) {
          throw new Error('API key is required');
        }
        break;
      case 'oauth2':
        if (!this.credentials.clientId || !this.credentials.clientSecret) {
          throw new Error('OAuth2 client ID and secret are required');
        }
        break;
      case 'basic':
        if (!this.credentials.username || !this.credentials.password) {
          throw new Error('Username and password are required');
        }
        break;
      case 'bearer':
        if (!this.credentials.token) {
          throw new Error('Bearer token is required');
        }
        break;
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): Logger {
    return {
      debug: (message: string, ...meta: any[]) => console.debug(message, ...meta),
      info: (message: string, ...meta: any[]) => console.info(message, ...meta),
      warn: (message: string, ...meta: any[]) => console.warn(message, ...meta),
      error: (message: string, ...meta: any[]) => console.error(message, ...meta)
    };
  }

  // Abstract methods to be implemented by subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract onConnect(): Promise<void>;
  protected abstract onDisconnect(): Promise<void>;
  protected abstract onHealthCheck(): Promise<boolean>;
  protected abstract onExecute(action: string, params: any): Promise<any>;
}

export default BaseConnector;
