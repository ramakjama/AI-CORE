# Layout Components

This directory contains the main layout components for the AIT Suite Portal application.

## Components

### 1. AppLayout (`app-layout.tsx`)

Main layout wrapper that orchestrates all layout components.

**Features:**
- Responsive design (mobile overlay sidebar, desktop fixed sidebar)
- Escape key closes sidebar on mobile
- Backdrop click closes sidebar on mobile
- Smooth transitions with Framer Motion
- Auto-adjusts based on screen size

**Usage:**
```tsx
import { AppLayout } from '@/components/layout';

export default function Page() {
  return (
    <AppLayout>
      <YourContent />
    </AppLayout>
  );
}
```

---

### 2. Sidebar (`sidebar.tsx`)

Collapsible sidebar with app navigation.

**Features:**
- 14 apps with icons and navigation
- Collapsible (280px expanded, 80px collapsed)
- Active app highlighted with gradient
- Tooltips in collapsed mode (Radix UI)
- Next.js Link navigation
- Framer Motion animations
- Storage usage indicator in footer
- AIT branding in header
- Toggle button with smooth transitions

**Apps Included:**
1. Dashboard
2. Documents
3. Spreadsheets
4. Presentations
5. Calendar
6. Tasks
7. Mail
8. Storage
9. CRM
10. Analytics
11. Notes
12. Forms
13. Bookings
14. Settings

**State Management:**
- Uses `useAppStore` for sidebar state
- Active route detection via `usePathname`

**Styling:**
- Gradient backgrounds for active items
- Dark mode support
- Smooth hover effects
- Icon animations on hover/active

---

### 3. Topbar (`topbar.tsx`)

Top navigation bar with global actions.

**Features:**

**Left Section:**
- App title based on current route
- Breadcrumb navigation for nested routes

**Center Section:**
- Global search button
- Opens Command Menu (Cmd+K)
- Shows keyboard shortcut hint

**Right Section:**
- **Collaboration Avatars**: Shows active collaborators (max 3 + count)
- **AI Assistant Button**: Purple sparkle icon with animated pulse effect
- **Notifications Bell**: With unread indicator dot
- **Dark Mode Toggle**: Sun/Moon icon switch
- **User Menu**: Avatar dropdown with:
  - User info (name + email)
  - Profile link
  - Settings link
  - Logout button

**State Management:**
- Uses `useAppStore` for dark mode and command menu
- Uses `useAuthStore` for user data and logout
- Uses `useCollaborationStore` for active users

**Components Used:**
- Radix UI Dropdown Menu
- Radix UI Avatar
- Framer Motion for animations
- Lucide React icons

---

### 4. CommandMenu (`command-menu.tsx`)

Global command palette (Cmd+K).

**Features:**

**Design:**
- Glassmorphism background (backdrop blur)
- Centered modal with smooth animations
- Keyboard-first navigation
- Fuzzy search via `cmdk` library

**Sections:**
1. **Navigation**: All 14 apps with icons and keywords
2. **Quick Actions**:
   - New Document
   - Upload Files
   - Share
   - Export
3. **Recent Files**: Last opened files with timestamps

**Keyboard Shortcuts:**
- `Cmd/Ctrl + K`: Open/close menu
- `ESC`: Close menu
- `↑↓`: Navigate items
- `↵`: Select item

**Search:**
- Real-time filtering
- Matches labels and keywords
- Shows "No results found" when empty

**Footer:**
- Keyboard hints
- Visual shortcuts guide

**State Management:**
- Uses `useAppStore` for open/close state
- Uses `useCommandK` hook for keyboard binding
- Next.js router for navigation

---

## Hooks

### `use-command-k.ts`

Custom hook for Cmd+K keyboard shortcut.

**Features:**
- Cross-platform (Cmd on Mac, Ctrl on Windows/Linux)
- Prevents default browser behavior
- Auto cleanup on unmount
- Toggles command menu state

**Usage:**
```tsx
import { useCommandK } from '@/hooks/use-command-k';

function MyComponent() {
  useCommandK(); // Automatically binds Cmd+K
  return <div>Press Cmd+K</div>;
}
```

---

## Store Dependencies

### Required Stores

1. **`app.store.ts`**:
   - `isSidebarOpen`: Sidebar collapse state
   - `isCommandMenuOpen`: Command menu visibility
   - `isDarkMode`: Dark mode state
   - `toggleSidebar()`: Toggle sidebar
   - `toggleCommandMenu()`: Toggle command menu
   - `toggleDarkMode()`: Toggle dark mode
   - `toggleAIAssistant()`: Toggle AI assistant panel

2. **`auth.store.ts`**:
   - `user`: Current user object
   - `logout()`: Logout function

3. **`collaboration.store.ts`**:
   - `activeUsers`: Array of active collaborators
   - Each user has: `id`, `name`, `email`, `avatar`, `color`, `isActive`

---

## Dependencies

### Required Packages
```json
{
  "next": "^14.2.3",
  "react": "^18.3.1",
  "zustand": "^4.5.2",
  "framer-motion": "^11.1.7",
  "lucide-react": "^0.376.0",
  "cmdk": "^1.0.0",
  "@radix-ui/react-tooltip": "^1.0.7",
  "@radix-ui/react-dropdown-menu": "^2.0.6",
  "@radix-ui/react-avatar": "^1.0.4"
}
```

---

## File Structure

```
src/
├── components/
│   └── layout/
│       ├── app-layout.tsx      # Main layout wrapper
│       ├── sidebar.tsx          # Collapsible sidebar
│       ├── topbar.tsx           # Top navigation bar
│       ├── command-menu.tsx     # Command palette (Cmd+K)
│       ├── index.ts             # Barrel exports
│       └── README.md            # This file
├── hooks/
│   └── use-command-k.ts         # Cmd+K keyboard hook
└── store/
    ├── app.store.ts             # App state
    ├── auth.store.ts            # Auth state
    └── collaboration.store.ts   # Collaboration state
```

---

## Styling

### Tailwind Classes Used
- **Colors**: `gray-*`, `blue-*`, `purple-*`, `red-*`, etc.
- **Dark Mode**: `dark:` prefix for all components
- **Gradients**: `bg-gradient-to-r`, `bg-gradient-to-br`
- **Borders**: Consistent `border-gray-200 dark:border-gray-800`
- **Shadows**: `shadow-lg`, `shadow-2xl`
- **Backdrop**: `backdrop-blur-sm`, `backdrop-blur-xl`
- **Transitions**: `transition-all`, `transition-colors`

### Animation Variants
- **Sidebar**: Width animation (280px ↔ 80px)
- **Command Menu**: Scale + opacity fade in/out
- **Mobile Sidebar**: Slide from left
- **Active Indicator**: Layout animation for smooth transitions
- **AI Assistant Pulse**: Continuous scale + opacity loop

---

## Responsive Behavior

### Desktop (≥ 1024px)
- Sidebar is fixed and always visible
- Toggle button collapses/expands width
- No backdrop overlay

### Mobile (< 1024px)
- Sidebar is hidden by default
- Opens as overlay when toggled
- Semi-transparent backdrop
- Escape key or backdrop click closes sidebar
- Slide-in animation from left

---

## Accessibility

### Keyboard Navigation
- Full keyboard support in Command Menu
- Arrow keys for navigation
- Enter to select
- Escape to close

### ARIA Labels
- Buttons have `aria-label` attributes
- Command Menu has `label` prop
- Dropdown menu follows Radix UI a11y standards

### Screen Readers
- Semantic HTML structure
- Proper heading hierarchy
- Icon labels for assistive tech

---

## Customization

### Adding New Apps

1. **Add to `apps` array in `sidebar.tsx`**:
```tsx
{
  id: 'new-app',
  name: 'New App',
  icon: YourIcon,
  href: '/new-app',
  gradient: 'from-color-500 to-color-600',
}
```

2. **Add route title in `topbar.tsx`**:
```tsx
const routeTitles: Record<string, string> = {
  '/new-app': 'New App',
  // ...
};
```

3. **Add to navigation in `command-menu.tsx`**:
```tsx
{
  id: 'new-app',
  label: 'New App',
  icon: YourIcon,
  href: '/new-app',
  keywords: ['keyword1', 'keyword2'],
}
```

### Changing Sidebar Width

Edit the `width` values in `sidebar.tsx`:
```tsx
animate={{
  width: isSidebarOpen ? 320 : 80, // Change 280 to your width
}}
```

### Changing Colors

All gradients use Tailwind color classes. Modify in each component:
```tsx
gradient: 'from-emerald-500 to-teal-600'
```

---

## Performance Considerations

- **Framer Motion**: Uses `layoutId` for smooth transitions
- **Lazy Loading**: Icons are tree-shaken by Lucide React
- **Zustand**: Minimal re-renders with selector pattern
- **Command Menu**: Only rendered when open (AnimatePresence)
- **Radix UI**: Highly optimized, accessible components

---

## Future Enhancements

- [ ] Pin favorite apps to top of sidebar
- [ ] Customizable sidebar order (drag & drop)
- [ ] Recent apps section
- [ ] Search within command menu with API results
- [ ] Command history
- [ ] Custom keyboard shortcuts per app
- [ ] Sidebar themes (different color schemes)
- [ ] Workspace switcher in topbar
- [ ] Breadcrumb click navigation
- [ ] Notification center dropdown
- [ ] AI Assistant integration panel

---

## Troubleshooting

### Sidebar not collapsing
- Check `useAppStore` is properly initialized
- Verify `isSidebarOpen` state in Redux DevTools
- Ensure Framer Motion is installed

### Command Menu not opening
- Verify `cmdk` package is installed
- Check keyboard event listener in `use-command-k.ts`
- Ensure `isCommandMenuOpen` state updates

### Icons not showing
- Install `lucide-react` package
- Check icon imports in each component
- Verify Tailwind is processing the components

### Dark mode not working
- Ensure `next-themes` is configured
- Check `dark:` classes in Tailwind config
- Verify `isDarkMode` state in store

### Tooltips not appearing
- Install `@radix-ui/react-tooltip`
- Wrap component with `<Tooltip.Provider>`
- Check `delayDuration` prop value

---

## Support

For issues or questions:
1. Check this README
2. Review component source code
3. Check store implementations
4. Verify all dependencies are installed
5. Test in different browsers/devices

---

**Created for AIT Suite Portal v1.0.0**
