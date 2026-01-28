/**
 * AIT-CONNECTOR - Storage Connectors
 * Connectors for cloud storage platforms (AWS S3, Azure Blob, Google Cloud Storage, Dropbox, etc.)
 */

import { BaseConnector } from '../base-connector';
import { ConnectorType, ConnectorConfig, ConnectorCredentials, Logger } from '../../types';
import axios, { AxiosInstance } from 'axios';

/**
 * AWS S3 Connector
 */
export class AWSS3Connector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'AWS S3', ConnectorType.STORAGE, 'aws-s3', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    const region = this.config.custom?.region || 'us-east-1';
    this.client = axios.create({
      baseURL: `https://s3.${region}.amazonaws.com`,
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    // AWS SDK would handle authentication, but for REST API we'll use signed requests
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // List buckets to verify connection
      const bucket = this.config.custom?.bucket;
      if (bucket) {
        await this.client.head(`/${bucket}`);
      }
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'uploadFile':
        return this.uploadFile(params);
      case 'downloadFile':
        return this.downloadFile(params);
      case 'deleteFile':
        return this.deleteFile(params);
      case 'listFiles':
        return this.listFiles(params);
      case 'getFileUrl':
        return this.getFileUrl(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async uploadFile(params: { bucket: string; key: string; body: any; contentType?: string }): Promise<any> {
    const response = await this.client!.put(`/${params.bucket}/${params.key}`, params.body, {
      headers: {
        'Content-Type': params.contentType || 'application/octet-stream'
      }
    });
    return { success: true, etag: response.headers.etag };
  }

  private async downloadFile(params: { bucket: string; key: string }): Promise<any> {
    const response = await this.client!.get(`/${params.bucket}/${params.key}`);
    return response.data;
  }

  private async deleteFile(params: { bucket: string; key: string }): Promise<any> {
    await this.client!.delete(`/${params.bucket}/${params.key}`);
    return { success: true };
  }

  private async listFiles(params: { bucket: string; prefix?: string; maxKeys?: number }): Promise<any> {
    const response = await this.client!.get(`/${params.bucket}`, {
      params: {
        prefix: params.prefix,
        'max-keys': params.maxKeys || 1000
      }
    });
    return response.data;
  }

  private getFileUrl(params: { bucket: string; key: string; expiresIn?: number }): string {
    const region = this.config.custom?.region || 'us-east-1';
    return `https://${params.bucket}.s3.${region}.amazonaws.com/${params.key}`;
  }
}

/**
 * Azure Blob Storage Connector
 */
export class AzureBlobConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Azure Blob Storage', ConnectorType.STORAGE, 'azure-blob', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    const accountName = this.credentials?.custom?.accountName;
    this.client = axios.create({
      baseURL: `https://${accountName}.blob.core.windows.net`,
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // Use shared key authentication
    // In production, you would generate proper Azure Blob Storage signatures
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/?comp=list');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'uploadBlob':
        return this.uploadBlob(params);
      case 'downloadBlob':
        return this.downloadBlob(params);
      case 'deleteBlob':
        return this.deleteBlob(params);
      case 'listBlobs':
        return this.listBlobs(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async uploadBlob(params: { container: string; blob: string; data: any }): Promise<any> {
    const response = await this.client!.put(`/${params.container}/${params.blob}`, params.data, {
      headers: {
        'x-ms-blob-type': 'BlockBlob'
      }
    });
    return { success: true };
  }

  private async downloadBlob(params: { container: string; blob: string }): Promise<any> {
    const response = await this.client!.get(`/${params.container}/${params.blob}`);
    return response.data;
  }

  private async deleteBlob(params: { container: string; blob: string }): Promise<any> {
    await this.client!.delete(`/${params.container}/${params.blob}`);
    return { success: true };
  }

  private async listBlobs(params: { container: string; prefix?: string }): Promise<any> {
    const response = await this.client!.get(`/${params.container}`, {
      params: {
        restype: 'container',
        comp: 'list',
        prefix: params.prefix
      }
    });
    return response.data;
  }
}

/**
 * Google Cloud Storage Connector
 */
export class GoogleCloudStorageConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Google Cloud Storage', ConnectorType.STORAGE, 'gcs', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://storage.googleapis.com',
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    // OAuth2 authentication with service account
    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.credentials?.token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/storage/v1/b');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'uploadObject':
        return this.uploadObject(params);
      case 'downloadObject':
        return this.downloadObject(params);
      case 'deleteObject':
        return this.deleteObject(params);
      case 'listObjects':
        return this.listObjects(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async uploadObject(params: { bucket: string; object: string; data: any }): Promise<any> {
    const response = await this.client!.post(
      `/upload/storage/v1/b/${params.bucket}/o?uploadType=media&name=${params.object}`,
      params.data
    );
    return response.data;
  }

  private async downloadObject(params: { bucket: string; object: string }): Promise<any> {
    const response = await this.client!.get(
      `/storage/v1/b/${params.bucket}/o/${params.object}?alt=media`
    );
    return response.data;
  }

  private async deleteObject(params: { bucket: string; object: string }): Promise<any> {
    await this.client!.delete(`/storage/v1/b/${params.bucket}/o/${params.object}`);
    return { success: true };
  }

  private async listObjects(params: { bucket: string; prefix?: string }): Promise<any> {
    const response = await this.client!.get(`/storage/v1/b/${params.bucket}/o`, {
      params: { prefix: params.prefix }
    });
    return response.data;
  }
}

/**
 * Dropbox Connector
 */
export class DropboxConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'Dropbox', ConnectorType.STORAGE, 'dropbox', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://api.dropboxapi.com/2',
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.credentials?.token}`
      }
    });
  }

  protected async onConnect(): Promise<void> {
    // No explicit connection needed
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.post('/users/get_current_account');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'uploadFile':
        return this.uploadFile(params);
      case 'downloadFile':
        return this.downloadFile(params);
      case 'deleteFile':
        return this.deleteFile(params);
      case 'listFolder':
        return this.listFolder(params);
      case 'createFolder':
        return this.createFolder(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async uploadFile(params: { path: string; contents: any }): Promise<any> {
    const uploadClient = axios.create({
      baseURL: 'https://content.dropboxapi.com/2',
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.credentials?.token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: params.path,
          mode: 'add',
          autorename: true
        })
      }
    });

    const response = await uploadClient.post('/files/upload', params.contents);
    return response.data;
  }

  private async downloadFile(params: { path: string }): Promise<any> {
    const downloadClient = axios.create({
      baseURL: 'https://content.dropboxapi.com/2',
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.credentials?.token}`,
        'Dropbox-API-Arg': JSON.stringify({ path: params.path })
      }
    });

    const response = await downloadClient.post('/files/download');
    return response.data;
  }

  private async deleteFile(params: { path: string }): Promise<any> {
    const response = await this.client!.post('/files/delete_v2', { path: params.path });
    return response.data;
  }

  private async listFolder(params: { path: string }): Promise<any> {
    const response = await this.client!.post('/files/list_folder', { path: params.path });
    return response.data;
  }

  private async createFolder(params: { path: string }): Promise<any> {
    const response = await this.client!.post('/files/create_folder_v2', { path: params.path });
    return response.data;
  }
}

/**
 * OneDrive Connector
 */
export class OneDriveConnector extends BaseConnector {
  private client?: AxiosInstance;

  constructor(
    id: string,
    config: ConnectorConfig,
    credentials?: ConnectorCredentials,
    logger?: Logger
  ) {
    super(id, 'OneDrive', ConnectorType.STORAGE, 'onedrive', '1.0.0', config, credentials, logger);
  }

  protected async onInitialize(): Promise<void> {
    this.client = axios.create({
      baseURL: 'https://graph.microsoft.com/v1.0',
      timeout: this.config.timeout
    });
  }

  protected async onConnect(): Promise<void> {
    if (!this.client) throw new Error('Client not initialized');

    this.client.defaults.headers.common['Authorization'] = `Bearer ${this.credentials?.token}`;
  }

  protected async onDisconnect(): Promise<void> {
    // No explicit disconnect needed
  }

  protected async onHealthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      await this.client.get('/me/drive');
      return true;
    } catch {
      return false;
    }
  }

  protected async onExecute(action: string, params: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');

    switch (action) {
      case 'uploadFile':
        return this.uploadFile(params);
      case 'downloadFile':
        return this.downloadFile(params);
      case 'deleteFile':
        return this.deleteFile(params);
      case 'listFiles':
        return this.listFiles(params);
      case 'createFolder':
        return this.createFolder(params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  private async uploadFile(params: { path: string; content: any }): Promise<any> {
    const response = await this.client!.put(`/me/drive/root:/${params.path}:/content`, params.content);
    return response.data;
  }

  private async downloadFile(params: { itemId: string }): Promise<any> {
    const response = await this.client!.get(`/me/drive/items/${params.itemId}/content`);
    return response.data;
  }

  private async deleteFile(params: { itemId: string }): Promise<any> {
    await this.client!.delete(`/me/drive/items/${params.itemId}`);
    return { success: true };
  }

  private async listFiles(params: { folderId?: string }): Promise<any> {
    const path = params.folderId
      ? `/me/drive/items/${params.folderId}/children`
      : '/me/drive/root/children';
    const response = await this.client!.get(path);
    return response.data;
  }

  private async createFolder(params: { name: string; parentId?: string }): Promise<any> {
    const path = params.parentId
      ? `/me/drive/items/${params.parentId}/children`
      : '/me/drive/root/children';

    const response = await this.client!.post(path, {
      name: params.name,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename'
    });
    return response.data;
  }
}
