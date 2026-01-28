# Documents Page - TipTap Rich Text Editor

A comprehensive document editor built with TipTap, featuring real-time collaboration capabilities, rich formatting options, and intelligent document management.

## Features

### Rich Text Editing
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3 with proper hierarchy
- **Lists**: Bullet lists, numbered lists, and task lists with checkboxes
- **Text Alignment**: Left, Center, Right, Justify
- **Colors**: Text color and highlight color with color picker
- **Links & Images**: Insert and manage hyperlinks and images
- **Tables**: Create and edit tables with resizable columns
- **Code Blocks**: Syntax-highlighted code blocks and inline code

### Document Management
- **Folder Organization**: Hierarchical folder structure
- **Starred Documents**: Quick access to favorite documents
- **Recent Documents**: View recently edited documents
- **Search**: Full-text search across all documents
- **Auto-save**: Automatic saving with 1-second debounce
- **Export**: Export to PDF and DOCX formats

### User Interface
- **Responsive Sidebar**: Collapsible sidebar with document tree
- **Rich Toolbar**: Comprehensive formatting toolbar with tooltips
- **Dark Mode**: Full dark mode support
- **Animations**: Smooth Framer Motion animations
- **Mobile Responsive**: Works on all screen sizes

### Collaboration (Y.js Ready)
- Extensions configured for real-time collaboration
- Collaboration cursor tracking
- Ready for WebRTC or WebSocket integration

## Technical Stack

### Core Dependencies
- **TipTap**: React-based rich text editor
- **TanStack Query**: Data fetching and caching
- **Framer Motion**: Animation library
- **Radix UI**: Accessible UI components
- **Tailwind CSS**: Utility-first styling

### TipTap Extensions Used

#### Essential Extensions
- `@tiptap/starter-kit` - Base editor functionality
- `@tiptap/extension-placeholder` - Placeholder text
- `@tiptap/extension-underline` - Underline formatting

#### Rich Formatting
- `@tiptap/extension-text-style` - Base for text styling
- `@tiptap/extension-color` - Text color
- `@tiptap/extension-highlight` - Text highlighting
- `@tiptap/extension-text-align` - Text alignment

#### Content Types
- `@tiptap/extension-link` - Hyperlinks
- `@tiptap/extension-image` - Images
- `@tiptap/extension-table` - Tables
- `@tiptap/extension-table-row` - Table rows
- `@tiptap/extension-table-cell` - Table cells
- `@tiptap/extension-table-header` - Table headers
- `@tiptap/extension-task-list` - Task lists
- `@tiptap/extension-task-item` - Task items

#### Collaboration (Ready for Integration)
- `@tiptap/extension-collaboration` - Real-time collaboration
- `@tiptap/extension-collaboration-cursor` - Cursor tracking

## File Structure

```
documents/
├── page.tsx              # Main Documents page component
├── editor-styles.css     # TipTap editor custom styles
└── README.md            # This file
```

## API Integration

The page integrates with the backend using the `documentsApi` client from `@/lib/api`:

### Endpoints Used
- `GET /documents/` - List all documents
- `GET /documents/:id` - Get document by ID
- `POST /documents/` - Create new document
- `PATCH /documents/:id` - Update document
- `DELETE /documents/:id` - Delete document
- `GET /documents/:id/export?format=pdf|docx` - Export document
- `GET /documents/folders` - Get folder tree

### Data Types

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  starred: boolean;
  updatedAt: string;
  createdAt: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children?: Folder[];
}
```

## Usage

### Creating a New Document
1. Click the "New" button in the sidebar
2. Start typing in the editor
3. The document auto-saves every second
4. Edit the title by clicking on "Untitled Document" at the top

### Formatting Text
1. Select text in the editor
2. Click formatting buttons in the toolbar
3. Use keyboard shortcuts:
   - Bold: `Ctrl+B` / `Cmd+B`
   - Italic: `Ctrl+I` / `Cmd+I`
   - Underline: `Ctrl+U` / `Cmd+U`
   - Undo: `Ctrl+Z` / `Cmd+Z`
   - Redo: `Ctrl+Y` / `Cmd+Y`

### Inserting Elements
- **Link**: Click link icon, enter URL
- **Image**: Click image icon, enter image URL
- **Table**: Click table icon to insert 3x3 table
- **Color**: Click color/highlight icon, choose color

### Organizing Documents
1. Create folders using the folder+ icon
2. Drag documents to folders (feature ready)
3. Star important documents for quick access
4. Search documents using the search bar

### Exporting Documents
1. Click "Export" button in top bar
2. Choose format (PDF or DOCX)
3. Document downloads automatically

## Customization

### Styling
Edit `editor-styles.css` to customize:
- Typography (headings, paragraphs)
- Colors and themes
- Table styles
- Code block appearance
- Task list checkboxes

### Adding Extensions
To add more TipTap extensions:

```typescript
import NewExtension from '@tiptap/extension-new-extension';

const editor = useEditor({
  extensions: [
    // ... existing extensions
    NewExtension.configure({
      // configuration
    }),
  ],
});
```

### Toolbar Customization
Edit the `EditorToolbar` component to:
- Add new formatting buttons
- Remove unwanted options
- Reorganize button groups
- Add custom actions

## Performance Optimization

### Auto-save Debouncing
The editor uses a 1-second debounce for auto-save to prevent excessive API calls:

```typescript
const debouncedSave = useCallback((documentId: string, content: string) => {
  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
  setIsSaving(true);
  const timeout = setTimeout(() => {
    updateDocumentMutation.mutate({ id: documentId, content });
  }, 1000);
  setAutoSaveTimeout(timeout);
}, [autoSaveTimeout, updateDocumentMutation]);
```

### Query Caching
TanStack Query automatically caches:
- Document list
- Folder structure
- Individual documents

## Future Enhancements

### Planned Features
- [ ] Real-time collaboration with Y.js + WebRTC
- [ ] Document templates
- [ ] Version history
- [ ] Comments and annotations
- [ ] Document sharing permissions
- [ ] Offline support with service workers
- [ ] AI-powered writing assistance
- [ ] Advanced search with filters
- [ ] Document statistics (word count, reading time)
- [ ] Custom fonts and themes

### Integration Points
- Connect Y.js for real-time collaboration
- Add socket.io for real-time updates
- Implement document versioning
- Add permission system for sharing

## Troubleshooting

### Editor Not Loading
- Check that all TipTap packages are installed
- Verify `documentsApi` is configured correctly
- Check browser console for errors

### Auto-save Not Working
- Ensure backend `/documents/:id` PATCH endpoint exists
- Check network tab for failed requests
- Verify authentication tokens are valid

### Styling Issues
- Import `editor-styles.css` is present
- Check Tailwind CSS configuration
- Verify dark mode classes are applied

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## License

Part of the AIT-CORE Suite Portal
