import { DatabaseName, DatabaseConfig, DATABASE_DOMAINS } from './types';

const clients: Map<DatabaseName, unknown> = new Map();

export class DatabaseManager {
  private static instance: DatabaseManager;
  
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async getClient<T>(name: DatabaseName): Promise<T> {
    if (!clients.has(name)) {
      const client = await this.initClient(name);
      clients.set(name, client);
    }
    return clients.get(name) as T;
  }

  private async initClient(name: DatabaseName): Promise<unknown> {
    const envVar = name.toUpperCase() + '_DATABASE_URL';
    const url = process.env[envVar];
    if (!url) throw new Error('Missing: ' + envVar);
    const mod = await import('./clients/' + name.replace(/_/g, '-'));
    return mod.createClient(url);
  }

  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const domain of Object.values(DATABASE_DOMAINS)) {
      for (const db of domain) {
        try {
          const client = await this.getClient(db as DatabaseName);
          await (client as any).$queryRaw\`SELECT 1\`;
          results[db] = true;
        } catch { results[db] = false; }
      }
    }
    return results;
  }
}

export const getDatabase = () => DatabaseManager.getInstance();
export const getAllDatabases = (): DatabaseName[] => Object.values(DATABASE_DOMAINS).flat() as DatabaseName[];
