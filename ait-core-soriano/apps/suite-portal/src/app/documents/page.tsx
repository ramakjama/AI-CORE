'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import './editor-styles.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Save,
  Share2,
  Download,
  FileText,
  Folder,
  Star,
  Clock,
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Palette,
  Highlighter,
  Check,
  Users,
} from 'lucide-react';
import { documentsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { ExportDialog } from './components/ExportDialog';
import { ShareDialog } from './components/ShareDialog';
import { DocumentTemplates } from './components/DocumentTemplates';
import { RemoteCursors, RemoteSelection, UserPresenceIndicator } from '@/components/collaboration';
import { usePresence, useMouseTracking, useSelectionTracking } from '@/hooks/use-presence';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Types
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

// Toolbar Component
const EditorToolbar = ({ editor }: { editor: any }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);

  if (!editor) return null;

  const colors = [
    '#000000',
    '#EF4444',
    '#F59E0B',
    '#10B981',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#EC4899',
  ];

  const ToolbarButton = ({
    onClick,
    active,
    disabled,
    children,
    tooltip,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'p-2 rounded hover:bg-accent transition-colors',
            active && 'bg-accent text-accent-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-background sticky top-0 z-10">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          tooltip="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          tooltip="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          tooltip="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          tooltip="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r pr-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          tooltip="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          tooltip="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          tooltip="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          active={editor.isActive({ textAlign: 'justify' })}
          tooltip="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Insert */}
      <div className="flex items-center gap-1 border-r pr-2">
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          tooltip="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter image URL');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          tooltip="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
          tooltip="Insert Table"
        >
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 border-r pr-2 relative">
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            tooltip="Text Color"
          >
            <Palette className="w-4 h-4" />
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-50">
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setColor(color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Set text color to ${color}`}
                    title={`Color: ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            active={editor.isActive('highlight')}
            tooltip="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-popover border rounded-md shadow-lg z-50">
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight({ color }).run();
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    aria-label={`Highlight with ${color}`}
                    title={`Highlight color: ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="Undo (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="Redo (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </div>
  );
};

// Folder Tree Component
const FolderTree = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
}: {
  folders: Folder[];
  selectedFolder?: string;
  onSelectFolder: (folderId?: string) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: Folder, level: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors',
            isSelected && 'bg-accent text-accent-foreground'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5 hover:bg-muted rounded"
              aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          <Folder className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm flex-1">{folder.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent transition-colors',
          !selectedFolder && 'bg-accent text-accent-foreground'
        )}
        onClick={() => onSelectFolder(undefined)}
      >
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm flex-1">All Documents</span>
      </div>
      {folders.map((folder) => renderFolder(folder))}
    </div>
  );
};

// Documents List Component
const DocumentsList = ({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  onToggleStar,
}: {
  documents: Document[];
  selectedDocument?: Document;
  onSelectDocument: (doc: Document) => void;
  onDeleteDocument: (docId: string) => void;
  onToggleStar: (docId: string) => void;
}) => {
  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(
            'flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors group',
            selectedDocument?.id === doc.id && 'bg-accent text-accent-foreground'
          )}
          onClick={() => onSelectDocument(doc)}
        >
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{doc.title || 'Untitled'}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(doc.id);
              }}
              className="p-1 hover:bg-muted rounded"
              aria-label={doc.starred ? 'Unstar document' : 'Star document'}
              title={doc.starred ? 'Unstar' : 'Star'}
            >
              <Star
                className={cn(
                  'w-3 h-3',
                  doc.starred && 'fill-yellow-400 text-yellow-400'
                )}
              />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 hover:bg-muted rounded"
                  aria-label="Document options"
                  title="More options"
                >
                  <MoreVertical className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDocument(doc.id);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Main Documents Page
export default function DocumentsPage() {
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>();
  const [documentTitle, setDocumentTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPresence, setShowPresence] = useState(true);

  // Refs for tracking
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorContentRef = useRef<HTMLDivElement>(null);

  // Mock user ID - replace with real auth
  const currentUserId = 'user-' + Math.random().toString(36).substr(2, 9);
  const currentUserName = 'Demo User';

  // Initialize presence system
  const {
    activeUsers,
    onlineUsers,
    updateCursor,
    updateSelection,
    addRemoteUser,
    processRemoteUpdate,
  } = usePresence({
    userId: currentUserId,
    documentId: selectedDocument?.id,
    userName: currentUserName,
    enabled: showPresence && !!selectedDocument,
    onBroadcast: (broadcast) => {
      // In production, send this via WebSocket/Socket.io
      console.log('Broadcasting presence:', broadcast);
    },
  });

  // Track mouse position
  const cursorPosition = useMouseTracking(editorContainerRef, showPresence && !!selectedDocument);

  // Track selection
  const selectionRange = useSelectionTracking(editorContentRef, showPresence && !!selectedDocument);

  // Update cursor position
  useEffect(() => {
    if (cursorPosition && selectedDocument) {
      updateCursor(cursorPosition);
    }
  }, [cursorPosition, selectedDocument, updateCursor]);

  // Update selection
  useEffect(() => {
    if (selectedDocument) {
      updateSelection(selectionRange || undefined);
    }
  }, [selectionRange, selectedDocument, updateSelection]);

  // Simulate remote users for demo (remove in production)
  useEffect(() => {
    if (!selectedDocument || !showPresence) return;

    const interval = setInterval(() => {
      // Simulate 2-3 remote users
      const remoteUserCount = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < remoteUserCount; i++) {
        const remoteUserId = `remote-user-${i}`;
        addRemoteUser(remoteUserId, {
          id: remoteUserId,
          name: `Collaborator ${i + 1}`,
        });

        // Simulate random cursor movement
        const randomX = Math.random() * 800;
        const randomY = Math.random() * 600;
        processRemoteUpdate({
          type: 'cursor',
          userId: remoteUserId,
          data: { cursor: { x: randomX, y: randomY } },
          timestamp: Date.now(),
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedDocument, showPresence, addRemoteUser, processRemoteUpdate]);

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', selectedFolder],
    queryFn: async () => {
      const response = await documentsApi.get('/');
      return response as Document[];
    },
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      const response = await documentsApi.get('/folders');
      return response as Folder[];
    },
  });

  // Create document mutation
  const createDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content?: string; folderId?: string }) => {
      return await documentsApi.post('/', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; title?: string; content?: string }) => {
      return await documentsApi.patch(`/${data.id}`, {
        title: data.title,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setIsSaving(false);
    },
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await documentsApi.delete(`/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDocument(null);
    },
  });

  // Debounced auto-save
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const debouncedSave = useCallback((documentId: string, content: string) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    setIsSaving(true);
    const timeout = setTimeout(() => {
      updateDocumentMutation.mutate({
        id: documentId,
        content,
      });
    }, 1000); // Save after 1 second of inactivity

    setAutoSaveTimeout(timeout);
  }, [autoSaveTimeout, updateDocumentMutation]);

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        placeholder: {
          placeholder: 'Start typing your document...',
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:no-underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex items-start gap-2',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: selectedDocument?.content || '<p>Start typing...</p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert mx-auto focus:outline-none min-h-[calc(100vh-200px)] p-8',
      },
    },
    onUpdate: ({ editor }) => {
      if (selectedDocument) {
        const content = editor.getHTML();
        debouncedSave(selectedDocument.id, content);
      }
    },
  });

  // Update editor content when document changes
  useEffect(() => {
    if (editor && selectedDocument) {
      editor.commands.setContent(selectedDocument.content || '<p>Start typing...</p>');
      setDocumentTitle(selectedDocument.title);
    }
  }, [selectedDocument, editor]);

  // Handle new document
  const handleNewDocument = async (content?: string, title?: string) => {
    const newDoc = await createDocumentMutation.mutateAsync({
      title: title || 'Untitled Document',
      content: content || '<p>Start typing...</p>',
      folderId: selectedFolder,
    });
    setSelectedDocument(newDoc as Document);
  };

  // Handle template selection
  const handleTemplateSelect = async (template: { name: string; content: string }) => {
    await handleNewDocument(template.content, template.name);
  };

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    if (selectedDocument) {
      updateDocumentMutation.mutate({
        id: selectedDocument.id,
        title: newTitle,
      });
    }
  };


  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || doc.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const starredDocuments = documents.filter((doc) => doc.starred);
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-72 border-r bg-card flex flex-col"
            >
              <div className="p-4 border-b space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Documents</h2>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleNewDocument()}>
                      <Plus className="w-4 h-4 mr-1" />
                      New
                    </Button>
                  </div>
                </div>
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <DocumentTemplates onSelectTemplate={handleTemplateSelect} />
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Recent Documents */}
                {recentDocuments.length > 0 && (
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Recent</h3>
                    </div>
                    <DocumentsList
                      documents={recentDocuments}
                      selectedDocument={selectedDocument || undefined}
                      onSelectDocument={setSelectedDocument}
                      onDeleteDocument={(id) => deleteDocumentMutation.mutate(id)}
                      onToggleStar={(id) => {
                        // Toggle star logic
                      }}
                    />
                  </div>
                )}

                {/* Starred Documents */}
                {starredDocuments.length > 0 && (
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Starred</h3>
                    </div>
                    <DocumentsList
                      documents={starredDocuments}
                      selectedDocument={selectedDocument || undefined}
                      onSelectDocument={setSelectedDocument}
                      onDeleteDocument={(id) => deleteDocumentMutation.mutate(id)}
                      onToggleStar={(id) => {
                        // Toggle star logic
                      }}
                    />
                  </div>
                )}

                {/* Folder Tree */}
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground" />
                      <h3 className="text-sm font-medium">Folders</h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const name = window.prompt('Folder name');
                        if (name) {
                          // Create folder logic
                        }
                      }}
                    >
                      <FolderPlus className="w-3 h-3" />
                    </Button>
                  </div>
                  <FolderTree
                    folders={folders}
                    selectedFolder={selectedFolder}
                    onSelectFolder={setSelectedFolder}
                    onCreateFolder={(name, parentId) => {
                      // Create folder logic
                    }}
                  />
                </div>

                {/* All Documents */}
                <div className="p-4">
                  <h3 className="text-sm font-medium mb-2">All Documents</h3>
                  <DocumentsList
                    documents={filteredDocuments}
                    selectedDocument={selectedDocument || undefined}
                    onSelectDocument={setSelectedDocument}
                    onDeleteDocument={(id) => deleteDocumentMutation.mutate(id)}
                    onToggleStar={(id) => {
                      // Toggle star logic
                    }}
                  />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="h-16 border-b bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                title={showSidebar ? 'Hide sidebar' : 'Show sidebar'}
              >
                <FileText className="w-4 h-4" />
              </Button>
              <Input
                value={documentTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled Document"
                className="text-lg font-medium border-none shadow-none focus-visible:ring-0 max-w-md"
              />
              {isSaving && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Save className="w-3 h-3" />
                  </motion.div>
                  Saving...
                </span>
              )}
              {!isSaving && selectedDocument && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-500" />
                  Saved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Collaboration Indicators */}
              {selectedDocument && showPresence && onlineUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 border rounded-lg bg-muted/50">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 3).map((user) => (
                      <div key={user.userId} className="relative">
                        <Avatar className="w-7 h-7 border-2 border-background">
                          <AvatarImage src={user.user?.avatar} />
                          <AvatarFallback style={{ backgroundColor: user.color }}>
                            {user.user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                          <UserPresenceIndicator user={user} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                  {onlineUsers.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{onlineUsers.length - 3}
                    </span>
                  )}
                </div>
              )}

              <Button
                variant={showPresence ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPresence(!showPresence)}
                title={showPresence ? 'Hide presence' : 'Show presence'}
              >
                <Users className="w-4 h-4 mr-1" />
                {showPresence ? 'Live' : 'Offline'}
              </Button>

              <KeyboardShortcuts />
              {selectedDocument && (
                <>
                  <ShareDialog
                    documentId={selectedDocument.id}
                    documentTitle={selectedDocument.title}
                  />
                  <ExportDialog
                    documentId={selectedDocument.id}
                    documentTitle={selectedDocument.title}
                  />
                </>
              )}
            </div>
          </div>

          {/* Editor */}
          {selectedDocument ? (
            <div className="flex-1 overflow-y-auto relative" ref={editorContainerRef}>
              <EditorToolbar editor={editor} />
              <div className="relative" ref={editorContentRef}>
                <EditorContent editor={editor} className="h-full" />

                {/* Collaboration Overlays */}
                {showPresence && (
                  <>
                    <RemoteSelection
                      activeUsers={activeUsers}
                      localUserId={currentUserId}
                    />
                    <RemoteCursors
                      activeUsers={activeUsers}
                      localUserId={currentUserId}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-semibold">No document selected</h2>
                <p className="text-muted-foreground">
                  Select a document from the sidebar or create a new one
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => handleNewDocument()}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                  </Button>
                  <DocumentTemplates onSelectTemplate={handleTemplateSelect} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
