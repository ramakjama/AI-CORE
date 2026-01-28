# Tasks Feature - AIT-CORE Suite Portal

## Overview

Comprehensive task management system with Kanban board, list view, and calendar view support.

## Features

### Views
- **Kanban Board**: Drag-and-drop task cards between columns (To Do, In Progress, Done)
- **List View**: Traditional table-style task list
- **Calendar View**: Tasks organized by due dates (coming soon)

### Task Management
- Create, edit, and delete tasks
- Drag-and-drop tasks between columns
- Color-coded priorities (Low, Medium, High, Urgent)
- Task status tracking (To Do, In Progress, Done)
- Due date management with visual indicators
- Assignee assignment with avatars
- Tags/labels for categorization
- Checklist items within tasks
- File attachments
- Comments and discussions

### Filtering & Organization
- Search tasks by title, description, or tags
- Filter by:
  - Status (To Do, In Progress, Done)
  - Priority (Low, Medium, High, Urgent)
  - Assignee
  - Project
  - Tags
- Project-based organization
- Personal task views (My Tasks, Assigned to Me)

### UI/UX Features
- Dark mode support
- Smooth animations with Framer Motion
- Responsive design
- Keyboard navigation support
- Tooltips for additional information
- Context menus for quick actions

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **State Management**: TanStack Query (React Query)
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Animations**: Framer Motion
- **UI Components**: Radix UI
- **Date Handling**: date-fns
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## File Structure

```
src/app/tasks/
├── page.tsx          # Main tasks page component
└── README.md         # This file

src/types/
└── tasks.ts          # TypeScript type definitions

src/components/ui/
├── button.tsx
├── input.tsx
├── badge.tsx
├── avatar.tsx
├── tooltip.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── select.tsx
├── textarea.tsx
├── label.tsx
└── checkbox.tsx
```

## Components

### Main Components
- **TasksPage**: Main page component with view switching and filtering
- **KanbanColumn**: Kanban board column with tasks
- **TaskCard**: Individual task card with all task information
- **SortableTaskCard**: Wrapper for TaskCard with drag-and-drop functionality
- **TaskFormDialog**: Create/edit task modal form
- **FiltersSidebar**: Sidebar with filters and project navigation

## API Integration

The tasks feature integrates with the backend API using the `tasksApi` client from `@/lib/api`:

### Endpoints Used
- `GET /tasks` - Fetch all tasks with optional filters
- `GET /tasks/:id` - Fetch single task details
- `POST /tasks` - Create new task
- `PATCH /tasks/:id` - Update existing task
- `DELETE /tasks/:id` - Delete task
- `GET /projects` - Fetch all projects
- `POST /projects` - Create new project

### Data Models

See `src/types/tasks.ts` for complete type definitions:
- `Task` - Main task entity
- `TaskPriority` - Priority levels
- `TaskStatus` - Task states
- `Project` - Project entity
- `TaskComment` - Task comment
- `TaskAttachment` - File attachment
- `ChecklistItem` - Checklist item

## Usage

### Creating a Task
1. Click the "Nueva Tarea" button in the toolbar
2. Fill in task details (title, description, priority, etc.)
3. Optionally assign to a project
4. Add tags for organization
5. Click "Crear Tarea"

### Moving Tasks (Kanban)
- Simply drag and drop task cards between columns
- The status will update automatically

### Editing a Task
- Click the three-dot menu on any task card
- Select "Editar"
- Make changes in the modal
- Click "Guardar Cambios"

### Filtering Tasks
- Use the search bar to find tasks by keywords
- Click filter button to access advanced filters
- Use the sidebar to filter by project or view personal tasks

### Switching Views
- Use the view switcher buttons in the toolbar:
  - Grid icon: Kanban board view
  - List icon: List view
  - Calendar icon: Calendar view (coming soon)

## Priority Colors

- **Low**: Blue (`bg-blue-500`)
- **Medium**: Yellow (`bg-yellow-500`)
- **High**: Orange (`bg-orange-500`)
- **Urgent**: Red (`bg-red-500`)

## Status Colors

- **To Do**: Slate (`bg-slate-500`)
- **In Progress**: Blue (`bg-blue-500`)
- **Done**: Green (`bg-green-500`)

## Due Date Indicators

- **Overdue**: Red text
- **Due Today**: Orange text
- **Due Tomorrow**: Yellow text
- **Future**: Muted text

## Keyboard Shortcuts

When dragging:
- Arrow keys: Move task
- Escape: Cancel drag
- Space: Pick up/drop task

## Accessibility

- Fully keyboard navigable
- ARIA labels and roles
- Screen reader support
- High contrast mode compatible
- Focus indicators

## Future Enhancements

- [ ] Calendar view implementation
- [ ] Task dependencies
- [ ] Recurring tasks
- [ ] Task templates
- [ ] Time tracking
- [ ] Task history/activity log
- [ ] Subtasks
- [ ] Task import/export
- [ ] Email notifications
- [ ] Mobile app support
- [ ] Offline mode
- [ ] Custom fields
- [ ] Task automation
- [ ] Gantt chart view
- [ ] Team workload view

## Performance Optimizations

- Virtual scrolling for large task lists
- Optimistic UI updates
- Query caching with TanStack Query
- Debounced search
- Lazy loading of task details
- Image optimization for avatars

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Running Locally
```bash
cd apps/suite-portal
pnpm install
pnpm dev
```

### Building for Production
```bash
pnpm build
pnpm start
```

### Type Checking
```bash
pnpm type-check
```

## Dependencies

Key dependencies for the tasks feature:

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "framer-motion": "^11.1.7",
  "@tanstack/react-query": "^5.32.0",
  "date-fns": "^3.6.0"
}
```

## Contributing

When contributing to the tasks feature:
1. Maintain TypeScript strict mode
2. Follow the existing component structure
3. Add proper error handling
4. Update types as needed
5. Test drag-and-drop functionality
6. Ensure dark mode compatibility
7. Add proper loading states

## Support

For issues or feature requests related to the tasks feature, please contact the development team or create an issue in the project repository.
