FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3020

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3020/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Start service
CMD ["node", "dist/main.js"]
