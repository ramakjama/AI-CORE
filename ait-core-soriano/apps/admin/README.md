# AIT-CORE Admin Panel

Production-ready enterprise admin panel for AIT-CORE Soriano platform.

## Features

- **Module Management**: Complete CRUD operations for system modules
- **Agent Monitoring**: Real-time agent performance and health tracking
- **System Health**: Comprehensive system monitoring and analytics
- **User Management**: Advanced user administration and role management
- **Authentication**: Secure JWT-based authentication
- **Real-time Updates**: WebSocket integration for live data
- **Analytics Dashboard**: Advanced metrics and visualizations
- **Responsive Design**: Mobile-first, fully responsive UI

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: React 18, Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Real-time**: Socket.IO Client
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.local .env

# Run development server
pnpm dev
```

The admin panel will be available at `http://localhost:3001`

### Build for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
apps/admin/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── ui/          # Base UI components
│   │   ├── modules/     # Module management components
│   │   ├── agents/      # Agent monitoring components
│   │   ├── system/      # System health components
│   │   └── users/       # User management components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries
│   ├── store/           # Zustand stores
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── public/              # Static assets
└── ...config files
```

## Key Features

### Module Management
- Create, read, update, delete modules
- Module status tracking
- Dependency management
- Version control

### Agent Monitoring
- Real-time agent status
- Performance metrics
- Task execution tracking
- Error monitoring

### System Health
- CPU, Memory, Disk usage
- API response times
- Database connections
- Service status

### User Management
- User CRUD operations
- Role-based access control
- Activity logging
- Session management

## Environment Variables

See `.env.local` for all available configuration options.

## Development

```bash
# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Format code
pnpm format

# Analyze bundle
pnpm analyze
```

## Production Deployment

The application is production-ready with:
- Optimized builds
- Security headers
- Image optimization
- Performance monitoring
- Error tracking

## License

Proprietary - AIT-CORE Soriano Platform
