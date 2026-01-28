# AIT Suite Portal - Layout Components Quick Start Guide

## Overview

This guide provides a quick reference for implementing and using the AIT Suite Portal layout components.

## Quick Start

### 1. Basic Implementation

Wrap your app with `AppLayout` in your root layout:

```tsx
// app/layout.tsx
import { AppLayout } from '@/components/layout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}
```

### 2. Create a Page

```tsx
// app/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p>Your content here...</p>
    </div>
  );
}
```

That's it! The layout automatically includes:
- Collapsible sidebar with 14 apps
- Topbar with search, notifications, and user menu
- Command menu (Cmd+K)
- Responsive design
- Dark mode support

---

## Component Structure

```
┌─────────────────────────────────────────────────┐
│ Topbar                                           │
│ [Title] [Search] [Collab] [AI] [Bell] [User]   │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │ Main Content Area                    │
│          │                                       │
│ [Apps]   │ {children}                           │
│          │                                       │
│ [Storage]│                                       │
└──────────┴──────────────────────────────────────┘

[Command Menu - Cmd+K]
```

---

## Features Included

### Sidebar
- ✅ 14 pre-configured apps with icons
- ✅ Collapsible (280px → 80px)
- ✅ Active app highlighting with gradient
- ✅ Tooltips in collapsed mode
- ✅ Storage usage indicator
- ✅ Smooth animations
- ✅ Responsive (overlay on mobile)

### Topbar
- ✅ Breadcrumb navigation
- ✅ Global search button
- ✅ Collaboration avatars
- ✅ AI Assistant with pulse animation
- ✅ Notifications bell
- ✅ Dark mode toggle
- ✅ User dropdown menu

### Command Menu
- ✅ Cmd/Ctrl + K to open
- ✅ Fuzzy search
- ✅ Navigation shortcuts
- ✅ Quick actions
- ✅ Recent files
- ✅ Keyboard navigation
- ✅ Glassmorphism design

---

## Available Apps (Routes)

| App | Route | Icon |
|-----|-------|------|
| Dashboard | `/dashboard` | LayoutDashboard |
| Documents | `/documents` | FileText |
| Spreadsheets | `/spreadsheets` | Sheet |
| Presentations | `/presentations` | Presentation |
| Calendar | `/calendar` | Calendar |
| Tasks | `/tasks` | CheckSquare |
| Mail | `/mail` | Mail |
| Storage | `/storage` | HardDrive |
| CRM | `/crm` | Users |
| Analytics | `/analytics` | BarChart3 |
| Notes | `/notes` | StickyNote |
| Forms | `/forms` | FormInput |
| Bookings | `/bookings` | CalendarCheck |
| Settings | `/settings` | Settings |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command menu |
| `ESC` | Close command menu / sidebar (mobile) |
| `↑ ↓` | Navigate command menu |
| `↵` | Select item |

---

## Store Integration

The components use three Zustand stores:

### 1. App Store (`useAppStore`)

```tsx
import { useAppStore } from '@/store/app.store';

// Available state
const {
  isSidebarOpen,        // boolean
  isCommandMenuOpen,    // boolean
  isDarkMode,           // boolean
  isAIAssistantOpen,    // boolean

  toggleSidebar,        // () => void
  toggleCommandMenu,    // () => void
  toggleDarkMode,       // () => void
  toggleAIAssistant,    // () => void
} = useAppStore();
```

### 2. Auth Store (`useAuthStore`)

```tsx
import { useAuthStore } from '@/store/auth.store';

// Available state
const {
  user,          // User | null
  isAuthenticated, // boolean
  logout,        // () => void
} = useAuthStore();
```

### 3. Collaboration Store (`useCollaborationStore`)

```tsx
import { useCollaborationStore } from '@/store/collaboration.store';

// Available state
const {
  activeUsers,     // CollaborationUser[]
  isCollaborating, // boolean
} = useCollaborationStore();
```

---

## Customization Examples

### 1. Add a New App

**Step 1:** Add to sidebar (`sidebar.tsx`):

```tsx
const apps: AppItem[] = [
  // ... existing apps
  {
    id: 'chat',
    name: 'Chat',
    icon: MessageSquare,
    href: '/chat',
    gradient: 'from-blue-500 to-cyan-500',
  },
];
```

**Step 2:** Add route title (`topbar.tsx`):

```tsx
const routeTitles: Record<string, string> = {
  // ... existing routes
  '/chat': 'Chat',
};
```

**Step 3:** Add to command menu (`command-menu.tsx`):

```tsx
const navigationItems: NavigationItem[] = [
  // ... existing items
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    href: '/chat',
    keywords: ['messages', 'conversation'],
  },
];
```

### 2. Change Sidebar Width

```tsx
// sidebar.tsx
animate={{
  width: isSidebarOpen ? 320 : 100, // Instead of 280 and 80
}}
```

### 3. Add Custom Quick Action

```tsx
// command-menu.tsx
const quickActions: QuickAction[] = [
  // ... existing actions
  {
    id: 'new-meeting',
    label: 'Schedule Meeting',
    icon: Calendar,
    onSelect: () => {
      router.push('/calendar/new');
      setCommandMenuOpen(false);
    },
    keywords: ['call', 'video'],
  },
];
```

### 4. Customize User Menu

```tsx
// topbar.tsx - Add menu item
<DropdownMenu.Item className="...">
  <HelpCircle className="w-4 h-4" />
  <span>Help & Support</span>
</DropdownMenu.Item>
```

---

## Responsive Behavior

### Desktop (≥ 1024px)
```
┌────────┬─────────────────┐
│ Sidebar│ Content         │
│ (fixed)│                 │
└────────┴─────────────────┘
```

### Tablet/Mobile (< 1024px)
```
┌─────────────────────────┐
│ Content (full width)    │
│                         │
└─────────────────────────┘

[Sidebar overlay when opened]
```

---

## Styling Guide

### Color Scheme

**Light Mode:**
- Background: `bg-white`, `bg-gray-50`
- Text: `text-gray-900`, `text-gray-700`
- Borders: `border-gray-200`

**Dark Mode:**
- Background: `bg-gray-900`, `bg-gray-950`
- Text: `text-white`, `text-gray-300`
- Borders: `border-gray-800`

### Gradients

Each app has a unique gradient:
```tsx
'from-blue-500 to-cyan-500'      // Dashboard
'from-purple-500 to-pink-500'    // Documents
'from-green-500 to-emerald-500'  // Spreadsheets
// ... etc
```

---

## Common Patterns

### 1. Toggle Sidebar Programmatically

```tsx
import { useAppStore } from '@/store/app.store';

function MyComponent() {
  const { toggleSidebar } = useAppStore();

  return (
    <button onClick={toggleSidebar}>
      Toggle Sidebar
    </button>
  );
}
```

### 2. Open Command Menu

```tsx
import { useAppStore } from '@/store/app.store';

function MyComponent() {
  const { setCommandMenuOpen } = useAppStore();

  return (
    <button onClick={() => setCommandMenuOpen(true)}>
      Search
    </button>
  );
}
```

### 3. Check Dark Mode

```tsx
import { useAppStore } from '@/store/app.store';

function MyComponent() {
  const { isDarkMode } = useAppStore();

  return (
    <div className={isDarkMode ? 'dark-theme' : 'light-theme'}>
      Content
    </div>
  );
}
```

### 4. Add Collaboration User

```tsx
import { useCollaborationStore } from '@/store/collaboration.store';

function MyComponent() {
  const { addUser } = useCollaborationStore();

  const handleJoin = () => {
    addUser({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '/avatar.jpg',
      color: '#3B82F6',
      isActive: true,
      lastSeen: new Date(),
    });
  };

  return <button onClick={handleJoin}>Join</button>;
}
```

---

## Testing Checklist

- [ ] Sidebar collapses/expands smoothly
- [ ] Active app is highlighted
- [ ] Tooltips appear in collapsed mode
- [ ] Command menu opens with Cmd+K
- [ ] Search filters items correctly
- [ ] Navigation works from command menu
- [ ] Dark mode toggles correctly
- [ ] Mobile sidebar overlays properly
- [ ] Escape closes mobile sidebar
- [ ] User menu shows correct info
- [ ] Collaboration avatars display
- [ ] AI Assistant button has pulse
- [ ] Notifications bell shows dot
- [ ] Breadcrumbs update on navigation
- [ ] Storage indicator shows progress

---

## Performance Tips

1. **Lazy Load Icons**: Lucide React auto tree-shakes unused icons
2. **Memoize User Data**: Use `React.memo` for user avatar components
3. **Debounce Search**: Add debounce to command menu search input
4. **Virtual Lists**: For large file lists in command menu
5. **Code Splitting**: Load command menu only when needed

---

## Troubleshooting

### Sidebar not visible
- Check `isSidebarOpen` in app store
- Verify screen size (hidden on mobile by default)
- Check z-index conflicts

### Command menu not opening
- Verify Cmd+K handler in `use-command-k.ts`
- Check `cmdk` package installation
- Test with button click (not just keyboard)

### Dark mode not working
- Ensure `dark:` classes are in Tailwind config
- Check `isDarkMode` state
- Verify `next-themes` setup

### Icons missing
- Install `lucide-react` package
- Check icon imports
- Verify icon name spelling

---

## File Locations

```
apps/suite-portal/
├── src/
│   ├── components/
│   │   └── layout/
│   │       ├── app-layout.tsx
│   │       ├── sidebar.tsx
│   │       ├── topbar.tsx
│   │       ├── command-menu.tsx
│   │       ├── index.ts
│   │       └── README.md
│   ├── hooks/
│   │   └── use-command-k.ts
│   └── store/
│       ├── app.store.ts
│       ├── auth.store.ts
│       └── collaboration.store.ts
└── LAYOUT_COMPONENTS_GUIDE.md (this file)
```

---

## Next Steps

1. ✅ Components created
2. ⬜ Add authentication flow
3. ⬜ Implement AI Assistant panel
4. ⬜ Add notification center
5. ⬜ Create individual app pages
6. ⬜ Setup real-time collaboration
7. ⬜ Add user preferences
8. ⬜ Implement search API
9. ⬜ Add analytics tracking
10. ⬜ Setup error boundaries

---

## Support & Documentation

- **Full Documentation**: See `README.md` in `components/layout/`
- **Store Documentation**: Check individual store files
- **Component API**: TypeScript types in each component
- **Examples**: See usage patterns above

---

**Built with:**
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI
- Zustand
- cmdk
- Lucide React

**Version:** 1.0.0
**Last Updated:** 2026-01-28
