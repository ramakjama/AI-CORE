# AIT Suite Portal - Layout Architecture

## Component Hierarchy

```
AppLayout (app-layout.tsx)
│
├── Mobile Backdrop (conditional)
│   └── [Dark overlay for mobile sidebar]
│
├── Sidebar (sidebar.tsx)
│   ├── Header
│   │   ├── AIT Logo
│   │   └── Brand Text (collapsible)
│   │
│   ├── Navigation
│   │   └── App Links (14 apps)
│   │       ├── Icon
│   │       ├── Label (collapsible)
│   │       ├── Active Indicator
│   │       └── Tooltip (collapsed mode)
│   │
│   ├── Footer
│   │   └── Storage Usage
│   │       ├── Progress Bar
│   │       └── Storage Stats (collapsible)
│   │
│   └── Toggle Button
│
├── Main Content
│   ├── Topbar (topbar.tsx)
│   │   ├── Left Section
│   │   │   ├── Page Title
│   │   │   └── Breadcrumbs
│   │   │
│   │   ├── Center Section
│   │   │   └── Search Button (opens Command Menu)
│   │   │
│   │   └── Right Section
│   │       ├── Collaboration Avatars
│   │       ├── AI Assistant Button
│   │       ├── Notifications Bell
│   │       ├── Dark Mode Toggle
│   │       └── User Menu Dropdown
│   │           ├── User Info
│   │           ├── Profile Link
│   │           ├── Settings Link
│   │           └── Logout Button
│   │
│   └── Content Area
│       └── {children} (Your app pages)
│
└── CommandMenu (command-menu.tsx)
    ├── Backdrop
    └── Command Panel
        ├── Search Input
        ├── Command List
        │   ├── Navigation Section (14 apps)
        │   ├── Quick Actions Section
        │   └── Recent Files Section
        └── Footer (keyboard hints)
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Interaction                      │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   UI Event   │          │  Keyboard    │
│   (Click)    │          │  (Cmd+K)     │
└──────┬───────┘          └──────┬───────┘
       │                         │
       │                         │
       ▼                         ▼
┌─────────────────────────────────────┐
│        Zustand Store Actions        │
│  ┌──────────────────────────────┐  │
│  │ useAppStore                  │  │
│  │ - toggleSidebar()            │  │
│  │ - toggleCommandMenu()        │  │
│  │ - toggleDarkMode()           │  │
│  │ - toggleAIAssistant()        │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ useAuthStore                 │  │
│  │ - logout()                   │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ useCollaborationStore        │  │
│  │ - activeUsers                │  │
│  └──────────────────────────────┘  │
└─────────────────┬───────────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  State Update   │
        └────────┬────────┘
                 │
                 ▼
┌────────────────────────────────────┐
│      Component Re-render           │
│  - Sidebar width changes           │
│  - Command menu opens/closes       │
│  - Dark mode applied               │
│  - UI updates                      │
└────────────────────────────────────┘
```

---

## State Management

### App Store Flow

```
┌──────────────────────────────────────────────────────────┐
│                    useAppStore                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  State:                         Actions:                 │
│  ├─ isSidebarOpen              ├─ toggleSidebar()        │
│  ├─ isCommandMenuOpen          ├─ toggleCommandMenu()    │
│  ├─ isDarkMode                 ├─ toggleDarkMode()       │
│  ├─ isAIAssistantOpen          ├─ toggleAIAssistant()    │
│  └─ isCollaborationBarVisible  └─ setCollaborationBar()  │
│                                                           │
│  Persistence: localStorage                               │
│  Keys: app-storage                                       │
│                                                           │
└──────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
   ┌─────────┐         ┌──────────┐        ┌─────────┐
   │ Sidebar │         │ Command  │        │ Topbar  │
   │         │         │  Menu    │        │         │
   └─────────┘         └──────────┘        └─────────┘
```

---

## Animation Flow

### Sidebar Collapse Animation

```
User clicks toggle button
        │
        ▼
toggleSidebar() called
        │
        ▼
isSidebarOpen state flips
        │
        ▼
Framer Motion detects state change
        │
        ▼
Animates width: 280px → 80px (or reverse)
        │
        ├─→ Icon stays visible
        ├─→ Text fades out
        └─→ Tooltips activate
```

### Command Menu Animation

```
User presses Cmd+K
        │
        ▼
useCommandK hook captures event
        │
        ▼
toggleCommandMenu() called
        │
        ▼
isCommandMenuOpen = true
        │
        ▼
AnimatePresence triggers
        │
        ├─→ Backdrop fades in
        └─→ Menu scales + fades in
        │
        ▼
Command panel rendered
        │
        └─→ Focus trapped in search input
```

---

## Responsive Breakpoints

```
┌─────────────────────────────────────────────────────────┐
│                   Screen Sizes                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Mobile (< 640px)                                       │
│  ├─ Sidebar: Overlay (hidden by default)               │
│  ├─ Topbar: Compressed                                  │
│  └─ Command Menu: Full screen                          │
│                                                          │
│  Tablet (640px - 1024px)                                │
│  ├─ Sidebar: Overlay (hidden by default)               │
│  ├─ Topbar: Full features                              │
│  └─ Command Menu: Centered modal                       │
│                                                          │
│  Desktop (≥ 1024px)                                     │
│  ├─ Sidebar: Fixed (always visible)                    │
│  ├─ Topbar: Full features                              │
│  └─ Command Menu: Centered modal                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## File Dependencies

```
app-layout.tsx
├── imports
│   ├── Sidebar
│   ├── Topbar
│   ├── CommandMenu
│   └── useAppStore
└── provides
    └── Layout wrapper for all pages

sidebar.tsx
├── imports
│   ├── useAppStore (sidebar state)
│   ├── usePathname (active route)
│   ├── Radix Tooltip
│   ├── Framer Motion
│   └── Lucide Icons (14)
└── exports
    └── Sidebar component

topbar.tsx
├── imports
│   ├── useAppStore (command menu, dark mode)
│   ├── useAuthStore (user, logout)
│   ├── useCollaborationStore (active users)
│   ├── Radix Dropdown & Avatar
│   ├── Framer Motion
│   └── Lucide Icons
└── exports
    └── Topbar component

command-menu.tsx
├── imports
│   ├── useAppStore (menu state)
│   ├── useCommandK (keyboard hook)
│   ├── useRouter (navigation)
│   ├── cmdk (Command component)
│   ├── Framer Motion
│   └── Lucide Icons
└── exports
    └── CommandMenu component

use-command-k.ts
├── imports
│   └── useAppStore
└── exports
    └── useCommandK hook
```

---

## Event Handling

### Keyboard Events

```
Document Level
├── Cmd/Ctrl + K → Open Command Menu
├── Escape → Close Command Menu/Sidebar (mobile)
└── Arrow Keys → Navigate Command Menu

Component Level
├── Sidebar Toggle → Toggle sidebar width
├── Dark Mode Toggle → Toggle theme
└── User Menu → Open/close dropdown
```

### Mouse Events

```
Click Events
├── Backdrop Click (mobile) → Close sidebar
├── App Link Click → Navigate to app
├── Command Item Click → Execute action
├── User Menu Item → Execute action
└── Notifications Bell → Open notifications

Hover Events
├── Sidebar Item Hover → Scale icon
├── Tooltip Trigger → Show tooltip (collapsed mode)
└── Button Hover → Change background
```

---

## Performance Optimizations

### 1. Lazy Loading

```
Component Tree
├── Sidebar (always rendered)
├── Topbar (always rendered)
└── CommandMenu (only when open)
    └── AnimatePresence unmounts when closed
```

### 2. State Selectors

```tsx
// ✅ Good - Only re-renders on specific state change
const { isSidebarOpen } = useAppStore();

// ❌ Bad - Re-renders on any store change
const store = useAppStore();
```

### 3. Icon Tree Shaking

```tsx
// ✅ Good - Only imports used icons
import { Home, Settings } from 'lucide-react';

// ❌ Bad - Imports entire library
import * as Icons from 'lucide-react';
```

### 4. Memo & Callbacks

```tsx
// For expensive renders
const MemoizedAvatar = React.memo(CollaboratorAvatar);

// For stable callbacks
const handleClick = useCallback(() => {
  // action
}, [deps]);
```

---

## Security Considerations

### 1. XSS Prevention

```tsx
// User content is always escaped by React
<span>{user.name}</span> // Safe

// Dangerous HTML is explicitly marked
<div dangerouslySetInnerHTML={{ __html: content }} /> // Avoid
```

### 2. Authentication

```tsx
// Protected routes check auth state
const { isAuthenticated } = useAuthStore();

if (!isAuthenticated) {
  return <Redirect to="/login" />;
}
```

### 3. Token Storage

```tsx
// Tokens stored securely in Zustand persist
// Uses localStorage with encryption (implement separately)
persist(state, {
  name: 'auth-storage',
  partialize: (state) => ({ tokens: state.tokens }), // Only persist tokens
});
```

---

## Testing Strategy

### Unit Tests

```
├── Sidebar Component
│   ├── Renders all 14 apps
│   ├── Highlights active app
│   ├── Collapses/expands on toggle
│   └── Shows tooltips when collapsed
│
├── Topbar Component
│   ├── Displays user info
│   ├── Opens command menu
│   ├── Toggles dark mode
│   └── Shows collaboration avatars
│
├── CommandMenu Component
│   ├── Opens with Cmd+K
│   ├── Filters items on search
│   ├── Navigates on item select
│   └── Closes on Escape
│
└── Stores
    ├── App store actions
    ├── Auth store actions
    └── Collaboration store actions
```

### Integration Tests

```
├── User Flow: Navigate between apps
├── User Flow: Search and execute command
├── User Flow: Toggle dark mode
├── User Flow: Logout
└── User Flow: Collaborative session
```

### E2E Tests (Playwright)

```
├── Full navigation flow
├── Responsive behavior
├── Keyboard shortcuts
└── Authentication flow
```

---

## Browser Compatibility

```
Minimum Supported Versions:
├── Chrome: 90+
├── Firefox: 88+
├── Safari: 14+
├── Edge: 90+
└── Mobile Safari: 14+

Features Used:
├── CSS Grid & Flexbox ✅
├── CSS Custom Properties ✅
├── ES6+ JavaScript ✅
├── localStorage API ✅
└── Keyboard Events ✅
```

---

## Accessibility (a11y)

### ARIA Labels

```tsx
<button aria-label="Toggle sidebar">...</button>
<nav aria-label="Main navigation">...</nav>
<search role="search">...</search>
```

### Keyboard Navigation

```
Tab Order:
1. Sidebar toggle
2. App links (focus visible)
3. Search button
4. User actions
5. User menu
```

### Screen Reader Support

```
├── Semantic HTML elements
├── Alt text for images/icons
├── ARIA roles for custom components
└── Focus management in modals
```

### Color Contrast

```
WCAG AAA Compliant:
├── Text: 7:1 contrast ratio
├── UI Elements: 4.5:1 contrast ratio
└── Focus indicators: Visible in all themes
```

---

## Deployment Checklist

- [ ] All TypeScript types defined
- [ ] Error boundaries implemented
- [ ] Loading states for async operations
- [ ] Analytics tracking setup
- [ ] Responsive testing on real devices
- [ ] Keyboard navigation tested
- [ ] Screen reader tested
- [ ] Performance profiling done
- [ ] Bundle size optimized
- [ ] Dark mode tested thoroughly
- [ ] RTL support (if needed)
- [ ] Browser testing (Chrome, Firefox, Safari)

---

## Future Architecture Enhancements

### Phase 1 (Current)
- ✅ Basic layout structure
- ✅ Sidebar navigation
- ✅ Command menu
- ✅ User menu
- ✅ Dark mode

### Phase 2 (Next)
- [ ] AI Assistant panel
- [ ] Notification center
- [ ] Real-time collaboration UI
- [ ] Workspace switcher
- [ ] Custom themes

### Phase 3 (Future)
- [ ] Plugin system
- [ ] Custom sidebar order
- [ ] Pinned apps
- [ ] Recent apps
- [ ] Advanced search with API

---

**Architecture Version:** 1.0.0
**Last Updated:** 2026-01-28
**Maintainer:** AIT-CORE Team
