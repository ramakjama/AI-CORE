# Installation Guide - AIT-CORE Soriano

Complete step-by-step guide to set up and run the AIT-CORE Soriano Insurance Management Platform.

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
- **Package Manager**: pnpm (recommended), npm, or yarn
- **Git**: For version control
- **Code Editor**: VS Code (recommended)

### Optional Software
- **Docker**: For containerized deployment
- **PostgreSQL**: For production database (optional)

## Installation Steps

### 1. Check Prerequisites

```bash
# Check Node.js version (should be 18.x or higher)
node --version

# Check npm version
npm --version

# Install pnpm globally (recommended)
npm install -g pnpm
```

### 2. Navigate to Project Directory

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\web
```

### 3. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

This will install all required dependencies including:
- Next.js 14
- React 18
- TypeScript
- TailwindCSS
- Shadcn UI components
- Zustand for state management
- And many more...

### 4. Environment Configuration

Create environment file:

```bash
# Copy example environment file
cp .env.example .env.local

# Or on Windows
copy .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# App Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_NAME=AIT-CORE Soriano
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001

# WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3001
WS_URL=ws://localhost:3001

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/aitcore

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./public/uploads

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-email-password
EMAIL_FROM=noreply@ait-core.com

# Feature Flags
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_FILE_UPLOAD=true
```

### 5. Generate Secrets

Generate secure secrets for production:

```bash
# Generate NEXTAUTH_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -base64 32
```

### 6. Start Development Server

```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev

# Or using yarn
yarn dev
```

The application will start on `http://localhost:3000`.

### 7. Verify Installation

Open your browser and navigate to:
- **Application**: http://localhost:3000
- **Login Page**: http://localhost:3000/auth/login

Default demo credentials (for mock authentication):
- Email: demo@ait-core.com
- Password: any password (mock auth accepts any)

## Post-Installation Setup

### 1. IDE Configuration (VS Code)

Install recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 2. Configure Git Hooks (Optional)

```bash
# Install husky for git hooks
pnpm add -D husky

# Initialize husky
npx husky init

# Add pre-commit hook
echo "pnpm lint" > .husky/pre-commit
```

### 3. Database Setup (Optional)

If using PostgreSQL:

```bash
# Install PostgreSQL client
pnpm add pg

# Run migrations (when implemented)
pnpm db:migrate

# Seed database (when implemented)
pnpm db:seed
```

## Troubleshooting

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process (macOS/Linux)
lsof -ti:3000 | xargs kill

# Or change port in package.json
"dev": "next dev -p 3001"
```

### Issue: Module Not Found

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules .next
pnpm install

# Clear pnpm cache
pnpm store prune

# Reinstall
pnpm install
```

### Issue: TypeScript Errors

**Solution:**
```bash
# Check TypeScript version
tsc --version

# Reinstall TypeScript
pnpm add -D typescript@latest

# Check for errors
pnpm type-check
```

### Issue: Environment Variables Not Loading

**Solution:**
1. Restart development server
2. Ensure `.env.local` exists
3. Check variable names start with `NEXT_PUBLIC_` for client-side
4. No spaces around `=` in env file
5. Restart your IDE

### Issue: WebSocket Connection Failed

**Solution:**
1. Check if WebSocket server is running
2. Verify `NEXT_PUBLIC_WS_URL` in `.env.local`
3. Check firewall settings
4. Try different port

### Issue: Build Errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next

# Clear TypeScript cache
rm -rf node_modules/.cache

# Rebuild
pnpm build
```

## Development Workflow

### Running Different Modes

```bash
# Development mode with hot reload
pnpm dev

# Production build
pnpm build

# Run production build locally
pnpm start

# Type checking only
pnpm type-check

# Linting
pnpm lint

# Fix linting issues
pnpm lint --fix
```

### Building for Production

```bash
# Build the application
pnpm build

# Test production build locally
pnpm start

# The build output will be in .next directory
```

## Docker Installation (Optional)

### Using Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.local
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: aitcore
      POSTGRES_PASSWORD: password
      POSTGRES_DB: aitcore
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres-data:

networks:
  app-network:
    driver: bridge
```

Run with Docker:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## Deployment Options

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

- **AWS**: Use AWS Amplify or EC2
- **Google Cloud**: Use Cloud Run or App Engine
- **Azure**: Use App Service
- **DigitalOcean**: Use App Platform
- **Netlify**: Deploy with Netlify
- **Railway**: One-click deployment

## Next Steps

After successful installation:

1. **Explore the Application**
   - Login page: `/auth/login`
   - Dashboard: `/dashboard`
   - Policies: `/polizas`
   - Clients: `/clientes`
   - Claims: `/siniestros`

2. **Configure Backend API**
   - Set up your backend API server
   - Update API URLs in `.env.local`
   - Configure database connections

3. **Customize**
   - Update branding in `tailwind.config.ts`
   - Modify company settings
   - Add custom features

4. **Deploy**
   - Choose a hosting platform
   - Configure production environment
   - Set up monitoring

## Support

If you encounter any issues:

1. Check this installation guide
2. Review the main README.md
3. Check GitHub issues
4. Contact support at support@ait-core.com

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Zustand Documentation](https://zustand-demo.pmnd.rs)

---

**Installation Complete! Happy Coding!**
