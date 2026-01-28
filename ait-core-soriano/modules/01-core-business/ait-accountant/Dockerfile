FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package.json y prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npm run prisma:generate

# Build
RUN npm run build

# ============================================
# Production image
# ============================================
FROM node:22-alpine AS production

WORKDIR /app

# Copiar package.json
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Copiar build y prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Exponer puerto
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Comando de inicio
CMD ["node", "dist/main.js"]
