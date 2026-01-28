# Spreadsheets Module - Architecture Diagram

## Visual Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SPREADSHEETS PAGE                                  │
│                        (page.tsx - Main Component)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
        ┌───────────▼──────────┐       ┌───────────▼──────────────┐
        │      SIDEBAR         │       │     MAIN CONTENT         │
        │  (w-64 border-r)     │       │   (flex-1 flex-col)      │
        └──────────────────────┘       └──────────────────────────┘
                    │                               │
        ┌───────────┴───────────┐       ┌───────────┴──────────────┐
        │                       │       │                          │
    ┌───▼────┐          ┌──────▼───┐   │                          │
    │  NEW   │          │   TABS   │   │                          │
    │ BUTTON │          │ COMPONENT│   │                          │
    └────────┘          └──────────┘   │                          │
                             │          │                          │
                    ┌────────┴────────┐ │                          │
                    │                 │ │                          │
            ┌───────▼──────┐  ┌──────▼─▼──┐                       │
            │    RECENT    │  │  ALL FILES │                       │
            │  (Tab Panel) │  │ (Tab Panel)│                       │
            └──────────────┘  └────────────┘                       │
                    │                 │                            │
            ┌───────▼─────────────────▼───────┐                    │
            │    SPREADSHEET LIST             │                    │
            │  (ScrollArea with items)        │                    │
            │  - File Icons                   │                    │
            │  - Titles                       │                    │
            │  - Dates                        │                    │
            │  - Delete Buttons (on hover)    │                    │
            └─────────────────────────────────┘                    │
                                                                   │
            ┌──────────────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │   TOP BAR      │
    │   (h-16)       │
    └────────────────┘
            │
    ┌───────┴────────────────────────────────────────────┐
    │  Icon  │  Title (Editable)  │  Collab  │  Share  │
    │        │                    │  Status  │  Export │
    │        │                    │          │  Save   │
    └────────────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │   TOOLBAR      │
    │   (border-b)   │
    └────────────────┘
            │
    ┌───────┴────────────────────────────────────────────────────┐
    │  Undo/Redo │ Bold/Italic/Underline │ Colors │ Align │ ... │
    │            │                       │        │       │     │
    │  ↶  ↷     │   B   I   U   A   ▦  │  ≣ ≣ ≣ │ $ % # │ ... │
    └────────────────────────────────────────────────────────────┘
            │
    ┌───────┴──────────────┐
    │  HANDSONTABLE EDITOR │
    │  (flex-1 overflow)   │
    └──────────────────────┘
            │
    ┌───────┴────────────────────────────────────┐
    │ ┌─────────────────────────────────────────┐│
    │ │  COL HEADERS (A, B, C, D, E, ...)      ││
    │ ├─┬────┬────┬────┬────┬────┬────┬────┬───┤│
    │ │1│    │    │    │    │    │    │    │   ││
    │ ├─┼────┼────┼────┼────┼────┼────┼────┼───┤│
    │ │2│    │    │    │    │    │    │    │   ││
    │ ├─┼────┼────┼────┼────┼────┼────┼────┼───┤│
    │ │3│    │    │    │    │    │    │    │   ││
    │ ├─┼────┼────┼────┼────┼────┼────┼────┼───┤│
    │ │.│    │    │    │    │    │    │    │   ││
    │ └─┴────┴────┴────┴────┴────┴────┴────┴───┘│
    │                                            │
    │  - 100 rows × 26 columns                  │
    │  - Context menu (right-click)             │
    │  - Cell editing                           │
    │  - Formula calculation                    │
    │  - Copy/paste                             │
    │  - Auto-fill                              │
    └────────────────────────────────────────────┘
            │
    ┌───────┴──────────┐
    │   SHEET TABS     │
    │   (border-t)     │
    └──────────────────┘
            │
    ┌───────┴─────────────────────────────────────┐
    │ [ Sheet 1 ] [ Sheet 2 ] [ Sheet 3 ] [  +  ] │
    │   (Active)                                   │
    └──────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER ACTIONS                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────┐  ┌──────▼─────┐  ┌─────▼──────┐
        │   Click    │  │   Type     │  │  Format    │
        │   Cell     │  │   Data     │  │  Cells     │
        └────────────┘  └────────────┘  └────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                        ┌───────▼────────┐
                        │  REACT STATE   │
                        │   (useState)   │
                        └────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────┐  ┌──────▼─────┐  ┌─────▼──────┐
        │   sheets   │  │ cellStyles │  │ selected   │
        │   Array    │  │    Map     │  │   Cells    │
        └────────────┘  └────────────┘  └────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                        ┌───────▼────────┐
                        │  HANDSONTABLE  │
                        │    RENDER      │
                        └────────────────┘
                                │
                        ┌───────▼────────┐
                        │   USER SEES    │
                        │   CHANGES      │
                        └────────────────┘
```

## API Integration Flow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    USER      │         │  COMPONENT   │         │   TANSTACK   │
│   ACTION     │────────▶│   HANDLER    │────────▶│    QUERY     │
└──────────────┘         └──────────────┘         └──────────────┘
                                                           │
                                                           │
┌──────────────┐         ┌──────────────┐         ┌──────▼───────┐
│  BACKEND     │◀────────│  API CLIENT  │◀────────│   MUTATION   │
│  DATABASE    │         │   (Axios)    │         │   /QUERY     │
└──────────────┘         └──────────────┘         └──────────────┘
       │                         │
       │                         │
       └─────────────┬───────────┘
                     │
             ┌───────▼────────┐
             │   RESPONSE     │
             │   SUCCESS      │
             └────────────────┘
                     │
             ┌───────▼────────┐
             │  CACHE UPDATE  │
             │  RE-RENDER     │
             └────────────────┘
```

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENT STATE                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ spreadsheet  │  │    sheets    │  │ cellStyles   │         │
│  │     Id       │  │    Array     │  │     Map      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ sheetIndex   │  │    title     │  │ selected     │         │
│  │   Number     │  │    String    │  │   Cells      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼────┐  ┌──────▼─────┐  ┌─────▼──────┐
        │  TANSTACK  │  │ HANDSONTABLE│ │   LOCAL    │
        │   QUERY    │  │    STATE    │ │  STORAGE   │
        │   CACHE    │  │             │ │            │
        └────────────┘  └────────────┘  └────────────┘
```

## File Structure Tree

```
suite-portal/
├── src/
│   ├── app/
│   │   └── spreadsheets/
│   │       ├── page.tsx                    ← Main component
│   │       ├── spreadsheet-theme.css       ← Dark theme
│   │       ├── README.md                   ← User docs
│   │       ├── QUICKSTART.md              ← Quick guide
│   │       ├── IMPLEMENTATION_SUMMARY.md  ← Tech docs
│   │       ├── FEATURE_CHECKLIST.md       ← Testing
│   │       ├── ARCHITECTURE.md            ← This file
│   │       └── FILES_CREATED.txt          ← File list
│   │
│   ├── components/
│   │   └── ui/
│   │       ├── separator.tsx              ← Separator
│   │       ├── tabs.tsx                   ← Tabs
│   │       ├── button.tsx                 ← Button
│   │       ├── input.tsx                  ← Input
│   │       ├── dialog.tsx                 ← Dialog
│   │       ├── dropdown-menu.tsx          ← Dropdown
│   │       ├── scroll-area.tsx            ← ScrollArea
│   │       └── badge.tsx                  ← Badge
│   │
│   └── lib/
│       ├── api.ts                         ← API client
│       └── utils.ts                       ← Utilities
│
└── package.json                           ← Dependencies
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
│  Next.js 14 App Router │ React 18 │ TypeScript                  │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      UI LAYER                                   │
│  Radix UI Primitives │ Tailwind CSS │ Lucide Icons              │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                          │
│  Handsontable │ Custom Handlers │ Formula Engine                │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                   STATE MANAGEMENT LAYER                        │
│  TanStack Query │ React Hooks │ Cell Styles Map                 │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                  │
│  Axios Client │ Interceptors │ Token Management                 │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                               │
│  REST API │ Database │ Authentication │ Export Service          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Interaction Diagram

```
┌────────────┐
│   USER     │
└─────┬──────┘
      │ Clicks/Types
      ▼
┌────────────────────────────────────────────────────────────────┐
│                      PAGE COMPONENT                            │
│                                                                │
│  ┌──────────────┐         ┌──────────────┐                   │
│  │   SIDEBAR    │────────▶│  MAIN AREA   │                   │
│  │              │         │              │                   │
│  │ - File List  │         │ - Top Bar    │                   │
│  │ - New Button │         │ - Toolbar    │                   │
│  │ - Tabs       │         │ - Editor     │                   │
│  └──────┬───────┘         │ - Sheet Tabs │                   │
│         │                 └──────┬───────┘                   │
│         │                        │                           │
│         │ setCurrentId           │ handleFormat              │
│         ▼                        ▼                           │
│  ┌──────────────────────────────────────┐                   │
│  │          SHARED STATE                │                   │
│  │  - currentSpreadsheetId              │                   │
│  │  - sheets[]                          │                   │
│  │  - cellStyles Map                    │                   │
│  │  - selectedCells                     │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                            │
│                 ▼                                            │
│  ┌──────────────────────────────────────┐                   │
│  │       HANDSONTABLE INSTANCE          │                   │
│  │  - Data grid                         │                   │
│  │  - Formula engine                    │                   │
│  │  - Event handlers                    │                   │
│  └──────────────┬───────────────────────┘                   │
│                 │                                            │
└─────────────────┼────────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │   TANSTACK     │
         │    QUERY       │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │   API CLIENT   │
         └────────┬───────┘
                  │
                  ▼
         ┌────────────────┐
         │    BACKEND     │
         └────────────────┘
```

## Event Flow Diagram

```
USER TYPES IN CELL
        │
        ▼
┌───────────────┐
│ Handsontable  │
│  onChange     │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ handleData    │
│   Change      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Update sheets │
│    Array      │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Auto-save     │
│  (debounced)  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ API Call      │
│ PUT /id       │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│ Cache Update  │
│ TanStack Q    │
└───────────────┘
```

## Rendering Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  1. COMPONENT MOUNT                                             │
│     - Initialize state                                          │
│     - Fetch spreadsheet data                                    │
│     - Register Handsontable modules                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  2. DATA LOADING                                                │
│     - TanStack Query fetches data                               │
│     - Loading state displays                                    │
│     - Data arrives and updates state                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  3. HANDSONTABLE INITIALIZATION                                 │
│     - Create HOT instance with settings                         │
│     - Apply dark theme                                          │
│     - Load data into grid                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  4. CELL RENDERING                                              │
│     - Render 100×26 cells                                       │
│     - Apply cell styles from Map                                │
│     - Apply number formats                                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  5. EVENT LISTENERS                                             │
│     - Attach onChange handlers                                  │
│     - Attach selection handlers                                 │
│     - Enable context menu                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  6. READY FOR USER INTERACTION                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Memory Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY ALLOCATION                            │
│                                                                 │
│  Component State:           ~10 KB                              │
│  ├─ sheets Array            ~8 KB (100×26 cells)                │
│  ├─ cellStyles Map          ~1 KB                               │
│  └─ Other state             ~1 KB                               │
│                                                                 │
│  Handsontable Instance:     ~5 MB                               │
│  ├─ Grid data               ~2 MB                               │
│  ├─ Rendered DOM            ~2 MB                               │
│  └─ Plugin data             ~1 MB                               │
│                                                                 │
│  TanStack Query Cache:      ~100 KB                             │
│  └─ Cached spreadsheets     ~100 KB                             │
│                                                                 │
│  Total (approx):            ~5.1 MB per spreadsheet             │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Optimization Points

```
┌─────────────────────────────────────────────────────────────────┐
│  OPTIMIZATION AREAS                                             │
│                                                                 │
│  1. Virtual Scrolling                                           │
│     - Only render visible cells                                 │
│     - Handsontable handles automatically                        │
│                                                                 │
│  2. Debounced Auto-save                                         │
│     - Batch multiple changes                                    │
│     - Save after 1 second of inactivity                         │
│                                                                 │
│  3. Memoized Components                                         │
│     - Toolbar buttons (React.memo)                              │
│     - Sidebar items (React.memo)                                │
│     - Color pickers (useMemo)                                   │
│                                                                 │
│  4. Query Caching                                               │
│     - TanStack Query caches responses                           │
│     - Reduces API calls                                         │
│     - Stale time: 5 minutes                                     │
│                                                                 │
│  5. Lazy Loading                                                │
│     - Load spreadsheet data on demand                           │
│     - Don't load all files upfront                              │
│     - Pagination for large lists                                │
└─────────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                              │
│                                                                 │
│  ┌───────────────────────────────────────┐                     │
│  │  1. AUTHENTICATION                    │                     │
│  │     - JWT tokens                      │                     │
│  │     - Auto-refresh on 401             │                     │
│  │     - Secure token storage            │                     │
│  └───────────────────────────────────────┘                     │
│                    │                                            │
│  ┌───────────────────────────────────────┐                     │
│  │  2. AUTHORIZATION                     │                     │
│  │     - API validates user permissions  │                     │
│  │     - Share permissions enforced      │                     │
│  │     - Owner-only operations           │                     │
│  └───────────────────────────────────────┘                     │
│                    │                                            │
│  ┌───────────────────────────────────────┐                     │
│  │  3. INPUT VALIDATION                  │                     │
│  │     - Handsontable sanitizes input    │                     │
│  │     - XSS prevention                  │                     │
│  │     - Formula validation              │                     │
│  └───────────────────────────────────────┘                     │
│                    │                                            │
│  ┌───────────────────────────────────────┐                     │
│  │  4. TRANSPORT SECURITY                │                     │
│  │     - HTTPS only                      │                     │
│  │     - Secure headers                  │                     │
│  │     - CORS configuration              │                     │
│  └───────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture provides:
- **Scalability**: Modular component structure
- **Maintainability**: Clear separation of concerns
- **Performance**: Optimized rendering and caching
- **Security**: Multiple security layers
- **Extensibility**: Easy to add new features
- **Testability**: Independent, testable components

The implementation follows React and Next.js best practices with TypeScript for type safety and TanStack Query for efficient data management.
