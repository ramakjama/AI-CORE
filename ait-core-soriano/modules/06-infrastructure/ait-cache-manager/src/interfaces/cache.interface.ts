export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  encrypt?: boolean;
  tags?: string[];
  namespace?: string;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
  compressed: boolean;
  encrypted: boolean;
  size: number;
  hits: number;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: number;
  evictions: number;
}

export interface InvalidationStrategy {
  pattern?: string;
  tags?: string[];
  keys?: string[];
  namespace?: string;
}

export interface CacheLayer {
  name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(pattern?: string): Promise<number>;
  has(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  stats(): Promise<CacheStats>;
}

export enum CacheLevel {
  L1 = 'memory',
  L2 = 'redis',
  L3 = 'cdn',
}

export interface WarmupStrategy {
  name: string;
  keys: string[];
  priority: number;
  loader: () => Promise<Map<string, any>>;
}
