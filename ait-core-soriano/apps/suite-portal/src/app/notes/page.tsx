"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StickyNote,
  Search,
  Plus,
  Pin,
  Trash2,
  Eye,
  Edit,
  Save,
  Clock,
  Tag,
  Palette,
} from "lucide-react";
import { format } from "date-fns";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { nanoid } from "nanoid";

// Types
interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

type NoteFilter = "all" | "recent" | "pinned";

// Mock API functions
const fetchNotes = async (): Promise<Note[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const savedNotes = localStorage.getItem("notes");
  if (savedNotes) {
    const parsed = JSON.parse(savedNotes);
    return parsed.map((note: any) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  }
  return [];
};

const saveNote = async (note: Partial<Note>): Promise<Note> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const savedNotes = localStorage.getItem("notes");
  const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];

  if (note.id) {
    const index = notes.findIndex((n) => n.id === note.id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...note, updatedAt: new Date() };
      localStorage.setItem("notes", JSON.stringify(notes));
      return notes[index];
    }
  }

  const newNote: Note = {
    id: nanoid(),
    title: note.title || "Untitled Note",
    content: note.content || "",
    color: note.color || "#ffffff",
    pinned: note.pinned || false,
    tags: note.tags || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  notes.push(newNote);
  localStorage.setItem("notes", JSON.stringify(notes));
  return newNote;
};

const deleteNote = async (id: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const savedNotes = localStorage.getItem("notes");
  if (savedNotes) {
    const notes: Note[] = JSON.parse(savedNotes);
    const filtered = notes.filter((note) => note.id !== id);
    localStorage.setItem("notes", JSON.stringify(filtered));
  }
};

const togglePin = async (id: string): Promise<Note> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const savedNotes = localStorage.getItem("notes");
  if (savedNotes) {
    const notes: Note[] = JSON.parse(savedNotes);
    const note = notes.find((n) => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = new Date();
      localStorage.setItem("notes", JSON.stringify(notes));
      return note;
    }
  }
  throw new Error("Note not found");
};

// Color options
const colorOptions = [
  { name: "White", value: "#ffffff" },
  { name: "Blue", value: "#dbeafe" },
  { name: "Green", value: "#d1fae5" },
  { name: "Yellow", value: "#fef3c7" },
  { name: "Red", value: "#fee2e2" },
  { name: "Purple", value: "#ede9fe" },
  { name: "Pink", value: "#fce7f3" },
  { name: "Orange", value: "#fed7aa" },
];

// Animation variants
const sidebarVariants = {
  hidden: { x: -300, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

const editorVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100 } },
};

const noteVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -100, transition: { duration: 0.2 } },
};

export default function NotesPage() {
  const queryClient = useQueryClient();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [filter, setFilter] = useState<NoteFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [tagInput, setTagInput] = useState("");

  // Queries
  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: fetchNotes,
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: saveNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      setSelectedNote(null);
    },
  });

  const pinMutation = useMutation({
    mutationFn: togglePin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  // TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextStyle,
      Color,
    ],
    content: selectedNote?.content || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[400px] max-w-none",
      },
    },
    onUpdate: ({ editor }) => {
      handleAutoSave(editor.getHTML());
    },
  });

  // Update editor content when note changes
  useEffect(() => {
    if (editor && selectedNote) {
      editor.commands.setContent(selectedNote.content);
      setSelectedColor(selectedNote.color);
    }
  }, [selectedNote, editor]);

  // Auto-save functionality
  const handleAutoSave = useCallback((content: string) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(() => {
      if (selectedNote) {
        saveMutation.mutate({
          id: selectedNote.id,
          content,
        });
      }
    }, 2000);

    setAutoSaveTimeout(timeout);
  }, [selectedNote, saveMutation, autoSaveTimeout]);

  const handleCreateNote = () => {
    saveMutation.mutate(
      {
        title: "New Note",
        content: "",
        color: "#ffffff",
        pinned: false,
        tags: [],
      },
      {
        onSuccess: (newNote) => {
          setSelectedNote(newNote);
        },
      }
    );
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const handleDeleteNote = () => {
    if (selectedNote && confirm("Are you sure you want to delete this note?")) {
      deleteMutation.mutate(selectedNote.id);
    }
  };

  const handleTogglePin = () => {
    if (selectedNote) {
      pinMutation.mutate(selectedNote.id);
    }
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    if (selectedNote) {
      saveMutation.mutate({
        id: selectedNote.id,
        color,
      });
    }
  };

  const handleTitleChange = (title: string) => {
    if (selectedNote) {
      saveMutation.mutate({
        id: selectedNote.id,
        title,
      });
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && selectedNote) {
      const newTags = [...selectedNote.tags, tagInput.trim()];
      saveMutation.mutate({
        id: selectedNote.id,
        tags: newTags,
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (selectedNote) {
      const newTags = selectedNote.tags.filter((t) => t !== tag);
      saveMutation.mutate({
        id: selectedNote.id,
        tags: newTags,
      });
    }
  };

  const handleSaveManual = () => {
    if (selectedNote && editor) {
      saveMutation.mutate({
        id: selectedNote.id,
        content: editor.getHTML(),
      });
    }
  };

  // Filter notes
  const filteredNotes = notes
    ?.filter((note) => {
      if (filter === "pinned") return note.pinned;
      if (filter === "recent") {
        const dayAgo = new Date();
        dayAgo.setDate(dayAgo.getDate() - 1);
        return note.updatedAt > dayAgo;
      }
      return true;
    })
    .filter((note) =>
      searchQuery
        ? note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : true
    )
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
        className="w-80 border-r bg-card flex flex-col"
      >
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <StickyNote className="h-5 w-5" />
              Notes
            </h2>
            <Button size="sm" onClick={handleCreateNote}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filter} onValueChange={(value) => setFilter(value as NoteFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Notes</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="pinned">Pinned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 p-4">
          <AnimatePresence>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-24 bg-muted rounded-lg" />
                  </div>
                ))}
              </div>
            ) : filteredNotes && filteredNotes.length > 0 ? (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <motion.div
                    key={note.id}
                    variants={noteVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <Card
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedNote?.id === note.id
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                      style={{ backgroundColor: note.color }}
                      onClick={() => handleSelectNote(note)}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm line-clamp-1">
                            {note.title}
                          </h3>
                          {note.pinned && (
                            <Pin className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p
                          className="text-xs text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{
                            __html: note.content || "Empty note",
                          }}
                        />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(note.updatedAt, "MMM d, h:mm a")}
                          </div>
                          {note.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {note.tags.length}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <StickyNote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No notes found</p>
                <p className="text-sm">Create your first note to get started</p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </motion.aside>

      {/* Editor */}
      <motion.main
        variants={editorVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col"
      >
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <div className="p-4 border-b space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Input
                  value={selectedNote.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="text-2xl font-bold border-none shadow-none focus-visible:ring-0 px-2"
                  placeholder="Note title..."
                />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleTogglePin}
                    title={selectedNote.pinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin
                      className={`h-4 w-4 ${
                        selectedNote.pinned ? "fill-current text-primary" : ""
                      }`}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                    title={isMarkdownPreview ? "Edit mode" : "Preview mode"}
                  >
                    {isMarkdownPreview ? (
                      <Edit className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveManual}
                    title="Save"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteNote}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Color Picker */}
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          selectedColor === color.value
                            ? "border-primary scale-110"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => handleColorChange(color.value)}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Editor Controls */}
                {editor && !isMarkdownPreview && (
                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={editor.isActive("bold") ? "bg-accent" : ""}
                    >
                      B
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={editor.isActive("italic") ? "bg-accent" : ""}
                    >
                      I
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleStrike().run()}
                      className={editor.isActive("strike") ? "bg-accent" : ""}
                    >
                      S
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleHighlight().run()}
                      className={editor.isActive("highlight") ? "bg-accent" : ""}
                    >
                      H
                    </Button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="max-w-xs"
                  />
                  <Button size="sm" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {selectedNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedNote.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag}
                        <span className="ml-1 text-xs">×</span>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Editor Content */}
            <ScrollArea className="flex-1 p-6" style={{ backgroundColor: selectedColor }}>
              {isMarkdownPreview ? (
                <div
                  className="prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedNote.content }}
                />
              ) : (
                <EditorContent editor={editor} />
              )}
            </ScrollArea>

            {/* Status Bar */}
            <div className="p-2 border-t bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Created: {format(selectedNote.createdAt, "MMM d, yyyy")}</span>
                <span>Updated: {format(selectedNote.updatedAt, "MMM d, yyyy h:mm a")}</span>
              </div>
              <span>
                {saveMutation.isPending ? "Saving..." : "Auto-save enabled"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <StickyNote className="h-20 w-20 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Note Selected</h3>
              <p>Select a note from the sidebar or create a new one</p>
              <Button className="mt-4" onClick={handleCreateNote}>
                <Plus className="mr-2 h-4 w-4" />
                Create Note
              </Button>
            </div>
          </div>
        )}
      </motion.main>
    </div>
  );
}
