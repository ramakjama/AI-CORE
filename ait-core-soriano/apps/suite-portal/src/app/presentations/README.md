# Presentations Module

A powerful presentation editor built with Reveal.js, featuring WYSIWYG editing, presenter mode, themes, transitions, and export capabilities.

## Features

### Core Functionality
- **Reveal.js Integration**: Professional presentation engine with smooth transitions
- **WYSIWYG Editor**: Real-time slide editing with visual feedback
- **Slide Management**: Add, duplicate, delete, and reorder slides
- **Theme System**: 10 built-in themes (Black, White, League, Beige, Sky, Night, Serif, Simple, Solarized, Moon)
- **Transitions**: 6 transition effects (None, Fade, Slide, Convex, Concave, Zoom)
- **Presenter Notes**: Add notes to each slide for reference during presentations

### Slide Editor
- **Rich Text Editing**: Format text with bold, italic, underline
- **Text Alignment**: Left, center, right alignment
- **Lists**: Bullet and numbered lists
- **Links and Images**: Insert hyperlinks and images
- **Headings**: Support for H1-H4 headings
- **Font Sizes**: Multiple size options

### Layout Templates
- **Title Slide**: Large title with subtitle
- **Content**: Standard content slide with heading and bullet points
- **Two Column**: Side-by-side content layout
- **Image Left**: Image on left, content on right
- **Image Right**: Content on left, image on right
- **Blank**: Empty canvas for custom layouts

### Draggable Elements
- **Text Boxes**: Draggable and resizable text containers
- **Images**: Insert and position images anywhere
- **Shapes**: Colored shapes and boxes
- **Charts**: Bar, line, pie, and doughnut charts (Chart.js)
- **Code Blocks**: Syntax-highlighted code snippets
- **Video**: Embedded video elements

### Presenter View
- **Dual Display**: Current slide with next slide preview
- **Timer**: Built-in presentation timer with pause/resume
- **Speaker Notes**: View notes without audience seeing them
- **Slide Thumbnails**: Quick navigation through all slides
- **Progress Tracking**: Current slide number and total slides

### Export Options
- **PDF Export**: Generate PDF version of presentation
- **PPTX Export**: Export to PowerPoint format
- **Share**: Share presentations with team members

### Sidebar Features
- **Slide Thumbnails**: Visual overview of all slides
- **Template Gallery**: Quick access to layout templates
- **Recent Presentations**: Quick open recent files
- **Search**: Find presentations by name

## Usage

### Creating a New Presentation

1. Click "New Presentation" or the page will start with a default title slide
2. Edit the presentation title by clicking on it in the top bar
3. Add slides using the "Add Slide" button or template gallery
4. Edit slide content by clicking on the slide in the editor

### Editing Slides

#### Text Editing
1. Click on any text to enter edit mode
2. A floating toolbar appears with formatting options
3. Format text using the toolbar buttons
4. Click outside to save changes

#### Adding Elements
1. Use the toolbar buttons to add images, charts, code, or media
2. Elements are inserted at default positions
3. Drag elements to reposition
4. Resize using the corner handles
5. Delete or duplicate using element toolbar

#### Layout Templates
1. Open the Templates tab in the sidebar
2. Click any template to add it as a new slide
3. Edit the template content as needed

### Managing Slides

#### Reordering
- Drag slide thumbnails in the sidebar to reorder

#### Duplicating
1. Select the slide to duplicate
2. Click "Duplicate" in the toolbar
3. New slide appears immediately after current slide

#### Deleting
1. Select the slide to delete
2. Click "Delete" in the toolbar
3. Cannot delete if only one slide remains

### Presenter Mode

1. Click "Present" button in top bar
2. Opens fullscreen presenter view
3. Shows current slide, next slide, and notes
4. Timer starts automatically
5. Use arrow buttons or keyboard to navigate
6. Close presenter view to return to editing

#### Keyboard Shortcuts in Presenter Mode
- `Arrow Right/Down`: Next slide
- `Arrow Left/Up`: Previous slide
- `Esc`: Exit presenter mode
- `Space`: Next slide

### Theming

1. Click "Theme" button in toolbar
2. Select from 10 available themes
3. Theme applies immediately to all slides
4. Themes affect colors, fonts, and overall appearance

### Transitions

1. Click "Transition" button in toolbar
2. Select transition effect
3. Applies to all slides by default
4. Individual slide transitions can be customized

### Speaker Notes

1. Click "Notes" button in toolbar
2. Notes panel appears at bottom
3. Type notes for current slide
4. Notes visible only in presenter mode
5. Yellow sticky note icon shows slides with notes

### Exporting

#### PDF Export
1. Click "Export" dropdown in top bar
2. Select "Export PDF"
3. PDF generates with current theme and content

#### PowerPoint Export
1. Click "Export" dropdown
2. Select "Export PPTX"
3. Compatible with Microsoft PowerPoint

### Saving

- Click "Save" button to save presentation
- Auto-saves occur periodically (if configured)
- Saved presentations appear in Recent list

## Component Architecture

```
presentations/
├── page.tsx                 # Main presentation editor page
├── README.md               # This file
└── components/
    ├── slide-editor.tsx    # Rich text slide editor
    ├── draggable-element.tsx # Draggable/resizable elements
    ├── presenter-view.tsx   # Presenter mode view
    ├── chart-element.tsx    # Chart.js integration
    └── index.ts            # Component exports
```

## API Integration

The module uses `presentationsApi` from `@/lib/api`:

```typescript
// List presentations
const presentations = await presentationsApi.get('/');

// Get presentation
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

// Export presentation
await presentationsApi.get('/:id/export?format=pdf');
await presentationsApi.get('/:id/export?format=pptx');
```

## Dependencies

### Required
- `reveal.js` (^5.1.0): Presentation framework
- `chart.js` (^4.x): Charts and data visualization
- `@tanstack/react-query` (^5.x): Data fetching and caching
- `framer-motion` (^11.x): Animations
- `lucide-react`: Icons

### Optional
- `react-beautiful-dnd`: Drag and drop for slide reordering
- Additional Chart.js plugins for advanced charts

## Customization

### Adding Custom Themes

Edit the `themes` array in `page.tsx`:

```typescript
const themes = [
  { id: 'custom', name: 'Custom', color: '#FF5733' },
  // ... existing themes
];
```

### Adding Custom Layouts

Edit the `layouts` array and `getLayoutTemplate` function:

```typescript
const layouts = [
  { id: 'custom', name: 'Custom Layout', icon: YourIcon },
  // ... existing layouts
];

const getLayoutTemplate = (layout: string) => {
  const templates = {
    custom: '<div>Your custom HTML</div>',
    // ... existing templates
  };
  return templates[layout] || templates.content;
};
```

### Custom Chart Types

Add chart presets in `chart-element.tsx`:

```typescript
export const chartPresets = {
  customChart: {
    type: 'line',
    data: {
      // Your chart data
    },
  },
};
```

## Troubleshooting

### Reveal.js Not Initializing
- Ensure `reveal.js` is installed: `pnpm add reveal.js`
- Check that the ref is properly attached
- Verify slide content is valid HTML

### Charts Not Rendering
- Install Chart.js: `pnpm add chart.js`
- Register required Chart.js components
- Check data format matches Chart.js expectations

### Export Not Working
- Verify API endpoint is configured
- Check server-side export functionality
- Ensure proper authentication

### Presenter Mode Issues
- Check popup blocker settings
- Verify window.open permissions
- Ensure fullscreen API is available

## Performance Tips

1. **Optimize Images**: Use compressed images for faster loading
2. **Limit Slides**: Keep presentations under 50 slides for best performance
3. **Minimize Animations**: Use transitions sparingly
4. **Code Splitting**: Lazy load chart library if not used
5. **Memoization**: Use React.memo for slide components

## Future Enhancements

- [ ] Real-time collaboration with other users
- [ ] Slide comments and annotations
- [ ] Version history and restore
- [ ] Templates marketplace
- [ ] AI-powered content suggestions
- [ ] Video recording during presentation
- [ ] Audience interaction (polls, Q&A)
- [ ] Cloud auto-save
- [ ] Offline mode
- [ ] Mobile presenter app
- [ ] Custom animations builder
- [ ] Slide master templates
- [ ] Advanced grid system
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)

## Accessibility

- Keyboard navigation supported throughout
- ARIA labels on interactive elements
- High contrast theme available
- Screen reader compatible
- Keyboard shortcuts documented

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: Presenter mode requires popup permissions and fullscreen API support.

## License

Part of the AIT-CORE Suite Portal system.
