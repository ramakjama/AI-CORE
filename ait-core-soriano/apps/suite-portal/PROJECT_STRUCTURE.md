# AIT-CORE Suite Portal - Project Structure

## Location
`C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal`

## Created Files

### Configuration Files
- ✅ `package.json` - Full dependencies including Next.js 14, React 18, TipTap, Handsontable, FullCalendar, Reveal.js, Radix UI, Zustand, TanStack Query, Framer Motion, Y.js, etc.
- ✅ `tsconfig.json` - TypeScript configuration with path aliases (@/*, @/components/*, @/lib/*, etc.)
- ✅ `next.config.js` - Next.js config with API rewrites to FastAPI services (ports 8000-8018)
- ✅ `tailwind.config.ts` - Tailwind config with dark mode, shadcn/ui colors, animations
- ✅ `postcss.config.mjs` - PostCSS config with tailwindcss and autoprefixer
- ✅ `.eslintrc.json` - ESLint config extending next/core-web-vitals
- ✅ `.gitignore` - Standard Next.js gitignore
- ✅ `.env.example` - All environment variables for FastAPI services URLs (ports 8000-8018)

### Documentation
- ✅ `README.md` - Comprehensive project documentation

## Directory Structure

```
suite-portal/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.mjs
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── src/
    ├── app/                          # Next.js App Router pages
    │   ├── analytics/               # Analytics dashboard
    │   ├── auth/                    # Authentication pages
    │   ├── bookings/                # Booking system
    │   ├── calendar/                # Calendar & events
    │   ├── crm/                     # Customer relationship management
    │   ├── dashboard/               # Main dashboard
    │   ├── documents/               # Document editor (TipTap)
    │   ├── forms/                   # Form builder
    │   ├── mail/                    # Email client
    │   ├── notes/                   # Note taking
    │   ├── presentations/           # Presentation creator (Reveal.js)
    │   ├── settings/                # User settings
    │   ├── spreadsheets/            # Spreadsheet app (Handsontable)
    │   ├── storage/                 # File storage
    │   ├── tasks/                   # Task management
    │   ├── layout.tsx               # Root layout with theme provider
    │   ├── page.tsx                 # Homepage (redirects to dashboard)
    │   └── providers.tsx            # React Query and other providers
    ├── components/
    │   ├── apps/                    # App-specific components
    │   ├── layout/                  # Layout components
    │   │   ├── app-layout.tsx       # Main application layout
    │   │   ├── command-menu.tsx     # Command palette (Cmd+K)
    │   │   ├── sidebar.tsx          # Navigation sidebar
    │   │   ├── topbar.tsx           # Top navigation bar
    │   │   └── index.ts             # Exports
    │   ├── shared/                  # Shared components
    │   ├── ui/                      # Reusable UI components (shadcn/ui style)
    │   │   ├── avatar.tsx
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── input.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── index.ts
    │   │   ├── README.md
    │   │   └── DEPENDENCIES.md
    │   └── theme-provider.tsx       # Dark mode theme provider
    ├── hooks/                       # Custom React hooks
    │   ├── use-command-k.ts         # Command palette hook
    │   └── use-keyboard.ts          # Keyboard shortcuts
    ├── lib/                         # Utility functions
    │   ├── api.ts                   # API client with auth, service-specific clients
    │   ├── react-query.ts           # React Query configuration
    │   └── utils.ts                 # Helper functions (cn, formatDate, etc.)
    ├── store/                       # Zustand stores
    │   ├── app.store.ts             # Global app state
    │   ├── auth.store.ts            # Authentication state
    │   └── collaboration.store.ts   # Real-time collaboration state
    ├── styles/
    │   └── globals.css              # Global styles with Tailwind, custom animations
    └── types/
        └── index.ts                 # TypeScript types and interfaces
```

## API Integration

The application connects to 18 FastAPI microservices via Next.js API rewrites:

| Service | Port | Path | Purpose |
|---------|------|------|---------|
| Auth | 8000 | /api/auth/* | Authentication & authorization |
| Documents | 8001 | /api/documents/* | Document management (TipTap) |
| Spreadsheets | 8002 | /api/spreadsheets/* | Spreadsheet engine (Handsontable) |
| Presentations | 8003 | /api/presentations/* | Presentation slides (Reveal.js) |
| Calendar | 8004 | /api/calendar/* | Calendar & events (FullCalendar) |
| Tasks | 8005 | /api/tasks/* | Task management |
| Mail | 8006 | /api/mail/* | Email client |
| Storage | 8007 | /api/storage/* | File storage |
| CRM | 8008 | /api/crm/* | Customer relationship management |
| Analytics | 8009 | /api/analytics/* | Analytics dashboard |
| Notes | 8010 | /api/notes/* | Note taking |
| Forms | 8011 | /api/forms/* | Form builder |
| Bookings | 8012 | /api/bookings/* | Booking system |
| Notifications | 8013 | /api/notifications/* | Notification service |
| Search | 8014 | /api/search/* | Search functionality |
| Collaboration | 8015 | /api/collaboration/* | Real-time collaboration (Y.js) |
| Workflow | 8016 | /api/workflow/* | Workflow automation |
| AI | 8017 | /api/ai/* | AI assistant |
| WebSocket | 8018 | /api/ws/* | WebSocket connections |

## Technology Stack

### Core Framework
- **Next.js 14** with App Router
- **React 18** with Server Components
- **TypeScript** for type safety

### UI & Styling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **shadcn/ui** component patterns
- **Framer Motion** for animations
- **Lucide React** for icons

### State Management & Data Fetching
- **Zustand** for global state
- **TanStack Query** for server state
- **Axios** for API calls

### Application Features
- **TipTap** - Rich text editor for Documents
- **Handsontable** - Spreadsheet engine
- **Reveal.js** - Presentation slides
- **FullCalendar** - Calendar & scheduling
- **Y.js** - Real-time collaboration

### Forms & Validation
- **React Hook Form** for form handling
- **Zod** for schema validation

## Key Features

### Already Implemented
- ✅ Complete configuration files
- ✅ Directory structure with all app sections
- ✅ API client with authentication and token refresh
- ✅ Theme provider with dark mode support
- ✅ TypeScript types and interfaces
- ✅ Utility functions and helpers
- ✅ Layout components (sidebar, topbar, command menu)
- ✅ UI components (button, input, dialog, etc.)
- ✅ Zustand stores (app, auth, collaboration)
- ✅ Custom hooks (command-k, keyboard shortcuts)
- ✅ Global styles with animations and effects

### Ready for Development
Each app section has its dedicated directory and is ready for implementation:
- Documents editor with TipTap
- Spreadsheets with Handsontable
- Presentations with Reveal.js
- Calendar with FullCalendar
- Tasks management
- Mail client
- File storage
- CRM system
- Analytics dashboard
- Notes app
- Forms builder
- Booking system

## Next Steps

### 1. Install Dependencies
```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your FastAPI service URLs
```

### 3. Start Development Server
```bash
pnpm dev
```
The application will run at `http://localhost:3001`

### 4. Implement Features
Start implementing individual app features:
- Documents: Integrate TipTap editor
- Spreadsheets: Integrate Handsontable
- Presentations: Integrate Reveal.js
- Calendar: Integrate FullCalendar
- And more...

## Path Aliases

The following TypeScript path aliases are configured:

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/store/*` → `./src/store/*`
- `@/types/*` → `./src/types/*`
- `@/styles/*` → `./src/styles/*`
- `@/app/*` → `./src/app/*`

## Development Commands

- `pnpm dev` - Start development server on port 3001
- `pnpm build` - Create production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## Notes

- All configuration files are production-ready
- API routes are configured to proxy to FastAPI services
- Theme system supports light/dark mode
- Authentication is handled with JWT tokens
- Real-time collaboration ready with Y.js
- All major dependencies are included in package.json
- TypeScript strict mode is enabled
- ESLint and Prettier are configured

## Status

✅ **PROJECT STRUCTURE COMPLETE**
✅ **CONFIGURATION FILES READY**
✅ **DEPENDENCIES DEFINED**
✅ **API INTEGRATION CONFIGURED**
✅ **READY FOR FEATURE IMPLEMENTATION**
