# AIT-CORE Suite Portal - Installation Guide

## Prerequisites

- Node.js 18+ installed
- pnpm 8+ installed
- Git installed
- FastAPI services running on ports 8000-8018 (or configured in .env.local)

## Installation Steps

### 1. Navigate to Project Directory

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- TipTap (rich text editor)
- Handsontable (spreadsheet)
- FullCalendar (calendar)
- Reveal.js (presentations)
- Radix UI components
- Zustand (state management)
- TanStack Query (data fetching)
- Framer Motion (animations)
- Y.js (real-time collaboration)
- Axios (HTTP client)
- And many more...

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and configure your FastAPI service URLs:

```env
# Application
NEXT_PUBLIC_APP_NAME="AIT-CORE Suite Portal"
NEXT_PUBLIC_APP_URL=http://localhost:3001
NODE_ENV=development

# API Base URLs - FastAPI Services
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Auth Service - Port 8000
NEXT_PUBLIC_AUTH_API_URL=http://localhost:8000/api/auth

# Documents Service - Port 8001
NEXT_PUBLIC_DOCUMENTS_API_URL=http://localhost:8001/api/documents

# ... (continue with all services)
```

### 4. Start Development Server

```bash
pnpm dev
```

The application will start at: `http://localhost:3001`

### 5. Verify Installation

Open your browser and navigate to `http://localhost:3001`

You should be redirected to `/dashboard`

## Directory Structure Verification

Run the following to verify all directories were created:

```bash
ls -la src/app/
```

You should see:
- analytics/
- auth/
- bookings/
- calendar/
- crm/
- dashboard/
- documents/
- forms/
- mail/
- notes/
- presentations/
- settings/
- spreadsheets/
- storage/
- tasks/

## Key Configuration Files

### package.json
Contains all dependencies and scripts:
- `pnpm dev` - Development server
- `pnpm build` - Production build
- `pnpm start` - Production server
- `pnpm lint` - ESLint
- `pnpm type-check` - TypeScript checking

### tsconfig.json
TypeScript configuration with path aliases:
- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/store/*` → `./src/store/*`
- `@/types/*` → `./src/types/*`
- `@/styles/*` → `./src/styles/*`
- `@/app/*` → `./src/app/*`

### next.config.js
Next.js configuration with:
- API rewrites to FastAPI services (ports 8000-8018)
- Image optimization
- Webpack configuration

### tailwind.config.ts
Tailwind CSS configuration with:
- Dark mode support (class-based)
- Custom color scheme (shadcn/ui style)
- Custom animations
- Custom keyframes

### postcss.config.mjs
PostCSS configuration with:
- Tailwind CSS plugin
- Autoprefixer plugin

## API Integration

The application is configured to proxy API requests to FastAPI services:

| Service | Port | Endpoint Pattern | Example |
|---------|------|-----------------|---------|
| Auth | 8000 | /api/auth/* | POST /api/auth/login |
| Documents | 8001 | /api/documents/* | GET /api/documents/123 |
| Spreadsheets | 8002 | /api/spreadsheets/* | POST /api/spreadsheets |
| Presentations | 8003 | /api/presentations/* | PUT /api/presentations/123 |
| Calendar | 8004 | /api/calendar/* | GET /api/calendar/events |
| Tasks | 8005 | /api/tasks/* | POST /api/tasks |
| Mail | 8006 | /api/mail/* | GET /api/mail/inbox |
| Storage | 8007 | /api/storage/* | POST /api/storage/upload |
| CRM | 8008 | /api/crm/* | GET /api/crm/contacts |
| Analytics | 8009 | /api/analytics/* | GET /api/analytics/dashboard |
| Notes | 8010 | /api/notes/* | POST /api/notes |
| Forms | 8011 | /api/forms/* | GET /api/forms/123 |
| Bookings | 8012 | /api/bookings/* | POST /api/bookings |
| Notifications | 8013 | /api/notifications/* | GET /api/notifications |
| Search | 8014 | /api/search/* | GET /api/search?q=query |
| Collaboration | 8015 | /api/collaboration/* | POST /api/collaboration/join |
| Workflow | 8016 | /api/workflow/* | GET /api/workflow/tasks |
| AI | 8017 | /api/ai/* | POST /api/ai/chat |
| WebSocket | 8018 | /api/ws/* | WS /api/ws/connect |

## Troubleshooting

### Port Already in Use

If port 3001 is already in use, you can change it in `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3002"
}
```

### FastAPI Services Not Running

Ensure all FastAPI services are running on their respective ports. You can verify with:

```bash
curl http://localhost:8000/health
curl http://localhost:8001/health
# ... etc
```

### Module Not Found Errors

If you see module not found errors, ensure all dependencies are installed:

```bash
pnpm install
```

### TypeScript Errors

Run type checking to see all TypeScript errors:

```bash
pnpm type-check
```

## Next Steps

### 1. Implement Authentication
Start by implementing the authentication flow in `src/app/auth/`

### 2. Build Dashboard
Create the main dashboard in `src/app/dashboard/`

### 3. Implement Individual Apps
Each app has its own directory:
- Documents: Integrate TipTap editor
- Spreadsheets: Integrate Handsontable
- Presentations: Integrate Reveal.js
- Calendar: Integrate FullCalendar
- And more...

### 4. Add UI Components
Build out the UI components in `src/components/ui/` using Radix UI and Tailwind CSS

### 5. Set Up State Management
Configure Zustand stores in `src/store/` for global state management

### 6. Configure React Query
Set up TanStack Query in `src/lib/react-query.ts` for server state management

## Development Workflow

1. Create a new feature branch
2. Implement the feature in the appropriate directory
3. Test locally with `pnpm dev`
4. Run type checking with `pnpm type-check`
5. Run linting with `pnpm lint`
6. Build for production with `pnpm build`
7. Commit and push changes

## Production Deployment

### Build the Application

```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

The production server will run on port 3001 by default.

### Environment Variables

Ensure all production environment variables are set in `.env.local` or your deployment platform.

## Support

For issues or questions, refer to:
- Project documentation in README.md
- Project structure in PROJECT_STRUCTURE.md
- FastAPI services documentation

## License

Proprietary - AIT-CORE Suite Portal
