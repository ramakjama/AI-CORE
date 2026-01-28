/**
 * AIT-CONNECTOR - Connector Factory
 * Factory for creating and managing external connectors
 */

import {
  ExternalConnector,
  ConnectorType,
  ConnectorConfig,
  ConnectorCredentials,
  ConnectorFactory as IConnectorFactory,
  ConnectorInfo,
  Logger
} from '../types';
import { BaseConnector } from './base-connector';

type ConnectorConstructor = new (
  id: string,
  config: ConnectorConfig,
  credentials?: ConnectorCredentials,
  logger?: Logger
) => ExternalConnector;

export class ConnectorFactory implements IConnectorFactory {
  private connectors: Map<string, ConnectorConstructor> = new Map();
  private connectorInfo: Map<string, ConnectorInfo> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Register a connector
   */
  register(provider: string, connectorClass: ConnectorConstructor, info?: ConnectorInfo): void {
    if (this.connectors.has(provider)) {
      throw new Error(`Connector for provider '${provider}' is already registered`);
    }

    this.connectors.set(provider, connectorClass);

    if (info) {
      this.connectorInfo.set(provider, info);
    }

    this.logger.info(`Registered connector: ${provider}`);
  }

  /**
   * Create a connector instance
   */
  create(
    type: ConnectorType,
    provider: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ): ExternalConnector {
    const ConnectorClass = this.connectors.get(provider);

    if (!ConnectorClass) {
      throw new Error(`Connector for provider '${provider}' not found`);
    }

    const id = this.generateConnectorId(provider);
    const connector = new ConnectorClass(id, config, credentials, logger || this.logger);

    this.logger.info(`Created connector instance: ${provider} (${id})`);

    return connector;
  }

  /**
   * List all registered connectors
   */
  list(type?: ConnectorType): ConnectorInfo[] {
    const infos = Array.from(this.connectorInfo.values());

    if (type) {
      return infos.filter(info => info.type === type);
    }

    return infos;
  }

  /**
   * Get connector info
   */
  getInfo(provider: string): ConnectorInfo | undefined {
    return this.connectorInfo.get(provider);
  }

  /**
   * Check if connector is registered
   */
  has(provider: string): boolean {
    return this.connectors.has(provider);
  }

  /**
   * Unregister a connector
   */
  unregister(provider: string): void {
    this.connectors.delete(provider);
    this.connectorInfo.delete(provider);
    this.logger.info(`Unregistered connector: ${provider}`);
  }

  /**
   * Get registered connector count
   */
  count(): number {
    return this.connectors.size;
  }

  /**
   * Generate unique connector ID
   */
  private generateConnectorId(provider: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${provider}-${timestamp}-${random}`;
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
}

// Singleton instance
let factoryInstance: ConnectorFactory | null = null;

export function getConnectorFactory(logger?: Logger): ConnectorFactory {
  if (!factoryInstance) {
    factoryInstance = new ConnectorFactory(logger);
  }
  return factoryInstance;
}

export default ConnectorFactory;
