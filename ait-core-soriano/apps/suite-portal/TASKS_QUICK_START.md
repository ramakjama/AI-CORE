# Tasks Feature - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
```

This will install the new dependencies:
- `@dnd-kit/core@^6.1.0`
- `@dnd-kit/sortable@^8.0.0`
- `@dnd-kit/utilities@^3.2.2`

### 2. Run Development Server

```bash
pnpm dev
```

The app will start on: `http://localhost:3001`

### 3. Access Tasks Page

Navigate to: `http://localhost:3001/tasks`

## What's Included

### Files Created

1. **`src/app/tasks/page.tsx`** - Main tasks page (1,100+ lines)
2. **`src/types/tasks.ts`** - TypeScript types
3. **`src/lib/mock-tasks.ts`** - Mock data for development
4. **`src/app/tasks/README.md`** - Feature documentation
5. **`TASKS_FEATURE_SUMMARY.md`** - Complete implementation guide
6. **`TASKS_QUICK_START.md`** - This file

### Modified Files

- **`package.json`** - Added @dnd-kit dependencies

## Features Overview

### Kanban Board View
- Drag and drop tasks between columns
- Three columns: To Do, In Progress, Done
- Color-coded priority indicators
- Task counts per column
- Smooth animations

### Task Cards
- Title and description
- Priority badge (low, medium, high, urgent)
- Assignee avatar
- Due date with color coding
- Tags/labels
- Checklist progress (X/Y completed)
- Attachment count
- Comment count
- Context menu (edit, duplicate, archive, delete)

### Task Management
- Create new tasks
- Edit existing tasks
- Delete tasks (with confirmation)
- Drag to change status
- Search tasks
- Filter by multiple criteria

### Views
- **Kanban**: Drag-and-drop board (fully functional)
- **List**: Traditional task list (fully functional)
- **Calendar**: Calendar view (coming soon)

## Quick Test

### 1. View Sample Tasks

The page loads with 12 sample tasks distributed across three columns:
- **To Do**: 4 tasks
- **In Progress**: 3 tasks
- **Done**: 5 tasks

### 2. Create a New Task

1. Click "Nueva Tarea" button in toolbar
2. Fill in the form:
   - Title: "Test Task"
   - Description: "This is a test"
   - Priority: "High"
   - Status: "To Do"
   - Due Date: Select tomorrow
   - Tags: "test, demo"
3. Click "Crear Tarea"

### 3. Drag and Drop

1. Click and hold any task card
2. Drag it to another column
3. Release to drop
4. Status updates automatically

### 4. Edit a Task

1. Hover over a task card
2. Click the three-dot menu
3. Select "Editar"
4. Modify any field
5. Click "Guardar Cambios"

### 5. Search Tasks

1. Type in the search bar at the top
2. Results filter in real-time
3. Searches title, description, and tags

### 6. Switch Views

Use the view switcher buttons:
- Grid icon: Kanban view
- List icon: List view
- Calendar icon: Calendar view (placeholder)

### 7. Filter Tasks

Use the sidebar to filter by:
- Personal tasks (My Tasks, Assigned to Me)
- Projects
- Priority checkboxes
- Status checkboxes

## Mock Data

The feature includes comprehensive mock data:

### Sample Tasks (12 total)
- Authentication OAuth implementation (High, To Do)
- Notification system design (Medium, To Do)
- Database query optimization (Urgent, To Do)
- API documentation update (Low, To Do)
- Analytics dashboard implementation (High, In Progress)
- CI/CD pipeline setup (Medium, In Progress)
- Redis cache system (High, In Progress)
- Next.js project setup (High, Done)
- Authentication system (Urgent, Done)
- Component library design (Medium, Done)
- PostgreSQL configuration (High, Done)
- Dark mode implementation (Medium, Done)

### Sample Projects (4)
- AIT-CORE Suite
- Website Redesign
- Mobile App
- API Integration

### Sample Users (4)
- Ana García
- Carlos Ruiz
- María López
- Juan Pérez

## Customization

### Change Priority Colors

Edit `priorityConfig` in `page.tsx`:

```typescript
const priorityConfig = {
  low: { color: 'bg-blue-500', label: 'Baja' },
  medium: { color: 'bg-yellow-500', label: 'Media' },
  high: { color: 'bg-orange-500', label: 'Alta' },
  urgent: { color: 'bg-red-500', label: 'Urgente' },
};
```

### Add Custom Status

1. Update `TaskStatus` type in `src/types/tasks.ts`
2. Add to `statusConfig` in `page.tsx`
3. Add new column to Kanban board

### Modify Task Card Layout

Edit the `TaskCard` component in `page.tsx` around line 200.

## API Integration

### Using Real Backend

The tasks feature is ready for API integration. Simply ensure your backend implements these endpoints:

```typescript
// Tasks
GET    /tasks          - List tasks (with filters)
GET    /tasks/:id      - Get single task
POST   /tasks          - Create task
PATCH  /tasks/:id      - Update task
DELETE /tasks/:id      - Delete task

// Projects
GET    /projects       - List projects
POST   /projects       - Create project
```

### API Configuration

API client is already configured in `src/lib/api.ts`:

```typescript
import { tasksApi } from '@/lib/api';

// Already used in the tasks page:
tasksApi.get('/tasks')
tasksApi.post('/tasks', data)
tasksApi.patch(`/tasks/${id}`, data)
tasksApi.delete(`/tasks/${id}`)
```

### Switch from Mock to Real API

The component automatically uses the real API through TanStack Query. Just make sure your backend is running at the configured API URL (default: `http://localhost:8000`).

## Dark Mode

The tasks page fully supports dark mode:

1. Toggle theme using the theme switcher (if available)
2. Or add to your layout:

```tsx
import { ThemeProvider } from '@/components/theme-provider';

<ThemeProvider attribute="class" defaultTheme="system">
  {children}
</ThemeProvider>
```

## Troubleshooting

### Dependencies Not Installing

If `pnpm install` fails:

```bash
# Try clearing cache
pnpm store prune

# Or use npm as fallback (not recommended for monorepo)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### Page Not Loading

1. Check if dev server is running
2. Verify URL: `http://localhost:3001/tasks`
3. Check browser console for errors
4. Ensure all dependencies installed

### Drag and Drop Not Working

1. Clear browser cache
2. Check if @dnd-kit packages installed
3. Try different browser
4. Check console for errors

### TypeScript Errors

1. Run type check: `pnpm type-check`
2. Restart TypeScript server in your IDE
3. Check `src/types/tasks.ts` exists

## Next Steps

### Immediate
1. ✅ Install dependencies
2. ✅ Run dev server
3. ✅ Test basic functionality
4. Connect to real backend
5. Test with real data

### Short Term
- Implement calendar view with FullCalendar
- Add file upload for attachments
- Implement comment creation
- Add checklist item editing
- Enable task duplication

### Medium Term
- Add task dependencies
- Implement recurring tasks
- Add task templates
- Create time tracking
- Build activity history

### Long Term
- Real-time collaboration
- Mobile app
- Offline mode
- Custom fields
- Task automation
- Gantt chart view

## Support

### Documentation
- **Feature Docs**: `src/app/tasks/README.md`
- **Complete Guide**: `TASKS_FEATURE_SUMMARY.md`
- **This Guide**: `TASKS_QUICK_START.md`

### Code Comments
- All components are well-documented with comments
- TypeScript types include JSDoc comments
- Complex logic explained inline

### Help
- Check browser console for errors
- Review TanStack Query DevTools (if enabled)
- Inspect network requests
- Contact development team

## File Locations

```
apps/suite-portal/
├── src/
│   ├── app/
│   │   └── tasks/
│   │       ├── page.tsx           # Main component
│   │       └── README.md          # Feature docs
│   ├── types/
│   │   └── tasks.ts               # Type definitions
│   ├── lib/
│   │   ├── api.ts                 # API client (existing)
│   │   ├── utils.ts               # Utility functions (existing)
│   │   └── mock-tasks.ts          # Mock data
│   └── components/
│       └── ui/                    # UI components (existing)
├── package.json                   # Updated with new deps
├── TASKS_FEATURE_SUMMARY.md       # Complete guide
└── TASKS_QUICK_START.md           # This file
```

## Performance Tips

1. **Large Task Lists**: Enable virtual scrolling (to be implemented)
2. **Slow Drag**: Reduce animation complexity
3. **API Delays**: Enable optimistic updates (already configured)
4. **Search Lag**: Increase debounce delay
5. **Memory Issues**: Clear query cache periodically

## Keyboard Shortcuts

- **Tab**: Navigate between elements
- **Enter**: Open/submit forms
- **Escape**: Close dialogs
- **Arrow Keys**: Navigate during drag
- **Space**: Pick up/drop during drag

## Browser DevTools

### React DevTools
- Inspect component state
- View props and hooks
- Profile performance

### TanStack Query DevTools
```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Add to your app:
<ReactQueryDevtools initialIsOpen={false} />
```

## Summary

The Tasks feature is fully functional and ready to use:

✅ Kanban board with drag-and-drop
✅ List view
✅ Create, edit, delete tasks
✅ Search and filtering
✅ Dark mode support
✅ Responsive design
✅ TypeScript types
✅ Mock data included
✅ API integration ready

**Start using**: `http://localhost:3001/tasks`

Enjoy your new task management system!
