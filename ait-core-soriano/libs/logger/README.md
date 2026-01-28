# @ait-core/logger

ELK Logger Service para NestJS con integración completa a Elasticsearch, Logstash y Kibana.

## Instalación

```bash
pnpm add winston winston-transport axios
```

## Uso en NestJS

### 1. Importar el módulo

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { LoggerModule } from '@ait-core/logger';

@Module({
  imports: [LoggerModule],
})
export class AppModule {}
```

### 2. Configurar en main.ts

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ELKLoggerService } from '@ait-core/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ELKLoggerService('ait-core'),
  });

  await app.listen(3000);
}
bootstrap();
```

### 3. Usar en servicios

```typescript
import { Injectable } from '@nestjs/common';
import { ELKLoggerService } from '@ait-core/logger';

@Injectable()
export class MyService {
  constructor(private readonly logger: ELKLoggerService) {}

  async myMethod() {
    this.logger.log('Method called', 'MyService');

    try {
      // Business logic
      this.logger.logEvent('user_created', { userId: '123' });
    } catch (error) {
      this.logger.logError(error, { method: 'myMethod' });
    }
  }
}
```

### 4. Aplicar interceptor global

```typescript
// main.ts
import { LoggingInterceptor } from '@ait-core/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(ELKLoggerService);
  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  await app.listen(3000);
}
```

## Variables de Entorno

```env
# Logging Configuration
LOG_LEVEL=info
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5000
NODE_ENV=production
```

## Métodos Disponibles

### Básicos
- `log(message, context?)` - Log informativo
- `error(message, trace?, context?)` - Log de error
- `warn(message, context?)` - Log de advertencia
- `debug(message, context?)` - Log de debug
- `verbose(message, context?)` - Log verbose

### Estructurados
- `logRequest(req, res, duration)` - Log de HTTP request
- `logError(error, context?)` - Log de error con stack trace
- `logEvent(event, data?)` - Log de evento de negocio
- `logQuery(query, duration, params?)` - Log de query SQL
- `logApiCall(url, method, statusCode, duration, data?)` - Log de llamada API
- `logAuth(event, userId?, ip?)` - Log de autenticación
- `logPerformance(metric, value, unit?)` - Log de métrica de performance

## Ejemplos

```typescript
// HTTP Request logging (automático con interceptor)
this.logger.logRequest(req, res, 150);

// Error logging
this.logger.logError(new Error('Something failed'), {
  userId: '123',
  action: 'create_policy',
});

// Business event
this.logger.logEvent('policy_created', {
  policyId: 'POL-123',
  userId: '123',
  premium: 1500,
});

// Database query
this.logger.logQuery('SELECT * FROM policies WHERE id = $1', 25, ['POL-123']);

// API call
this.logger.logApiCall(
  'https://api.insurance.com/quotes',
  'POST',
  200,
  350,
  { quoteId: 'Q-456' }
);

// Authentication
this.logger.logAuth('login', 'user-123', '192.168.1.1');

// Performance
this.logger.logPerformance('quote_calculation', 1250, 'ms');
```

## Formato de Logs

Todos los logs incluyen automáticamente:
- `timestamp` - Timestamp ISO 8601
- `application` - Nombre de la aplicación
- `environment` - Entorno (dev/staging/production)
- `hostname` - Hostname del servidor
- `pid` - Process ID
- `level` - Nivel de log (info/error/warn/debug)

## Transports

1. **Console** - Siempre habilitado (colorizado en dev)
2. **File** - Solo en producción (`logs/error.log`, `logs/combined.log`)
3. **Logstash** - Si `LOGSTASH_HOST` y `LOGSTASH_PORT` están configurados

## Integración con Kibana

Los logs se indexan en Elasticsearch con el patrón:
```
ait-{application}-YYYY.MM.DD
```

Ejemplo: `ait-ait-core-2026.01.28`

## Performance

- Logs batched en grupos de 100
- Timeout de 5 segundos
- Fail silently si Logstash no responde
- Queue en memoria para evitar blocking
