# 🚀 AI-CORE - Guía de Inicio Rápido

Esta guía te ayudará a tener el proyecto funcionando en **menos de 10 minutos**.

---

## ⚡ Inicio Rápido (5 minutos)

### 1. Requisitos Previos

Asegúrate de tener instalado:

```bash
node --version  # >= 20.0.0
pnpm --version  # >= 9.0.0
```

Si no tienes pnpm:
```bash
npm install -g pnpm@9
```

### 2. Instalación

```bash
# Clonar el repositorio (si aún no lo has hecho)
cd ai-core

# Instalar todas las dependencias
pnpm install
```

### 3. Configuración

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus credenciales
# MÍNIMO NECESARIO para desarrollo:
# - DATABASE_URL
# - OPENAI_API_KEY (o ANTHROPIC_API_KEY)
# - JWT_SECRET
```

### 4. Base de Datos (Opcional para desarrollo)

**Opción A: Docker (Recomendado)**
```bash
# Iniciar PostgreSQL y Redis
docker-compose up -d postgres redis

# Crear bases de datos
pnpm run db:create-all

# Ejecutar migraciones
pnpm run db:migrate

# Seed de datos de prueba
pnpm run db:seed
```

**Opción B: Desarrollo sin DB (Mock Data)**
```bash
# El API funciona con datos mock sin necesidad de DB
# Solo para desarrollo rápido
```

### 5. Iniciar Desarrollo

```bash
# Opción 1: Iniciar todo
pnpm run dev

# Opción 2: Solo el API
pnpm run dev:api
# API corriendo en http://localhost:4000
# GraphQL Playground en http://localhost:4000/graphql

# Opción 3: Solo el Web
pnpm run dev:web
# Web corriendo en http://localhost:3000
```

---

## 🎯 Verificación

### 1. API Funcionando

```bash
# Health check
curl http://localhost:4000/api/health

# Debería responder:
# {"status":"ok","timestamp":"..."}
```

### 2. GraphQL Playground

Abre en tu navegador:
```
http://localhost:4000/graphql
```

### 3. Login de Prueba

```bash
# Login con usuario de prueba
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ai-core.io",
    "password": "admin123"
  }'
```

---

## 📱 Aplicaciones Disponibles

### API (Backend)
```bash
pnpm run dev:api
# http://localhost:4000
# GraphQL: http://localhost:4000/graphql
```

### Web App
```bash
pnpm run dev:web
# http://localhost:3000
```

### Admin Panel
```bash
pnpm run dev:admin
# http://localhost:3001
```

### Desktop App
```bash
pnpm run dev:desktop
```

---

## 🔑 Credenciales de Prueba

```
Email: admin@ai-core.io
Password: admin123
```

---

## 📚 Próximos Pasos

1. Lee el [README.md](./README.md) completo
2. Revisa [PROJECT-STATUS.md](./PROJECT-STATUS.md)
3. Consulta [TODO.md](./TODO.md) para tareas pendientes
4. Explora la [documentación](./docs/)

---

## 🆘 Problemas Comunes

### Error: "Cannot find module"
```bash
# Reinstalar dependencias
pnpm install
```

### Error: "Port already in use"
```bash
# Cambiar puerto en .env
APP_PORT=4001
```

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL está corriendo
docker-compose ps

# O usar datos mock (sin DB)
```

---

## 💡 Tips

- Usa `pnpm run dev` para desarrollo completo
- GraphQL Playground es tu amigo para probar APIs
- Los datos mock funcionan sin base de datos
- Revisa los logs en la consola para debugging

---

**¡Listo para desarrollar! 🚀**
