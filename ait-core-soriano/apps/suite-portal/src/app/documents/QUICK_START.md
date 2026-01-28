# Documents Page - Quick Start Guide

## Getting Started

### 1. Prerequisites
All dependencies are already installed in the suite-portal package.json:
- TipTap and all extensions
- TanStack Query
- Framer Motion
- Radix UI components
- Lucide icons

### 2. File Structure
```
documents/
├── page.tsx                          # Main page component
├── editor-styles.css                 # TipTap custom styles
├── components/
│   ├── KeyboardShortcuts.tsx        # Keyboard shortcuts dialog
│   ├── ExportDialog.tsx             # PDF/DOCX export dialog
│   ├── ShareDialog.tsx              # Document sharing dialog
│   └── DocumentTemplates.tsx        # Template selection dialog
├── README.md                         # Full documentation
├── IMPLEMENTATION_SUMMARY.md        # Technical details
└── QUICK_START.md                   # This file
```

### 3. Navigation
Access the page at: `http://localhost:3001/documents`

## Backend Requirements

### API Endpoints Needed

The page expects these endpoints from your backend:

```typescript
// Documents API (base: /documents)
GET    /                  // List all documents
GET    /:id              // Get single document
POST   /                 // Create document
PATCH  /:id              // Update document
DELETE /:id              // Delete document
GET    /:id/export       // Export (query: ?format=pdf|docx)

// Folders API
GET    /folders          // Get folder tree
POST   /folders          // Create folder
```

### Expected Request/Response

#### Create Document
```typescript
// POST /documents
Request: {
  title: string;
  content: string;      // HTML content
  folderId?: string;
}

Response: {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### Update Document
```typescript
// PATCH /documents/:id
Request: {
  title?: string;
  content?: string;
}

Response: Document
```

## Usage Examples

### Creating a New Document
```typescript
// The page handles this automatically when user clicks "New"
// It calls documentsApi.post('/', { title, content, folderId })
```

### Auto-save
```typescript
// Auto-save triggers 1 second after user stops typing
// Calls documentsApi.patch('/:id', { content })
```

### Export
```typescript
// User clicks Export → PDF/DOCX
// Calls documentsApi.download('/:id/export?format=pdf')
```

## Customization

### Adding Custom Toolbar Buttons

1. Open `page.tsx`
2. Find the `EditorToolbar` component
3. Add your button:

```typescript
<ToolbarButton
  onClick={() => editor.chain().focus().yourCommand().run()}
  active={editor.isActive('yourFeature')}
  tooltip="Your Feature"
>
  <YourIcon className="w-4 h-4" />
</ToolbarButton>
```

### Adding TipTap Extensions

1. Install the extension:
```bash
pnpm add @tiptap/extension-your-extension
```

2. Import and add to editor:
```typescript
import YourExtension from '@tiptap/extension-your-extension';

const editor = useEditor({
  extensions: [
    // ... existing extensions
    YourExtension.configure({
      // your config
    }),
  ],
});
```

### Adding New Templates

Edit `components/DocumentTemplates.tsx`:

```typescript
const templates: Template[] = [
  // ... existing templates
  {
    id: 'your-template',
    name: 'Your Template Name',
    description: 'Template description',
    icon: <YourIcon className="w-6 h-6" />,
    content: `<h1>Your Template HTML</h1>`,
  },
];
```

### Customizing Styles

Edit `editor-styles.css` to change:
- Typography (fonts, sizes, spacing)
- Colors and themes
- Table appearance
- Code block styling
- Task list checkboxes

## Common Tasks

### Disable Auto-save
```typescript
// In page.tsx, comment out the onUpdate handler:
const editor = useEditor({
  // ...
  // onUpdate: ({ editor }) => { ... },
});
```

### Change Auto-save Delay
```typescript
// In debouncedSave function, change the timeout:
const timeout = setTimeout(() => {
  updateDocumentMutation.mutate({ id, content });
}, 2000); // Changed from 1000ms to 2000ms
```

### Add More Colors
```typescript
// In EditorToolbar component:
const colors = [
  '#000000', '#EF4444', '#F59E0B', '#10B981',
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  // Add more colors:
  '#FFFFFF', '#94A3B8', '#FF6B6B', '#4ECDC4',
];
```

### Customize Keyboard Shortcuts
```typescript
// In components/KeyboardShortcuts.tsx
// Edit the shortcuts array to add/modify/remove shortcuts
```

## Testing

### Manual Testing Checklist

✅ **Editor Features**
- [ ] Create new document
- [ ] Type content
- [ ] Apply formatting (bold, italic, etc.)
- [ ] Insert link
- [ ] Insert image
- [ ] Create table
- [ ] Create task list
- [ ] Change text color
- [ ] Highlight text
- [ ] Undo/Redo
- [ ] Auto-save indicator appears

✅ **Document Management**
- [ ] Search documents
- [ ] Star document
- [ ] Delete document
- [ ] Select from recent
- [ ] Select from starred
- [ ] Navigate folders

✅ **Dialogs**
- [ ] Open keyboard shortcuts
- [ ] Share document
- [ ] Export to PDF
- [ ] Export to DOCX
- [ ] Select template

✅ **Responsive**
- [ ] Test on mobile
- [ ] Collapse sidebar
- [ ] Test dark mode

## Troubleshooting

### Issue: Editor doesn't load
**Solution**: Check that all TipTap packages are installed
```bash
cd apps/suite-portal
pnpm install
```

### Issue: Auto-save not working
**Solution**:
1. Check backend API endpoint is accessible
2. Check console for errors
3. Verify documentsApi is configured correctly in `lib/api.ts`

### Issue: Styles not applied
**Solution**:
1. Ensure `editor-styles.css` is imported in `page.tsx`
2. Check Tailwind CSS is working
3. Clear browser cache

### Issue: TypeScript errors
**Solution**:
1. Check all types are properly defined
2. Run `pnpm type-check`
3. Ensure TypeScript version is 5.4.5+

### Issue: Export not working
**Solution**:
1. Backend must implement export endpoint
2. Check CORS settings
3. Verify file download permissions

## Performance Tips

### Optimize Large Documents
```typescript
// Implement virtual scrolling for document list
// Use React.memo for document items
// Lazy load document content
```

### Reduce Bundle Size
```typescript
// Only import needed TipTap extensions
// Use dynamic imports for heavy components
// Enable code splitting
```

## Security Best Practices

1. **Sanitize HTML**: TipTap handles this automatically
2. **Validate Input**: Add validation on backend
3. **Rate Limiting**: Implement on auto-save endpoint
4. **Access Control**: Verify user permissions before operations
5. **XSS Prevention**: Already handled by React

## Support

### Need Help?
1. Check `README.md` for detailed documentation
2. Review `IMPLEMENTATION_SUMMARY.md` for technical details
3. Check TipTap docs: https://tiptap.dev
4. Check TanStack Query docs: https://tanstack.com/query

### Common Questions

**Q: Can I add real-time collaboration?**
A: Yes! The Collaboration and CollaborationCursor extensions are already configured. You need to:
1. Set up Y.js document
2. Connect WebRTC or WebSocket provider
3. Bind to editor

**Q: How do I add custom fonts?**
A: Install `@tiptap/extension-font-family` and configure it in the editor extensions.

**Q: Can I customize the toolbar?**
A: Yes! Edit the `EditorToolbar` component to add/remove/reorder buttons.

**Q: How do I implement document permissions?**
A: Add permission checks in the backend API and conditionally render UI elements based on user permissions.

## Next Steps

1. ✅ Implement backend API endpoints
2. ✅ Test all features
3. ✅ Configure authentication
4. ✅ Set up file storage for images
5. ✅ Implement export service
6. ⚠️ Add real-time collaboration (optional)
7. ⚠️ Add version history (optional)
8. ⚠️ Add AI features (optional)

---

**Ready to use!** The Documents page is fully functional and awaits backend integration.
