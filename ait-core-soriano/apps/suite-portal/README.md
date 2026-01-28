# AIT-CORE Suite Portal

Enterprise Application Suite - All your productivity tools in one place.

## Overview

The Suite Portal is a comprehensive Next.js 14 application that provides a unified interface for accessing multiple productivity and business applications. It integrates with FastAPI microservices running on ports 8000-8018.

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

## Architecture

### API Integration
The application connects to 18 FastAPI microservices:

- **Port 8000**: Authentication Service
- **Port 8001**: Documents Service
- **Port 8002**: Spreadsheets Service
- **Port 8003**: Presentations Service
- **Port 8004**: Calendar Service
- **Port 8005**: Tasks Service
- **Port 8006**: Mail Service
- **Port 8007**: Storage Service
- **Port 8008**: CRM Service
- **Port 8009**: Analytics Service
- **Port 8010**: Notes Service
- **Port 8011**: Forms Service
- **Port 8012**: Bookings Service
- **Port 8013**: Notifications Service
- **Port 8014**: Search Service
- **Port 8015**: Collaboration Service
- **Port 8016**: Workflow Service
- **Port 8017**: AI Service
- **Port 8018**: WebSocket Service

### Directory Structure

```
suite-portal/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── documents/         # Document editor
│   │   ├── spreadsheets/      # Spreadsheet app
│   │   ├── presentations/     # Presentation creator
│   │   ├── calendar/          # Calendar & events
│   │   ├── tasks/             # Task management
│   │   ├── mail/              # Email client
│   │   ├── storage/           # File storage
│   │   ├── crm/               # Customer relationship
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── notes/             # Note taking
│   │   ├── forms/             # Form builder
│   │   ├── bookings/          # Booking system
│   │   └── settings/          # User settings
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   ├── layout/           # Layout components
│   │   ├── apps/             # App-specific components
│   │   └── shared/           # Shared components
│   ├── lib/                  # Utility functions
│   ├── hooks/                # Custom React hooks
│   ├── store/                # Zustand stores
│   ├── types/                # TypeScript types
│   └── styles/               # Global styles
├── public/                   # Static assets
└── [config files]           # Configuration files
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Running FastAPI services on ports 8000-8018

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your FastAPI service URLs

### Development

Run the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3001`

### Build

Create a production build:
```bash
pnpm build
```

### Start Production Server

```bash
pnpm start
```

## Features

### Documents
- Rich text editing with TipTap
- Real-time collaboration with Y.js
- Document sharing and permissions
- Version history

### Spreadsheets
- Full-featured spreadsheet with Handsontable
- Formulas and functions
- Charts and visualizations
- Import/Export (CSV, XLSX)

### Presentations
- Slide-based presentations with Reveal.js
- Multiple themes and transitions
- Speaker notes
- Export to PDF

### Calendar
- Monthly, weekly, and daily views
- Event creation and management
- Recurring events
- Integration with other apps

### Tasks
- Kanban board view
- Task assignments
- Due dates and priorities
- Labels and filters

### Mail
- Full email client
- Compose, read, and organize
- Attachments support
- Search and filters

### Storage
- File upload and management
- Folder organization
- File sharing
- Preview capabilities

### CRM
- Contact management
- Deal pipeline
- Activity tracking
- Reports and analytics

### Analytics
- Dashboard with key metrics
- Custom reports
- Data visualizations
- Export capabilities

### Notes
- Quick note taking
- Tag organization
- Search functionality
- Rich formatting

### Forms
- Drag-and-drop form builder
- Multiple field types
- Form submissions
- Analytics

### Bookings
- Appointment scheduling
- Calendar integration
- Notification system
- Status management

## API Client

The application includes a robust API client with:
- Automatic token management
- Request/response interceptors
- Error handling
- Service-specific clients

## Theme Support

- Light and dark mode
- System preference detection
- Custom color schemes
- Smooth transitions

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow ESLint configuration
- Use Prettier for formatting

### Component Structure
- Use Server Components by default
- Mark Client Components with "use client"
- Separate business logic from presentation

### State Management
- Use Zustand for global state
- Use TanStack Query for server state
- Keep state close to where it's used

### API Integration
- Use the provided API clients
- Handle errors gracefully
- Implement loading states

## License

Proprietary - AIT-CORE Suite Portal
