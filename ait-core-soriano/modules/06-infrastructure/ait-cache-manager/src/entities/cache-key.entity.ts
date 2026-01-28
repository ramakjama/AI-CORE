export class CacheKey {
  id: string;
  key: string;
  namespace: string;
  tags: string[];
  ttl: number;
  compressed: boolean;
  encrypted: boolean;
  size: number;
  hits: number;
  lastAccessed: Date;
  createdAt: Date;
  expiresAt: Date;
}

export class CacheInvalidation {
  id: string;
  pattern: string;
  tags: string[];
  namespace: string;
  keysInvalidated: number;
  reason: string;
  userId: string;
  createdAt: Date;
}

export class CacheStat {
  id: string;
  timestamp: Date;
  layer: string;
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: number;
  evictions: number;
  avgResponseTime: number;
}
