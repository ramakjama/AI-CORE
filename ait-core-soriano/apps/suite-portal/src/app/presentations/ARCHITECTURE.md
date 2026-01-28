# Presentations Module - Architecture Diagram

Visual representation of the Presentations module architecture and data flow.

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PresentationsPage                            │
│                     (Main Container)                             │
│                                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │   Sidebar      │  │   Main Editor    │  │   TopBar        │ │
│  │                │  │                  │  │                 │ │
│  │ ┌────────────┐ │  │ ┌──────────────┐ │  │ Title Editor    │ │
│  │ │  Slide     │ │  │ │   Reveal.js  │ │  │ Save Button     │ │
│  │ │ Thumbnails │ │  │ │  Container   │ │  │ Share Button    │ │
│  │ └────────────┘ │  │ │              │ │  │ Export Menu     │ │
│  │                │  │ │ ┌──────────┐ │ │  │ Present Button  │ │
│  │ ┌────────────┐ │  │ │ │  Slide   │ │ │  └─────────────────┘ │
│  │ │ Templates  │ │  │ │ │ Editor   │ │ │                      │
│  │ │  Gallery   │ │  │ │ └──────────┘ │ │  ┌─────────────────┐ │
│  │ └────────────┘ │  │ │              │ │  │    Toolbar      │ │
│  │                │  │ └──────────────┘ │  │                 │ │
│  │ ┌────────────┐ │  │                  │  │ Add Slide       │ │
│  │ │  Recent    │ │  │ ┌──────────────┐ │  │ Duplicate       │ │
│  │ │   Files    │ │  │ │   Presenter  │ │  │ Delete          │ │
│  │ └────────────┘ │  │ │    Notes     │ │  │ Theme Selector  │ │
│  └────────────────┘  │ └──────────────┘ │  │ Transition      │ │
│                      │                  │  │ Insert Elements │ │
│                      └──────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────────┐
│     User     │
│   Actions    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         Component State                   │
│  (useState, useReducer)                  │
│  • slides[]                              │
│  • selectedSlide                         │
│  • currentSlideIndex                     │
│  • presentationTitle                     │
│  • theme, transition                     │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│      React Query Cache                    │
│  (TanStack Query)                        │
│  • Query: ['presentations']              │
│  • Mutations: create, update, delete     │
│  • Auto-refetch on mutations             │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         API Client                        │
│  (presentationsApi)                      │
│  • Axios instance                        │
│  • Auth interceptors                     │
│  • Error handling                        │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│      Backend Service                      │
│  • REST API endpoints                    │
│  • Business logic                        │
│  • Export generation                     │
└──────┬───────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│         Database                          │
│  • Presentations table                   │
│  • Slides data                           │
│  • User associations                     │
└──────────────────────────────────────────┘
```

## Component Interaction Flow

```
User Clicks "Add Slide"
       │
       ▼
┌──────────────────────────────────────┐
│  handleAddSlide() function           │
│  • Create new slide object           │
│  • Generate unique ID                │
│  • Add to slides array               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  State Update                        │
│  setSlides([...slides, newSlide])    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Re-render                           │
│  • Sidebar updates (new thumbnail)  │
│  • Editor updates (new slide)       │
│  • Status bar updates (count)       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Auto-save (if enabled)              │
│  • Debounced API call                │
│  • Update backend                    │
└──────────────────────────────────────┘
```

## Reveal.js Integration

```
┌─────────────────────────────────────────┐
│         React Component                  │
│                                         │
│  const revealRef = useRef<HTMLDivElement>() │
│                                         │
│  useEffect(() => {                      │
│    const deck = new Reveal(            │
│      revealRef.current,                │
│      config                            │
│    );                                  │
│    deck.initialize();                  │
│  }, [dependencies]);                   │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│         Reveal.js Engine                 │
│  • Slide rendering                      │
│  • Transition effects                   │
│  • Navigation                           │
│  • Progress tracking                    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│            DOM Output                    │
│  <div class="reveal">                   │
│    <div class="slides">                 │
│      <section>Slide 1</section>         │
│      <section>Slide 2</section>         │
│    </div>                               │
│  </div>                                 │
└─────────────────────────────────────────┘
```

## State Management Architecture

```
┌────────────────────────────────────────────────────────┐
│              Global State (React Query)                 │
│                                                         │
│  presentations: QueryState<Presentation[]>             │
│    • data                                              │
│    • isLoading                                         │
│    • error                                             │
│    • refetch()                                         │
└────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Create    │  │   Update    │  │   Delete    │
│  Mutation   │  │  Mutation   │  │  Mutation   │
│             │  │             │  │             │
│ onSuccess:  │  │ onSuccess:  │  │ onSuccess:  │
│  refetch()  │  │  refetch()  │  │  refetch()  │
└─────────────┘  └─────────────┘  └─────────────┘

┌────────────────────────────────────────────────────────┐
│              Local State (useState)                     │
│                                                         │
│  • selectedPresentation: string | null                 │
│  • currentSlideIndex: number                           │
│  • slides: Slide[]                                     │
│  • selectedSlide: Slide | null                         │
│  • presentationTitle: string                           │
│  • selectedTheme: string                               │
│  • selectedTransition: string                          │
│  • showSidebar: boolean                                │
│  • showNotes: boolean                                  │
│  • isPresenting: boolean                               │
└────────────────────────────────────────────────────────┘
```

## Event Flow

```
┌───────────────────────────────────────────────────────┐
│                  User Events                           │
├───────────────────────────────────────────────────────┤
│  • Click                                              │
│  • Keyboard input                                     │
│  • Drag & Drop                                        │
│  • Resize                                             │
└────────────┬──────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│              Event Handlers                             │
├────────────────────────────────────────────────────────┤
│  • handleSlideSelect(slide, index)                    │
│  • handleAddSlide(layout)                             │
│  • handleDuplicateSlide()                             │
│  • handleDeleteSlide()                                │
│  • handleSlideContentChange(content)                  │
│  • handleNotesChange(notes)                           │
│  • handlePresent()                                    │
│  • handleExport(format)                               │
│  • handleSave()                                       │
└────────────┬───────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│              State Updates                              │
├────────────────────────────────────────────────────────┤
│  • setState(newValue)                                 │
│  • mutation.mutate(data)                              │
│  • queryClient.invalidateQueries()                    │
└────────────┬───────────────────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────┐
│                Re-render                                │
├────────────────────────────────────────────────────────┤
│  • Component tree re-renders                          │
│  • Effects run (useEffect)                            │
│  • Reveal.js syncs                                    │
└─────────────────────────────────────────────────────────┘
```

## Presenter Mode Architecture

```
┌───────────────────────────────────────────────────────┐
│              Main Editor Window                        │
│                                                       │
│  handlePresent() ──────────────┐                     │
│                                │                     │
└────────────────────────────────┼─────────────────────┘
                                 │
                                 │ window.open()
                                 │
                                 ▼
┌───────────────────────────────────────────────────────┐
│           New Browser Window/Tab                      │
│           (Presenter View)                            │
│                                                       │
│  ┌─────────────────────┐  ┌──────────────────────┐   │
│  │   Current Slide     │  │     Sidebar          │   │
│  │   (Large Display)   │  │                      │   │
│  │                     │  │  ┌────────────────┐  │   │
│  │  [Slide Content]    │  │  │ Timer          │  │   │
│  │                     │  │  │ 00:15:32       │  │   │
│  │                     │  │  └────────────────┘  │   │
│  │                     │  │                      │   │
│  │                     │  │  ┌────────────────┐  │   │
│  └─────────────────────┘  │  │ Next Slide     │  │   │
│                           │  │ Preview        │  │   │
│  ┌─────────────────────┐  │  └────────────────┘  │   │
│  │  Navigation         │  │                      │   │
│  │  [◀] [▶]           │  │  ┌────────────────┐  │   │
│  └─────────────────────┘  │  │ Notes          │  │   │
│                           │  │ [Notes text]   │  │   │
│                           │  └────────────────┘  │   │
│                           └──────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

## Chart Integration Flow

```
User Inserts Chart
       │
       ▼
┌──────────────────────────────────────┐
│  Chart Configuration Dialog          │
│  • Select type (bar, line, pie)     │
│  • Input data                        │
│  • Customize colors                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Create ChartElement Component       │
│  <ChartElement                       │
│    type="bar"                        │
│    data={chartData}                  │
│    options={chartOptions}            │
│  />                                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Chart.js Initialization             │
│  • Register components               │
│  • Create canvas context             │
│  • Render chart                      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Display in Slide                    │
│  • Interactive chart                 │
│  • Tooltips on hover                 │
│  • Responsive sizing                 │
└──────────────────────────────────────┘
```

## Export Process Flow

```
User Clicks Export
       │
       ▼
┌──────────────────────────────────────┐
│  Select Format                       │
│  • PDF                               │
│  • PPTX                              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  API Request                         │
│  GET /presentations/:id/export       │
│      ?format=pdf                     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Backend Processing                  │
│  • Render slides to images           │
│  • Generate document                 │
│  • Apply theme styling               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Return File                         │
│  • Binary blob                       │
│  • Content-Type header               │
│  • Content-Disposition               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Client Download                     │
│  • Create blob URL                   │
│  • Trigger download                  │
│  • Cleanup                           │
└──────────────────────────────────────┘
```

## Collaboration Architecture (Future)

```
┌────────────────────────────────────────────────────────┐
│                  User A Browser                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Editor Component                                │  │
│  │  • Local state                                   │  │
│  │  • User cursor position                          │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
└───────────────┼─────────────────────────────────────────┘
                │
                │ WebSocket
                ▼
┌────────────────────────────────────────────────────────┐
│              Collaboration Server                       │
│                                                         │
│  • Y.js / Yjs (CRDT)                                   │
│  • Conflict resolution                                 │
│  • User presence tracking                              │
│  • Broadcast updates                                   │
└────────────────┬───────────────────────────────────────┘
                │
                │ WebSocket
                ▼
┌────────────────────────────────────────────────────────┐
│                  User B Browser                         │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Editor Component                                │  │
│  │  • Synced state                                  │  │
│  │  • See User A's cursor                           │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Client Application                     │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Authentication                                  │  │
│  │  • JWT Token in localStorage                     │  │
│  │  • Token refresh on 401                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Input Sanitization                              │  │
│  │  • DOMPurify for HTML content                    │  │
│  │  • Validate file uploads                         │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────┘
                 │
                 │ HTTPS
                 ▼
┌────────────────────────────────────────────────────────┐
│                  API Gateway                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Request Validation                              │  │
│  │  • Check JWT signature                           │  │
│  │  • Rate limiting                                 │  │
│  │  • CORS headers                                  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬───────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────┐
│              Backend Service                            │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Authorization                                   │  │
│  │  • Check user permissions                        │  │
│  │  • Verify resource ownership                     │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Data Encryption                                 │  │
│  │  • Encrypt sensitive data                        │  │
│  │  • Secure file storage                           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimization

```
┌────────────────────────────────────────────────────────┐
│              Performance Strategies                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  1. Code Splitting                                     │
│     • Lazy load chart library                          │
│     • Dynamic imports for heavy components             │
│                                                         │
│  2. Memoization                                        │
│     • React.memo() for slide components                │
│     • useMemo() for expensive calculations             │
│     • useCallback() for event handlers                 │
│                                                         │
│  3. Virtual Scrolling                                  │
│     • Render only visible slide thumbnails             │
│     • Lazy load off-screen content                     │
│                                                         │
│  4. Debouncing                                         │
│     • Debounce text input updates                      │
│     • Throttle drag events                             │
│                                                         │
│  5. Caching                                            │
│     • React Query cache (5 min default)                │
│     • Browser localStorage for drafts                  │
│     • Service Worker for offline access                │
│                                                         │
│  6. Image Optimization                                 │
│     • Lazy load images                                 │
│     • Use WebP format                                  │
│     • Responsive image sizes                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  • React Components                                     │
│  • Framer Motion animations                            │
│  • Tailwind CSS styling                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                    Business Logic Layer                  │
│  • Custom hooks (usePresentation)                       │
│  • State management (React Query)                       │
│  • Event handlers                                       │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                    Integration Layer                     │
│  • Reveal.js engine                                     │
│  • Chart.js library                                     │
│  • API client (Axios)                                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────┐
│                    Backend Layer                         │
│  • REST API                                             │
│  • Database                                             │
│  • File storage                                         │
└─────────────────────────────────────────────────────────┘
```

---

This architecture provides a solid foundation for a scalable, maintainable, and performant presentations application!
