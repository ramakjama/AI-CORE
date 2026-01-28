# Presentations Module - Implementation Guide

Complete guide for implementing and customizing the Presentations module in the AIT-CORE Suite Portal.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Component Structure](#component-structure)
4. [API Integration](#api-integration)
5. [Customization Guide](#customization-guide)
6. [Advanced Features](#advanced-features)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Installation

1. **Install Dependencies**
   ```bash
   cd apps/suite-portal
   pnpm add reveal.js@^5.1.0 chart.js@^4.4.0
   pnpm add -D @types/reveal.js
   ```

2. **Verify Files Created**
   - `/src/app/presentations/page.tsx` - Main page
   - `/src/components/presentations/` - Component directory
   - `/src/types/reveal.d.ts` - Type definitions

3. **Start Development Server**
   ```bash
   pnpm dev
   ```

4. **Navigate to Module**
   - Open: `http://localhost:3001/presentations`

### First Presentation

1. Page loads with default title slide
2. Click presentation title to rename
3. Click "Add Slide" to add more slides
4. Click on slide content to edit
5. Use toolbar to format text
6. Click "Present" to view fullscreen

---

## Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────┐
│         React + Next.js 14              │
├─────────────────────────────────────────┤
│    Reveal.js (Presentation Engine)      │
├─────────────────────────────────────────┤
│    TanStack Query (State Management)    │
├─────────────────────────────────────────┤
│    Framer Motion (Animations)           │
├─────────────────────────────────────────┤
│    Chart.js (Data Visualization)        │
└─────────────────────────────────────────┘
```

### Data Flow

```
User Action
    ↓
Component State
    ↓
React Query Cache
    ↓
API Layer (presentationsApi)
    ↓
Backend Service
    ↓
Database
```

### Component Hierarchy

```
PresentationsPage
├── Sidebar
│   ├── Slide Thumbnails
│   ├── Template Gallery
│   └── Recent Files
├── TopBar
│   ├── Title Editor
│   ├── Actions (Save, Share, Export)
│   └── Present Button
├── Toolbar
│   ├── Slide Actions
│   ├── Theme Selector
│   ├── Transition Selector
│   └── Insert Elements
├── Editor Area
│   ├── Reveal.js Container
│   └── Slide Editor
└── Notes Panel
    └── Presenter Notes
```

---

## Component Structure

### Main Page (`page.tsx`)

**Purpose**: Main presentation editor container

**Key Features**:
- Slide management (CRUD operations)
- Theme and transition selection
- Reveal.js initialization
- State management
- API integration

**State Variables**:
```typescript
- selectedPresentation: string | null
- currentSlideIndex: number
- isPresenting: boolean
- showSidebar: boolean
- selectedTheme: string
- selectedTransition: string
- presentationTitle: string
- slides: Slide[]
- selectedSlide: Slide | null
- showNotes: boolean
```

**Key Functions**:
- `handleSlideSelect()` - Select and navigate to slide
- `handleAddSlide()` - Add new slide
- `handleDuplicateSlide()` - Duplicate current slide
- `handleDeleteSlide()` - Delete current slide
- `handleSlideContentChange()` - Update slide content
- `handlePresent()` - Open presenter mode
- `handleExport()` - Export to PDF/PPTX
- `handleSave()` - Save presentation

### Slide Editor (`slide-editor.tsx`)

**Purpose**: Rich text editor for slide content

**Features**:
- ContentEditable div
- Floating toolbar
- Text formatting (bold, italic, underline)
- Alignment controls
- List creation
- Link and image insertion
- Heading styles
- Font sizes

**Props**:
```typescript
interface SlideEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}
```

### Draggable Element (`draggable-element.tsx`)

**Purpose**: Movable and resizable slide elements

**Features**:
- Drag to reposition
- Resize handles
- Element toolbar
- Type-specific rendering (text, image, shape, chart, code, video)

**Props**:
```typescript
interface DraggableElementProps {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'code' | 'video';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onUpdate: (id: string, updates: Partial<DraggableElementProps>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
}
```

### Presenter View (`presenter-view.tsx`)

**Purpose**: Fullscreen presenter mode with notes

**Features**:
- Current slide display (large)
- Next slide preview
- Speaker notes
- Timer with pause/resume
- Slide thumbnails
- Navigation controls

**Props**:
```typescript
interface PresenterViewProps {
  slides: Slide[];
  currentSlideIndex: number;
  onClose: () => void;
  onSlideChange: (index: number) => void;
  theme?: string;
  transition?: string;
}
```

### Chart Element (`chart-element.tsx`)

**Purpose**: Chart.js integration for data visualization

**Features**:
- Line, Bar, Pie, Doughnut charts
- Responsive sizing
- Theme-aware colors
- Preset configurations

**Props**:
```typescript
interface ChartElementProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  options?: ChartOptions;
  width?: number;
  height?: number;
}
```

---

## API Integration

### Endpoint Structure

```typescript
// Base URL
const baseURL = process.env.NEXT_PUBLIC_API_URL + '/presentations';

// Endpoints
GET    /presentations              // List all presentations
GET    /presentations/:id          // Get presentation by ID
POST   /presentations              // Create new presentation
PATCH  /presentations/:id          // Update presentation
DELETE /presentations/:id          // Delete presentation
GET    /presentations/:id/export   // Export (PDF/PPTX)
POST   /presentations/:id/share    // Share with users
```

### API Client Usage

```typescript
import { presentationsApi } from '@/lib/api';

// List presentations
const presentations = await presentationsApi.get('/');

// Get specific presentation
const presentation = await presentationsApi.get('/:id');

// Create presentation
const newPresentation = await presentationsApi.post('/', {
  title: 'My Presentation',
  slides: [...],
  theme: 'black',
});

// Update presentation
await presentationsApi.patch('/:id', {
  title: 'Updated Title',
  slides: [...],
});

// Delete presentation
await presentationsApi.delete('/:id');

// Export
await presentationsApi.get('/:id/export?format=pdf');
```

### React Query Integration

```typescript
// Fetch presentations
const { data: presentations, isLoading } = useQuery({
  queryKey: ['presentations'],
  queryFn: () => presentationsApi.get('/'),
});

// Create mutation
const createMutation = useMutation({
  mutationFn: (data: Partial<Presentation>) => presentationsApi.post('/', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['presentations'] });
  },
});

// Update mutation
const updateMutation = useMutation({
  mutationFn: ({ id, data }: { id: string; data: Partial<Presentation> }) =>
    presentationsApi.patch(`/${id}`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['presentations'] });
  },
});
```

---

## Customization Guide

### Adding Custom Themes

1. **Define Theme**
   ```typescript
   const themes = [
     ...existingThemes,
     {
       id: 'corporate',
       name: 'Corporate',
       color: '#1E40AF',
     },
   ];
   ```

2. **Add Theme CSS**
   - Create theme file: `/public/themes/corporate.css`
   - Or use Reveal.js theme builder

3. **Import Theme**
   ```typescript
   import 'reveal.js/dist/theme/corporate.css';
   ```

### Adding Custom Layouts

1. **Define Layout**
   ```typescript
   const layouts = [
     ...existingLayouts,
     {
       id: 'feature-showcase',
       name: 'Feature Showcase',
       icon: Sparkles,
     },
   ];
   ```

2. **Create Template**
   ```typescript
   const getLayoutTemplate = (layout: string): string => {
     const templates: Record<string, string> = {
       ...existingTemplates,
       'feature-showcase': `
         <div class="feature-grid">
           <div class="feature">
             <h3>Feature 1</h3>
             <p>Description</p>
           </div>
           <!-- More features -->
         </div>
       `,
     };
     return templates[layout] || templates.content;
   };
   ```

### Adding Custom Transitions

1. **Define Transition**
   ```typescript
   const transitions = [
     ...existingTransitions,
     { id: 'custom-fade', name: 'Custom Fade' },
   ];
   ```

2. **Configure Reveal.js**
   ```typescript
   // In Reveal.js initialization
   const deck = new Reveal(revealRef.current, {
     transition: 'custom-fade',
     transitionSpeed: 'fast',
   });
   ```

### Styling Customization

**Global Styles**
```css
/* In globals.css or component styles */
.reveal h1 {
  color: var(--primary-color);
  font-family: 'Your Custom Font';
}

.reveal section {
  padding: 2rem;
}

.reveal ul {
  list-style: none;
}

.reveal ul li::before {
  content: '→ ';
  color: var(--primary-color);
}
```

**Slide-Specific Styles**
```typescript
const slide = {
  id: '1',
  content: `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem;">
      <h1>Custom Styled Slide</h1>
    </div>
  `,
};
```

---

## Advanced Features

### Real-Time Collaboration (Future)

```typescript
import { useCollaboration } from '@/hooks/use-collaboration';

const { activeUsers, sendUpdate } = useCollaboration(presentationId);

// Send slide update
sendUpdate({
  type: 'slide-update',
  slideId: currentSlide.id,
  content: newContent,
});
```

### Slide Animations

```typescript
// Add Framer Motion to slides
import { motion } from 'framer-motion';

const AnimatedSlide = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <h2>Animated Content</h2>
  </motion.div>
);
```

### Custom Slide Backgrounds

```typescript
const slide = {
  id: '1',
  content: '<h1>Title</h1>',
  background: 'linear-gradient(to right, #ff7e5f, #feb47b)',
  // or
  background: 'url(/images/background.jpg)',
};
```

### Keyboard Shortcuts

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'F5') {
      e.preventDefault();
      handlePresent();
    }
  };

  document.addEventListener('keydown', handleKeyPress);
  return () => document.removeEventListener('keydown', handleKeyPress);
}, []);
```

### Auto-Save Implementation

```typescript
useEffect(() => {
  const autoSave = setInterval(() => {
    if (hasUnsavedChanges) {
      handleSave();
    }
  }, 30000); // Every 30 seconds

  return () => clearInterval(autoSave);
}, [hasUnsavedChanges]);
```

---

## Best Practices

### Performance

1. **Optimize Images**
   - Use compressed images (WebP format)
   - Lazy load images not currently visible
   - Use CDN for static assets

2. **Limit Slide Count**
   - Keep presentations under 50 slides
   - Split large presentations into modules

3. **Memoization**
   ```typescript
   const MemoizedSlide = React.memo(SlideComponent);
   ```

4. **Debounce Updates**
   ```typescript
   import { debounce } from '@/lib/utils';

   const debouncedUpdate = debounce(handleSlideContentChange, 500);
   ```

### Accessibility

1. **Keyboard Navigation**
   - Ensure all features accessible via keyboard
   - Add proper focus management

2. **ARIA Labels**
   ```typescript
   <button aria-label="Add new slide" onClick={handleAddSlide}>
     <Plus />
   </button>
   ```

3. **Color Contrast**
   - Ensure sufficient contrast ratios
   - Test with accessibility tools

4. **Screen Reader Support**
   - Add descriptive alt text
   - Use semantic HTML

### Security

1. **Sanitize HTML Input**
   ```typescript
   import DOMPurify from 'dompurify';

   const sanitizedContent = DOMPurify.sanitize(userInput);
   ```

2. **Validate File Uploads**
   - Check file types
   - Limit file sizes
   - Scan for malware

3. **API Authentication**
   - Use JWT tokens
   - Implement rate limiting
   - Validate all inputs

### Code Organization

1. **Separate Concerns**
   - Keep components small and focused
   - Extract reusable logic to hooks
   - Use proper TypeScript types

2. **Component Structure**
   ```
   presentations/
   ├── components/       # Reusable components
   ├── hooks/           # Custom hooks
   ├── utils/           # Helper functions
   ├── types/           # TypeScript types
   └── constants/       # Constants and configs
   ```

3. **Naming Conventions**
   - Use PascalCase for components
   - Use camelCase for functions/variables
   - Use UPPER_CASE for constants

---

## Troubleshooting

### Common Issues

#### Issue: Reveal.js not initializing

**Symptoms**: Blank slide area, no transitions

**Solutions**:
1. Check if Reveal.js is installed: `pnpm list reveal.js`
2. Verify CSS imports are at component top
3. Ensure ref is properly attached to container
4. Check browser console for errors

**Debug Code**:
```typescript
useEffect(() => {
  console.log('Reveal ref:', revealRef.current);
  console.log('Deck instance:', deckRef.current);
}, []);
```

#### Issue: Charts not rendering

**Symptoms**: Empty chart containers

**Solutions**:
1. Install Chart.js: `pnpm add chart.js`
2. Register Chart.js components
3. Verify canvas element exists
4. Check data format

**Debug Code**:
```typescript
useEffect(() => {
  console.log('Canvas ref:', canvasRef.current);
  console.log('Chart data:', data);
}, [data]);
```

#### Issue: Presenter mode blocked

**Symptoms**: Popup blocked message

**Solutions**:
1. Enable popups for your domain
2. Check browser popup settings
3. Use window.open with proper parameters

**Workaround**:
```typescript
const presenterWindow = window.open(
  '',
  '_blank',
  'popup=yes,width=1920,height=1080'
);
```

#### Issue: Slow performance with many slides

**Symptoms**: Lag when switching slides

**Solutions**:
1. Implement virtual scrolling for thumbnails
2. Lazy load slide content
3. Optimize images and assets
4. Use React.memo for slides

**Optimization**:
```typescript
const OptimizedSlide = React.memo(({ slide }) => (
  <div dangerouslySetInnerHTML={{ __html: slide.content }} />
), (prev, next) => prev.slide.id === next.slide.id);
```

#### Issue: Export not working

**Symptoms**: Export button doesn't trigger download

**Solutions**:
1. Verify API endpoint is configured
2. Check backend export functionality
3. Ensure proper authentication
4. Check CORS settings

**Debug Code**:
```typescript
const handleExport = async (format: 'pdf' | 'pptx') => {
  try {
    console.log('Exporting:', format);
    const response = await presentationsApi.get(
      `/${selectedPresentation}/export?format=${format}`
    );
    console.log('Export response:', response);
  } catch (error) {
    console.error('Export error:', error);
  }
};
```

### Getting Help

1. **Check Documentation**: Read this guide and README.md
2. **Browser Console**: Look for JavaScript errors
3. **Network Tab**: Check API requests/responses
4. **React DevTools**: Inspect component state
5. **TypeScript Errors**: Check type definitions

### Debug Mode

Enable debug logging:
```typescript
const DEBUG = process.env.NODE_ENV === 'development';

const log = (...args: any[]) => {
  if (DEBUG) console.log('[Presentations]', ...args);
};

// Usage
log('Slide changed:', currentSlideIndex);
```

---

## Additional Resources

- [Reveal.js Documentation](https://revealjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [Framer Motion API](https://www.framer.com/motion/)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Best Practices](https://react.dev/)

---

## Support

For issues or questions:
1. Check this implementation guide
2. Review examples.tsx for code samples
3. Check the README.md for usage instructions
4. Contact the development team

---

**Version**: 1.0.0
**Last Updated**: 2024
**Maintainer**: AIT-CORE Suite Portal Team
