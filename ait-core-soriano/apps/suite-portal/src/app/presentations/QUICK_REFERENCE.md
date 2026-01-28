# Presentations Module - Quick Reference

Fast reference guide for common operations and code snippets.

## Installation

```bash
cd apps/suite-portal
pnpm add reveal.js@^5.1.0 chart.js@^4.4.0
pnpm dev
```

Navigate to: `http://localhost:3001/presentations`

---

## Common Operations

### Create New Presentation

```typescript
const newPresentation = await presentationsApi.post('/', {
  title: 'My Presentation',
  slides: [
    {
      id: '1',
      content: '<h1>Title</h1>',
      layout: 'title',
      transition: 'slide',
      notes: 'Speaker notes here',
    },
  ],
  theme: 'black',
});
```

### Update Presentation

```typescript
await presentationsApi.patch('/:id', {
  title: 'Updated Title',
  slides: updatedSlides,
  theme: 'league',
});
```

### Add Slide

```typescript
const newSlide = {
  id: Date.now().toString(),
  content: '<h2>New Slide</h2>',
  layout: 'content',
  transition: 'fade',
};
setSlides([...slides, newSlide]);
```

### Delete Slide

```typescript
const updatedSlides = slides.filter(s => s.id !== slideId);
setSlides(updatedSlides);
```

### Export to PDF

```typescript
await presentationsApi.get(`/${presentationId}/export?format=pdf`);
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save presentation |
| `Ctrl/Cmd + N` | New slide |
| `Ctrl/Cmd + D` | Duplicate slide |
| `Shift + Delete` | Delete slide |
| `F5` | Start presentation |
| `Esc` | Exit presentation |
| `Arrow Keys` | Navigate slides |

---

## Component Imports

```typescript
import { SlideEditor } from '@/components/presentations/slide-editor';
import { DraggableElement } from '@/components/presentations/draggable-element';
import { PresenterView } from '@/components/presentations/presenter-view';
import { ChartElement } from '@/components/presentations/chart-element';
```

---

## Slide Templates

### Title Slide
```typescript
content: '<h1>Title</h1><p>Subtitle</p>'
layout: 'title'
```

### Content Slide
```typescript
content: '<h2>Title</h2><ul><li>Point 1</li><li>Point 2</li></ul>'
layout: 'content'
```

### Two Column
```typescript
content: '<div style="display:flex;gap:2rem"><div>Left</div><div>Right</div></div>'
layout: 'two-column'
```

### Image Slide
```typescript
content: '<img src="url" alt="desc" style="width:100%">'
layout: 'image-left' // or 'image-right'
```

---

## Chart Configuration

### Line Chart
```typescript
<ChartElement
  type="line"
  data={{
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Sales',
      data: [10, 20, 15],
      borderColor: 'rgb(59, 130, 246)',
    }]
  }}
/>
```

### Bar Chart
```typescript
<ChartElement
  type="bar"
  data={{
    labels: ['Q1', 'Q2', 'Q3'],
    datasets: [{
      label: 'Revenue',
      data: [65, 59, 80],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    }]
  }}
/>
```

### Pie Chart
```typescript
<ChartElement
  type="pie"
  data={{
    labels: ['A', 'B', 'C'],
    datasets: [{
      data: [300, 50, 100],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
    }]
  }}
/>
```

---

## Theme Options

```typescript
const themes = [
  'black',      // Dark theme
  'white',      // Light theme
  'league',     // Blue accent
  'beige',      // Warm theme
  'sky',        // Sky blue
  'night',      // Dark navy
  'serif',      // Serif fonts
  'simple',     // Minimal
  'solarized',  // Solarized colors
  'moon',       // Dark teal
];
```

---

## Transition Options

```typescript
const transitions = [
  'none',     // No transition
  'fade',     // Fade effect
  'slide',    // Slide effect
  'convex',   // 3D convex
  'concave',  // 3D concave
  'zoom',     // Zoom effect
];
```

---

## React Query Hooks

### Fetch Presentations
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['presentations'],
  queryFn: () => presentationsApi.get('/'),
});
```

### Create Mutation
```typescript
const mutation = useMutation({
  mutationFn: (data) => presentationsApi.post('/', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['presentations'] });
  },
});

// Usage
mutation.mutate(newPresentation);
```

### Update Mutation
```typescript
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => presentationsApi.patch(`/${id}`, data),
});

// Usage
updateMutation.mutate({ id: '123', data: updates });
```

---

## Styling Snippets

### Center Content
```html
<div style="text-align: center; padding: 4rem;">
  <h1>Centered Title</h1>
</div>
```

### Flexbox Layout
```html
<div style="display: flex; justify-content: space-between; align-items: center;">
  <div>Left</div>
  <div>Right</div>
</div>
```

### Grid Layout
```html
<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Background Gradient
```html
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 4rem;">
  Content
</div>
```

---

## Reveal.js Configuration

```typescript
const deck = new Reveal(element, {
  // Display
  controls: true,
  progress: true,
  center: true,

  // Behavior
  transition: 'slide',
  transitionSpeed: 'default', // default, fast, slow

  // Dimensions
  width: 960,
  height: 700,
  margin: 0.1,

  // Navigation
  keyboard: true,
  touch: true,
  loop: false,

  // Other
  hash: false,
  embedded: true,
});
```

---

## Common Patterns

### Auto-Save
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    handleSave();
  }, 30000);
  return () => clearInterval(interval);
}, [handleSave]);
```

### Keyboard Handler
```typescript
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [handleSave]);
```

### Debounced Update
```typescript
import { debounce } from '@/lib/utils';

const debouncedUpdate = useCallback(
  debounce((content: string) => {
    handleUpdate(content);
  }, 500),
  []
);
```

---

## TypeScript Types

```typescript
interface Slide {
  id: string;
  content: string;
  notes?: string;
  transition?: string;
  background?: string;
  layout?: string;
}

interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
  createdAt: string;
  updatedAt: string;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }>;
}
```

---

## API Endpoints

```
GET    /presentations              // List all
GET    /presentations/:id          // Get one
POST   /presentations              // Create
PATCH  /presentations/:id          // Update
DELETE /presentations/:id          // Delete
GET    /presentations/:id/export   // Export
POST   /presentations/:id/share    // Share
```

---

## Framer Motion Animations

### Fade In
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Slide In
```typescript
<motion.div
  initial={{ x: -100, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Scale
```typescript
<motion.div
  initial={{ scale: 0.8 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 200 }}
>
  Content
</motion.div>
```

---

## Debugging

### Enable Console Logging
```typescript
const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[Presentations]', ...args);
```

### Check Reveal.js State
```typescript
console.log('Current slide:', deckRef.current?.getCurrentSlide());
console.log('Total slides:', deckRef.current?.getTotalSlides());
console.log('Slide indices:', deckRef.current?.getIndices());
```

### Inspect Element State
```typescript
console.log('Selected slide:', selectedSlide);
console.log('All slides:', slides);
console.log('Current index:', currentSlideIndex);
```

---

## Performance Tips

1. **Memoize Components**: Use `React.memo()`
2. **Lazy Load**: Only load visible slides
3. **Optimize Images**: Compress and use WebP
4. **Debounce Updates**: Reduce API calls
5. **Virtual Scrolling**: For slide thumbnails

---

## File Structure

```
presentations/
├── page.tsx                    # Main editor
├── README.md                   # User guide
├── IMPLEMENTATION_GUIDE.md     # Developer guide
├── QUICK_REFERENCE.md          # This file
└── examples.tsx                # Code examples

components/presentations/
├── slide-editor.tsx            # Text editor
├── draggable-element.tsx       # Draggable items
├── presenter-view.tsx          # Presenter mode
├── chart-element.tsx           # Charts
└── index.ts                    # Exports

types/
└── reveal.d.ts                 # Type definitions
```

---

## Browser DevTools

### React DevTools
- Inspect component state
- Check props
- View component tree

### Network Tab
- Monitor API calls
- Check response data
- Debug CORS issues

### Console
- Check for errors
- View debug logs
- Test functions

---

## Quick Fixes

### Reveal.js not loading
```bash
pnpm add reveal.js@^5.1.0
pnpm install
```

### TypeScript errors
```bash
pnpm add -D @types/reveal.js
```

### Charts not working
```bash
pnpm add chart.js@^4.4.0
```

### Build errors
```bash
rm -rf .next node_modules
pnpm install
pnpm build
```

---

## Resources

- **Main Guide**: [README.md](./README.md)
- **Implementation**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- **Examples**: [examples.tsx](./examples.tsx)
- **Reveal.js**: https://revealjs.com/
- **Chart.js**: https://www.chartjs.org/

---

**Pro Tip**: Keep this file bookmarked for quick reference during development!
