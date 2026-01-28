# Documents Page - Architecture

## Component Hierarchy

```
DocumentsPage (page.tsx)
├── TooltipProvider
│   ├── Sidebar (AnimatePresence)
│   │   ├── Header
│   │   │   ├── Title
│   │   │   ├── New Button
│   │   │   └── DocumentTemplates
│   │   │       └── Dialog (Template Gallery)
│   │   ├── Search Input
│   │   ├── Recent Documents
│   │   │   └── DocumentsList
│   │   ├── Starred Documents
│   │   │   └── DocumentsList
│   │   ├── Folder Tree
│   │   │   └── FolderTree (Recursive)
│   │   └── All Documents
│   │       └── DocumentsList
│   │
│   └── Main Editor Area
│       ├── Top Bar
│       │   ├── Sidebar Toggle Button
│       │   ├── Document Title Input
│       │   ├── Save Status Indicator
│       │   ├── KeyboardShortcuts
│       │   │   └── Dialog (Shortcuts List)
│       │   ├── ShareDialog
│       │   │   └── Dialog (Share UI)
│       │   └── ExportDialog
│       │       └── Dialog (Export Options)
│       │
│       ├── Editor Toolbar
│       │   ├── Text Formatting Buttons
│       │   ├── Heading Buttons
│       │   ├── List Buttons
│       │   ├── Alignment Buttons
│       │   ├── Insert Buttons (Link, Image, Table)
│       │   ├── Color Pickers (Text & Highlight)
│       │   └── Undo/Redo Buttons
│       │
│       └── Editor Content (TipTap)
│           └── EditorContent (Prose Container)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interaction                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    React Component State                         │
│  • selectedDocument                                              │
│  • selectedFolder                                                │
│  • documentTitle                                                 │
│  • isSaving                                                      │
│  • searchQuery                                                   │
│  • showSidebar                                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TipTap Editor State                           │
│  • editor content (HTML)                                         │
│  • selection state                                               │
│  • formatting state                                              │
│  • undo/redo history                                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Debounced Auto-save                            │
│  • 1 second timeout                                              │
│  • Clears previous timeout                                       │
│  • Sets saving state                                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TanStack Query Mutation                        │
│  • updateDocumentMutation                                        │
│  • Optimistic updates                                            │
│  • Cache invalidation                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Client (Axios)                          │
│  • Request interceptor (auth token)                              │
│  • Response interceptor (error handling)                         │
│  • Token refresh on 401                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API                                 │
│  PATCH /documents/:id                                            │
└─────────────────────────────────────────────────────────────────┘
```

## State Management

### Local State (useState)
```typescript
const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
const [documentTitle, setDocumentTitle] = useState('');
const [isSaving, setIsSaving] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
const [showSidebar, setShowSidebar] = useState(true);
const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
```

### Server State (TanStack Query)
```typescript
// Queries
useQuery(['documents', selectedFolder])   // List documents
useQuery(['folders'])                     // Folder tree

// Mutations
createDocumentMutation                    // Create document
updateDocumentMutation                    // Update document
deleteDocumentMutation                    // Delete document
```

### Editor State (TipTap)
```typescript
const editor = useEditor({
  extensions: [...],
  content: documentContent,
  onUpdate: ({ editor }) => {
    // Triggers auto-save
  }
});
```

## TipTap Extension Architecture

```
StarterKit (Base)
├── Document
├── Paragraph
├── Text
├── Heading
├── Bold
├── Italic
├── Strike
├── Code
├── CodeBlock
├── Blockquote
├── HardBreak
├── HorizontalRule
├── BulletList
├── OrderedList
├── ListItem
├── History (Undo/Redo)
└── Gapcursor

Additional Extensions
├── Underline
├── TextStyle
├── Color
├── Highlight (multicolor)
├── Link
├── Image
├── TextAlign
├── Table
│   ├── TableRow
│   ├── TableCell
│   └── TableHeader
└── TaskList
    └── TaskItem

Collaboration (Ready, not active)
├── Collaboration
└── CollaborationCursor
```

## API Integration Layer

```
┌─────────────────────────────────────────────────────────────────┐
│                        @/lib/api.ts                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     ApiClient Class                       │  │
│  │  • Axios instance with interceptors                      │  │
│  │  • Token management                                       │  │
│  │  • Automatic token refresh                               │  │
│  │  • Error handling                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  documentsApi Instance                    │  │
│  │  Base URL: /documents                                     │  │
│  │                                                           │  │
│  │  Methods:                                                 │  │
│  │  • get(url)         → GET request                        │  │
│  │  • post(url, data)  → POST request                       │  │
│  │  • patch(url, data) → PATCH request                      │  │
│  │  • delete(url)      → DELETE request                     │  │
│  │  • download(url)    → File download                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   documents Object                        │  │
│  │  Convenience methods for common operations:              │  │
│  │  • list()                                                 │  │
│  │  • get(id)                                                │  │
│  │  • create(data)                                           │  │
│  │  • update(id, data)                                       │  │
│  │  • delete(id)                                             │  │
│  │  • export(id, format)                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                      Parent Component                            │
│                   (DocumentsPage)                                │
│                                                                  │
│  State:                                                          │
│  • selectedDocument                                              │
│  • documents list                                                │
│  • folders tree                                                  │
│                                                                  │
│  Handlers:                                                       │
│  • handleNewDocument(content?, title?)                          │
│  • handleTemplateSelect(template)                               │
│  • handleTitleChange(newTitle)                                  │
│  • setSelectedDocument(doc)                                     │
│  • deleteDocumentMutation.mutate(id)                            │
└──────────────┬───────────────────────┬──────────────────────────┘
               │                       │
               │                       │
      ┌────────▼────────┐     ┌────────▼─────────┐
      │   Child Props   │     │   Child Props    │
      │                 │     │                  │
      │  DocumentsList  │     │  EditorToolbar   │
      │  • documents    │     │  • editor        │
      │  • onSelect     │     │                  │
      │  • onDelete     │     │  Uses:           │
      │  • onToggleStar │     │  • editor.chain()│
      │                 │     │  • editor.isActive│
      └─────────────────┘     └──────────────────┘
```

## Auto-save Mechanism

```
User Types in Editor
         │
         ▼
TipTap onUpdate Event
         │
         ▼
debouncedSave(documentId, content)
         │
         ├─ Clear previous timeout
         ├─ Set isSaving = true
         └─ setTimeout(1000ms)
                   │
                   ▼
         updateDocumentMutation.mutate()
                   │
                   ├─ API Call (PATCH /documents/:id)
                   ├─ Update cache
                   └─ Set isSaving = false
                            │
                            ▼
                   UI shows "Saved ✓"
```

## Rendering Pipeline

```
Initial Render
├── Query documents from API
├── Query folders from API
├── Initialize editor (empty or with selected document)
└── Render UI

User Selects Document
├── setSelectedDocument(doc)
├── Update documentTitle state
├── editor.commands.setContent(doc.content)
└── Re-render editor with new content

User Types
├── TipTap updates internal state
├── Trigger onUpdate event
├── debouncedSave queued
└── Re-render (isSaving = true)

Auto-save Complete
├── Mutation success
├── Query cache updated
├── isSaving = false
└── Re-render (show "Saved")
```

## Styling Architecture

```
Global Styles (Tailwind)
├── tailwind.config.ts
│   ├── Theme colors (CSS variables)
│   ├── Dark mode configuration
│   ├── Animations
│   └── Custom utilities
│
└── app/globals.css
    ├── CSS variable definitions
    ├── Base styles
    └── Dark mode overrides

Component Styles
├── Tailwind utility classes
├── clsx/twMerge (cn utility)
└── Conditional classes

Editor Styles
└── editor-styles.css
    ├── Prose typography
    ├── TipTap element styles
    ├── Dark mode adjustments
    └── Responsive breakpoints
```

## Performance Optimizations

```
Query Caching (TanStack Query)
├── Documents list cached by folder
├── Stale time: 5 minutes (default)
├── Cache time: 30 minutes (default)
└── Automatic background refetch

Debounced Auto-save
├── Prevents excessive API calls
├── 1 second delay
└── Cancels previous save

Code Splitting
├── Dialog components lazy loaded
├── TipTap extensions tree-shaken
└── React.lazy for heavy components (potential)

Memoization
├── useCallback for handlers
├── useMemo for computed values (potential)
└── React.memo for list items (potential)
```

## Error Handling

```
API Errors
├── Axios interceptor catches
├── 401 → Token refresh attempt
├── 403 → Redirect to login
├── 500 → Show error toast
└── Network error → Show retry option

Editor Errors
├── TipTap error boundaries
├── Fallback to plain text
└── Log to console/monitoring

State Errors
├── TanStack Query error state
├── Retry failed mutations
└── Show error UI
```

## Security Layers

```
Frontend
├── React XSS prevention (automatic)
├── TipTap HTML sanitization
├── CSRF tokens in requests
└── Input validation

API Client
├── Authorization headers
├── Token refresh mechanism
├── HTTPS only (production)
└── Request/response interceptors

Backend (Required)
├── Authentication
├── Authorization
├── Rate limiting
├── Input sanitization
└── SQL injection prevention
```

## Deployment Architecture

```
Development
├── Next.js Dev Server (port 3001)
├── Hot Module Replacement
├── Source maps enabled
└── API proxy to backend

Production
├── Next.js Build (Static + SSR)
├── CDN for static assets
├── API calls to production backend
└── Environment variables
```

## Testing Strategy

```
Unit Tests
├── Component rendering
├── User interactions
├── State updates
└── Helper functions

Integration Tests
├── Document CRUD flow
├── Editor interactions
├── Auto-save mechanism
└── Search functionality

E2E Tests
├── Complete user workflows
├── Cross-browser testing
├── Performance testing
└── Accessibility testing
```

## Scalability Considerations

```
Current (Working for 100s of documents)
├── Client-side filtering
├── All documents loaded
└── Simple folder tree

Future (1000s+ documents)
├── Server-side pagination
├── Virtual scrolling
├── Lazy load folders
├── Search backend
└── Document caching strategy
```

---

**Architecture Version**: 1.0.0
**Last Updated**: 2026-01-28
