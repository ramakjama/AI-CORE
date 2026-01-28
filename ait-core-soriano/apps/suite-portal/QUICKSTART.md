# Quick Start Guide - AIT-CORE Suite Portal

## 🚀 Get Started in 3 Minutes

### Step 1: Install Dependencies (1 minute)

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
```

### Step 2: Configure Environment (30 seconds)

```bash
cp .env.example .env.local
```

### Step 3: Start Development Server (30 seconds)

```bash
pnpm dev
```

Open browser: `http://localhost:3001`

## ✅ What's Already Set Up

### Configuration Files
- ✅ `package.json` - All dependencies (112 lines)
- ✅ `tsconfig.json` - TypeScript config with path aliases (38 lines)
- ✅ `next.config.js` - API rewrites to 18 FastAPI services (130 lines)
- ✅ `tailwind.config.ts` - Dark mode + shadcn/ui colors (127 lines)
- ✅ `postcss.config.mjs` - PostCSS + Tailwind (8 lines)
- ✅ `.eslintrc.json` - ESLint config (3 lines)
- ✅ `.gitignore` - Standard Next.js gitignore (30 lines)
- ✅ `.env.example` - All 18 FastAPI service URLs (82 lines)

### Directory Structure
```
src/
├── app/                    # 15 app sections ready
│   ├── analytics/         ✅
│   ├── auth/              ✅
│   ├── bookings/          ✅
│   ├── calendar/          ✅
│   ├── crm/               ✅
│   ├── dashboard/         ✅
│   ├── documents/         ✅
│   ├── forms/             ✅
│   ├── mail/              ✅
│   ├── notes/             ✅
│   ├── presentations/     ✅
│   ├── settings/          ✅
│   ├── spreadsheets/      ✅
│   ├── storage/           ✅
│   └── tasks/             ✅
├── components/
│   ├── ui/                ✅ Radix UI components
│   ├── layout/            ✅ Sidebar, topbar, command menu
│   ├── apps/              ✅ App-specific components
│   └── shared/            ✅ Shared components
├── lib/
│   ├── api.ts             ✅ API client with auth (453 lines)
│   ├── utils.ts           ✅ Helper functions (417 lines)
│   └── react-query.ts     ✅ React Query config
├── hooks/
│   ├── use-command-k.ts   ✅ Command palette
│   └── use-keyboard.ts    ✅ Keyboard shortcuts
├── store/
│   ├── app.store.ts       ✅ Global app state
│   ├── auth.store.ts      ✅ Authentication state
│   └── collaboration.store.ts ✅ Real-time state
├── styles/
│   └── globals.css        ✅ Global styles (362 lines)
└── types/
    └── index.ts           ✅ TypeScript types
```

### API Integration (18 Services)
All FastAPI services configured with Next.js rewrites:

| Port | Service | Ready |
|------|---------|-------|
| 8000 | Auth | ✅ |
| 8001 | Documents | ✅ |
| 8002 | Spreadsheets | ✅ |
| 8003 | Presentations | ✅ |
| 8004 | Calendar | ✅ |
| 8005 | Tasks | ✅ |
| 8006 | Mail | ✅ |
| 8007 | Storage | ✅ |
| 8008 | CRM | ✅ |
| 8009 | Analytics | ✅ |
| 8010 | Notes | ✅ |
| 8011 | Forms | ✅ |
| 8012 | Bookings | ✅ |
| 8013 | Notifications | ✅ |
| 8014 | Search | ✅ |
| 8015 | Collaboration | ✅ |
| 8016 | Workflow | ✅ |
| 8017 | AI | ✅ |
| 8018 | WebSocket | ✅ |

## 🎨 Technology Stack

### Core
- Next.js 14 (App Router)
- React 18 (Server Components)
- TypeScript (Strict mode)

### UI
- Tailwind CSS
- Radix UI
- shadcn/ui patterns
- Framer Motion
- Lucide Icons

### State & Data
- Zustand (global state)
- TanStack Query (server state)
- Axios (HTTP client)

### Features
- TipTap (Documents)
- Handsontable (Spreadsheets)
- Reveal.js (Presentations)
- FullCalendar (Calendar)
- Y.js (Collaboration)

### Forms
- React Hook Form
- Zod validation

## 🔧 Available Commands

```bash
pnpm dev          # Start dev server (port 3001)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checking
```

## 📁 Path Aliases

Use these in your imports:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useAppStore } from '@/store/app.store'
import type { User } from '@/types'
```

## 🌐 API Client Usage

```typescript
import { authApi, documentsApi, storageApi } from '@/lib/api'

// Login
const data = await authApi.post('/login', { email, password })

// Get documents
const docs = await documentsApi.get('/')

// Upload file
await storageApi.upload('/upload', file, (progress) => {
  console.log(`Upload: ${progress}%`)
})
```

## 🎯 Next Development Steps

### 1. Authentication Flow
```
src/app/auth/
├── login/page.tsx
├── register/page.tsx
├── forgot-password/page.tsx
└── reset-password/page.tsx
```

### 2. Dashboard
```
src/app/dashboard/
└── page.tsx  # Main dashboard with widgets
```

### 3. Individual Apps
Choose an app to implement first:
- Documents (TipTap editor)
- Spreadsheets (Handsontable)
- Calendar (FullCalendar)
- Tasks (Kanban board)
- Mail (Email client)

### 4. UI Components
Add more components to `src/components/ui/`:
- Card
- Badge
- Select
- Checkbox
- Radio
- Switch
- Tabs
- Accordion
- Sheet
- Command

## 🎨 Theme System

The app supports light/dark mode:

```typescript
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle theme
    </button>
  )
}
```

## 🔐 Authentication

Token management is built-in:

```typescript
import { setTokens, getAccessToken, clearTokens } from '@/lib/api'

// After login
setTokens(accessToken, refreshToken)

// Get current token
const token = getAccessToken()

// Logout
clearTokens()
```

Auto-refresh on 401 errors is configured.

## 📝 TypeScript Types

All types are defined in `src/types/index.ts`:

```typescript
import type {
  User,
  Document,
  Spreadsheet,
  CalendarEvent,
  Task,
  Email
} from '@/types'
```

## 🚦 Status

### ✅ Ready
- Project structure
- Configuration files
- API integration
- Type definitions
- Utility functions
- Layout components
- Theme support
- State management setup

### 🔨 To Implement
- Authentication pages
- Dashboard page
- Individual app features
- More UI components
- Tests

## 📚 Documentation

- `README.md` - Full project documentation
- `PROJECT_STRUCTURE.md` - Detailed structure guide
- `INSTALLATION.md` - Complete installation guide
- `QUICKSTART.md` - This file

## 🎉 You're All Set!

The project is fully configured and ready for feature implementation. Start with authentication, then build out the dashboard and individual apps.

Happy coding! 🚀
