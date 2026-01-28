# AIT-CACHE-MANAGER

Sistema de caché multi-capa con Redis y memoria.

## Características

- Cache en memoria (LRU) - ultra rápido
- Cache Redis distribuido - compartido entre servicios
- Hit/miss metrics
- Cache warming
- Pattern-based invalidation
- Wrap pattern para simplificar uso

## Uso

```typescript
import { CacheService } from '@ait-core/cache-manager';

// Get/Set simple
const value = await cache.get<User>('user:123');
await cache.set('user:123', userData, { ttl: 300 });

// Wrap pattern (auto-cache)
const user = await cache.wrap('user:123', async () => {
  return await userService.findById(123);
}, { ttl: 600 });

// Invalidar por patrón
await cache.delByPattern('user:*');

// Métricas
const metrics = cache.getMetrics();
// { hits: 150, misses: 50, hitRatio: '75.00%' }
```
