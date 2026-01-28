# ⚡ AIT-NERVE - Guía de Instalación Rápida

## 🚀 Instalación en 3 Minutos

### Opción 1: Docker (Recomendado)

```bash
# 1. Clonar repo (si aún no lo has hecho)
git clone https://github.com/soriano-mediadores/ait-core.git
cd ait-core/packages/ait-nerve

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Editar .env con tus valores
# Mínimo requerido: DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY

# 4. Levantar con Docker Compose
docker-compose up -d

# 5. Ejecutar migraciones
docker-compose exec ait-nerve pnpm prisma migrate deploy

# 6. Poblar datos iniciales (12 motores)
docker-compose exec ait-nerve pnpm prisma seed

# ✅ Listo! Dashboard: http://localhost:3000
```

### Opción 2: Local (Desarrollo)

**Prerequisitos:**
- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14.0
- Redis >= 7.0 (opcional)

```bash
# 1. Navegar al directorio
cd packages/ait-nerve

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables
cp .env.example .env
# Editar .env con tus valores

# 4. Inicializar base de datos
pnpm prisma migrate dev

# 5. Poblar datos iniciales
pnpm prisma seed

# 6. Iniciar en modo desarrollo
pnpm dev

# ✅ Listo!
# Dashboard: http://localhost:3000
# API:       http://localhost:3000/api
# Metrics:   http://localhost:9090/metrics
```

## 🔑 Configuración Mínima Requerida

Edita `.env` con estos valores mínimos:

```bash
# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/ait_nerve"

# Seguridad (GENERAR VALORES ALEATORIOS!)
JWT_SECRET="tu-secreto-jwt-de-al-menos-32-caracteres-aqui"
ENCRYPTION_KEY="tu-clave-encriptacion-aes-256-de-32-caracteres"
```

**⚠️ IMPORTANTE:** Genera valores aleatorios seguros para producción:

```bash
# Generar JWT_SECRET (Linux/Mac)
openssl rand -base64 32

# Generar ENCRYPTION_KEY
openssl rand -base64 32
```

## 📊 Verificar Instalación

```bash
# Health check
curl http://localhost:3000/api/health

# Debería retornar:
# { "status": "healthy", ... }
```

## 🎯 Próximos Pasos

1. **Ver Dashboard**: http://localhost:3000
2. **Ver Motores**: http://localhost:3000/api/motors
3. **Ver Prometheus**: http://localhost:9091 (si usas Docker)
4. **Ver Grafana**: http://localhost:3001 (si usas Docker)
   - Usuario: admin
   - Contraseña: admin

## 🐛 Troubleshooting

### Error: "Connection refused" en PostgreSQL

```bash
# Verifica que PostgreSQL esté corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Reiniciar PostgreSQL
docker-compose restart postgres
```

### Error: "Prisma Client not generated"

```bash
# Regenerar Prisma Client
pnpm prisma generate
```

### Error: Puerto 3000 ya en uso

```bash
# Cambiar puerto en .env
PORT=3001

# O matar proceso en el puerto
# Linux/Mac:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 📚 Documentación Completa

- [README Principal](./README.md)
- [API Reference](./README.md#-api-reference)
- [Dashboard Guide](./README.md#-dashboard)
- [Docker Guide](./docker-compose.yml)

## 🆘 Soporte

- **Issues**: https://github.com/soriano-mediadores/ait-core/issues
- **Email**: dev@ait-core.com
- **Docs**: https://docs.ait-core.com/ait-nerve

---

**AIT-NERVE v1.0.0** - © 2026 AIT-CORE
*Network Engine Runtime & Vital Executor*
