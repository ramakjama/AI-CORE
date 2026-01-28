# Presentations Module - Documentation Index

Complete documentation for the AIT-CORE Suite Portal Presentations module.

## Overview

The Presentations module is a comprehensive presentation creation and editing tool built with React, Next.js, and Reveal.js. It provides a modern, intuitive interface for creating professional presentations with support for rich media, charts, animations, and presenter mode.

## Quick Links

### For Users
- **[User Guide (README.md)](./README.md)** - Complete user documentation
- **[Quick Reference](./QUICK_REFERENCE.md)** - Fast lookup for common operations
- **[Installation Guide](../INSTALL_PRESENTATIONS_DEPENDENCIES.md)** - Setup instructions

### For Developers
- **[Implementation Guide](./IMPLEMENTATION_GUIDE.md)** - Detailed technical documentation
- **[Architecture Overview](./ARCHITECTURE.md)** - System design and data flow
- **[Code Examples](./examples.tsx)** - Reference implementations

---

## Documentation Structure

### 1. README.md
**Purpose**: User-facing documentation
**Contents**:
- Feature overview
- Usage instructions
- Layout templates
- Presenter mode guide
- Export options
- Keyboard shortcuts
- Troubleshooting

**Best for**: End users learning how to use the module

---

### 2. IMPLEMENTATION_GUIDE.md
**Purpose**: Developer implementation reference
**Contents**:
- Architecture overview
- Component structure
- API integration
- Customization guide
- Advanced features
- Best practices
- Debugging tips

**Best for**: Developers implementing or extending the module

---

### 3. ARCHITECTURE.md
**Purpose**: System design documentation
**Contents**:
- Visual diagrams
- Data flow charts
- Component hierarchy
- State management
- Event flow
- Performance strategies

**Best for**: Understanding the system architecture

---

### 4. QUICK_REFERENCE.md
**Purpose**: Quick lookup guide
**Contents**:
- Common operations
- Code snippets
- Keyboard shortcuts
- API endpoints
- TypeScript types
- Quick fixes

**Best for**: Fast reference during development

---

### 5. examples.tsx
**Purpose**: Code examples and patterns
**Contents**:
- Creating presentations
- Custom layouts
- Chart configurations
- Theme customization
- Export functions
- Keyboard shortcuts
- Auto-save implementation

**Best for**: Copy-paste reference code

---

### 6. INSTALL_PRESENTATIONS_DEPENDENCIES.md
**Purpose**: Installation instructions
**Contents**:
- Required dependencies
- Installation commands
- Verification steps
- Troubleshooting
- Optional packages

**Best for**: Initial setup and dependency management

---

## Getting Started

### For New Users

1. **Start here**: [README.md](./README.md)
   - Learn basic features
   - Create your first presentation
   - Explore templates

2. **Then**: [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
   - Learn keyboard shortcuts
   - Bookmark for quick access

### For Developers

1. **Start here**: [INSTALL_PRESENTATIONS_DEPENDENCIES.md](../INSTALL_PRESENTATIONS_DEPENDENCIES.md)
   - Install dependencies
   - Verify setup

2. **Then**: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
   - Understand architecture
   - Learn customization options

3. **Reference**: [examples.tsx](./examples.tsx)
   - See code examples
   - Copy patterns

4. **Deep dive**: [ARCHITECTURE.md](./ARCHITECTURE.md)
   - Understand data flow
   - Learn system design

---

## File Structure

```
presentations/
├── page.tsx                          # Main presentation editor
├── INDEX.md                          # This file - documentation index
├── README.md                         # User guide
├── IMPLEMENTATION_GUIDE.md           # Developer guide
├── ARCHITECTURE.md                   # System architecture
├── QUICK_REFERENCE.md                # Quick reference
└── examples.tsx                      # Code examples

../INSTALL_PRESENTATIONS_DEPENDENCIES.md  # Installation guide

components/presentations/
├── slide-editor.tsx                  # Rich text editor
├── draggable-element.tsx             # Draggable elements
├── presenter-view.tsx                # Presenter mode
├── chart-element.tsx                 # Chart.js integration
└── index.ts                          # Component exports

types/
└── reveal.d.ts                       # TypeScript definitions
```

---

## Features Summary

### Core Features
- ✅ Reveal.js presentation engine
- ✅ WYSIWYG slide editor
- ✅ Drag-and-drop slide reordering
- ✅ 10 built-in themes
- ✅ 6 transition effects
- ✅ Presenter mode with notes
- ✅ Export to PDF/PPTX
- ✅ Real-time preview

### Slide Elements
- ✅ Rich text editing
- ✅ Images and media
- ✅ Charts (Chart.js)
- ✅ Code blocks
- ✅ Shapes
- ✅ Custom layouts

### Advanced Features
- ✅ Speaker notes
- ✅ Slide thumbnails
- ✅ Template gallery
- ✅ Theme customization
- ✅ Keyboard shortcuts
- ✅ Auto-save (configurable)

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| Next.js | 14.2.3 | Framework |
| Reveal.js | 5.1.0 | Presentation engine |
| Chart.js | 4.4.0 | Data visualization |
| TanStack Query | 5.32.0 | State management |
| Framer Motion | 11.1.7 | Animations |
| TypeScript | 5.4.5 | Type safety |
| Tailwind CSS | 3.4.3 | Styling |

---

## Common Tasks

### I want to...

#### ...create my first presentation
→ Read: [README.md - Usage Section](./README.md#usage)

#### ...understand the code structure
→ Read: [IMPLEMENTATION_GUIDE.md - Component Structure](./IMPLEMENTATION_GUIDE.md#component-structure)

#### ...add a custom theme
→ Read: [IMPLEMENTATION_GUIDE.md - Customization Guide](./IMPLEMENTATION_GUIDE.md#customization-guide)

#### ...integrate a new chart type
→ Reference: [examples.tsx - Chart Examples](./examples.tsx)

#### ...fix a bug
→ Read: [IMPLEMENTATION_GUIDE.md - Troubleshooting](./IMPLEMENTATION_GUIDE.md#troubleshooting)

#### ...optimize performance
→ Read: [ARCHITECTURE.md - Performance Optimization](./ARCHITECTURE.md#performance-optimization)

#### ...understand data flow
→ Read: [ARCHITECTURE.md - Data Flow Diagram](./ARCHITECTURE.md#data-flow-diagram)

#### ...add keyboard shortcuts
→ Reference: [examples.tsx - Keyboard Shortcuts](./examples.tsx)

#### ...implement auto-save
→ Reference: [examples.tsx - Auto-save Implementation](./examples.tsx)

#### ...export presentations
→ Reference: [examples.tsx - Export Functions](./examples.tsx)

---

## API Reference

### Endpoints

```typescript
GET    /presentations              // List all presentations
GET    /presentations/:id          // Get presentation
POST   /presentations              // Create presentation
PATCH  /presentations/:id          // Update presentation
DELETE /presentations/:id          // Delete presentation
GET    /presentations/:id/export   // Export (PDF/PPTX)
POST   /presentations/:id/share    // Share with users
```

### Client Usage

```typescript
import { presentationsApi } from '@/lib/api';

// List
const presentations = await presentationsApi.get('/');

// Get
const presentation = await presentationsApi.get('/:id');

// Create
const newPresentation = await presentationsApi.post('/', data);

// Update
await presentationsApi.patch('/:id', updates);

// Delete
await presentationsApi.delete('/:id');

// Export
await presentationsApi.get('/:id/export?format=pdf');
```

---

## Component Reference

### Main Components

| Component | File | Purpose |
|-----------|------|---------|
| PresentationsPage | page.tsx | Main editor container |
| SlideEditor | slide-editor.tsx | Rich text editing |
| DraggableElement | draggable-element.tsx | Movable elements |
| PresenterView | presenter-view.tsx | Presenter mode |
| ChartElement | chart-element.tsx | Charts |

### Component Props

See [IMPLEMENTATION_GUIDE.md - Component Structure](./IMPLEMENTATION_GUIDE.md#component-structure) for detailed prop interfaces.

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

Full list: [QUICK_REFERENCE.md - Keyboard Shortcuts](./QUICK_REFERENCE.md#keyboard-shortcuts)

---

## Troubleshooting

### Common Issues

1. **Reveal.js not loading**
   - Solution: [IMPLEMENTATION_GUIDE.md - Troubleshooting](./IMPLEMENTATION_GUIDE.md#issue-revealjs-not-initializing)

2. **Charts not rendering**
   - Solution: [IMPLEMENTATION_GUIDE.md - Troubleshooting](./IMPLEMENTATION_GUIDE.md#issue-charts-not-rendering)

3. **Presenter mode blocked**
   - Solution: [IMPLEMENTATION_GUIDE.md - Troubleshooting](./IMPLEMENTATION_GUIDE.md#issue-presenter-mode-blocked)

4. **Performance issues**
   - Solution: [IMPLEMENTATION_GUIDE.md - Troubleshooting](./IMPLEMENTATION_GUIDE.md#issue-slow-performance-with-many-slides)

---

## Development Workflow

### 1. Setup
```bash
cd apps/suite-portal
pnpm add reveal.js chart.js
pnpm dev
```

### 2. Development
- Make changes to components
- Test in browser at `http://localhost:3001/presentations`
- Use React DevTools for debugging

### 3. Testing
- Test all features manually
- Check different browsers
- Verify export functionality
- Test presenter mode

### 4. Deployment
```bash
pnpm build
pnpm start
```

---

## Best Practices

### Code Quality
- Use TypeScript for type safety
- Follow React best practices
- Keep components small and focused
- Write meaningful variable names
- Add comments for complex logic

### Performance
- Memoize components with React.memo
- Debounce text input
- Optimize images
- Lazy load heavy components
- Use virtual scrolling for lists

### Security
- Sanitize HTML input (use DOMPurify)
- Validate file uploads
- Use HTTPS
- Implement proper authentication
- Check permissions on API calls

### Accessibility
- Add ARIA labels
- Support keyboard navigation
- Ensure color contrast
- Provide text alternatives
- Test with screen readers

---

## Contributing

When contributing to this module:

1. Read the [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
2. Follow the existing code style
3. Add TypeScript types
4. Test thoroughly
5. Update documentation
6. Add examples to [examples.tsx](./examples.tsx)

---

## Version History

### v1.0.0 (Current)
- Initial release
- Core presentation features
- Reveal.js integration
- Chart support
- Presenter mode
- Export functionality

### Future Versions
- v1.1.0: Real-time collaboration
- v1.2.0: AI-powered suggestions
- v1.3.0: Mobile app
- v2.0.0: Major feature additions

---

## Support & Resources

### Documentation
- This index file
- Individual documentation files
- Code examples
- Architecture diagrams

### External Resources
- [Reveal.js Documentation](https://revealjs.com/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [React Query Docs](https://tanstack.com/query/latest)
- [Framer Motion API](https://www.framer.com/motion/)

### Getting Help
1. Check documentation
2. Review code examples
3. Check troubleshooting section
4. Contact development team

---

## License

Part of the AIT-CORE Suite Portal system.

---

## Quick Navigation

**Start Here**:
- New User? → [README.md](./README.md)
- Developer? → [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- Quick Lookup? → [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

**Deep Dives**:
- Architecture → [ARCHITECTURE.md](./ARCHITECTURE.md)
- Examples → [examples.tsx](./examples.tsx)
- Installation → [INSTALL_PRESENTATIONS_DEPENDENCIES.md](../INSTALL_PRESENTATIONS_DEPENDENCIES.md)

---

**Last Updated**: 2024
**Module Version**: 1.0.0
**Documentation Version**: 1.0.0
