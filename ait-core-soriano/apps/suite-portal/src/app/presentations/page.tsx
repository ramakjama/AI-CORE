"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Copy,
  Trash2,
  Play,
  Share2,
  Download,
  Save,
  Grid3x3,
  Layout,
  Palette,
  Sparkles,
  Image as ImageIcon,
  Square,
  BarChart3,
  Code2,
  Video,
  Type,
  AlignLeft,
  FileText,
  Clock,
  FolderOpen,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  Maximize2,
  Eye,
  StickyNote,
} from 'lucide-react';
import Reveal from 'reveal.js';
import 'reveal.js/dist/reveal.css';
import 'reveal.js/dist/theme/black.css';
import { presentationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Types
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

interface Element {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'code' | 'video';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style?: any;
}

// Themes
const themes = [
  { id: 'black', name: 'Black', color: '#000000' },
  { id: 'white', name: 'White', color: '#FFFFFF' },
  { id: 'league', name: 'League', color: '#2A76DD' },
  { id: 'beige', name: 'Beige', color: '#F0F1EB' },
  { id: 'sky', name: 'Sky', color: '#3B82F6' },
  { id: 'night', name: 'Night', color: '#111111' },
  { id: 'serif', name: 'Serif', color: '#F0F0F0' },
  { id: 'simple', name: 'Simple', color: '#FFFFFF' },
  { id: 'solarized', name: 'Solarized', color: '#FDF6E3' },
  { id: 'moon', name: 'Moon', color: '#002B36' },
];

// Transitions
const transitions = [
  { id: 'none', name: 'None' },
  { id: 'fade', name: 'Fade' },
  { id: 'slide', name: 'Slide' },
  { id: 'convex', name: 'Convex' },
  { id: 'concave', name: 'Concave' },
  { id: 'zoom', name: 'Zoom' },
];

// Layouts
const layouts = [
  { id: 'title', name: 'Title Slide', icon: Type },
  { id: 'content', name: 'Content', icon: AlignLeft },
  { id: 'two-column', name: 'Two Column', icon: Grid3x3 },
  { id: 'image-left', name: 'Image Left', icon: ImageIcon },
  { id: 'image-right', name: 'Image Right', icon: ImageIcon },
  { id: 'blank', name: 'Blank', icon: Square },
];

export default function PresentationsPage() {
  const queryClient = useQueryClient();
  const [selectedPresentation, setSelectedPresentation] = useState<string | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('black');
  const [selectedTransition, setSelectedTransition] = useState('slide');
  const [presentationTitle, setPresentationTitle] = useState('Untitled Presentation');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: '1',
      content: '<h1>Title Slide</h1><p>Click to edit</p>',
      notes: '',
      transition: 'slide',
      layout: 'title',
    },
  ]);
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(slides[0]);
  const [showNotes, setShowNotes] = useState(false);
  const [slideNotes, setSlideNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const revealRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<any>(null);

  // Fetch presentations
  const { data: presentations, isLoading } = useQuery({
    queryKey: ['presentations'],
    queryFn: () => presentationsApi.get('/'),
  });

  // Create presentation mutation
  const createMutation = useMutation({
    mutationFn: (data: Partial<Presentation>) => presentationsApi.post('/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
    },
  });

  // Update presentation mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Presentation> }) =>
      presentationsApi.patch(`/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
    },
  });

  // Delete presentation mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => presentationsApi.delete(`/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presentations'] });
    },
  });

  // Initialize Reveal.js
  useEffect(() => {
    if (revealRef.current && !isPresenting) {
      if (deckRef.current) {
        deckRef.current.destroy();
      }

      const deck = new Reveal(revealRef.current, {
        embedded: true,
        controls: true,
        progress: true,
        center: true,
        hash: false,
        transition: selectedTransition,
        width: 960,
        height: 700,
        margin: 0.1,
      });

      deck.initialize().then(() => {
        deck.slide(currentSlideIndex);
      });

      deckRef.current = deck;

      return () => {
        if (deckRef.current) {
          deckRef.current.destroy();
          deckRef.current = null;
        }
      };
    }
  }, [slides, selectedTheme, selectedTransition, isPresenting]);

  // Handle slide selection
  const handleSlideSelect = (slide: Slide, index: number) => {
    setSelectedSlide(slide);
    setCurrentSlideIndex(index);
    setSlideNotes(slide.notes || '');
    if (deckRef.current) {
      deckRef.current.slide(index);
    }
  };

  // Add new slide
  const handleAddSlide = (layout: string = 'content') => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      content: getLayoutTemplate(layout),
      notes: '',
      transition: selectedTransition,
      layout,
    };
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setSelectedSlide(newSlide);
    setCurrentSlideIndex(newSlides.length - 1);
  };

  // Duplicate slide
  const handleDuplicateSlide = () => {
    if (selectedSlide) {
      const newSlide: Slide = {
        ...selectedSlide,
        id: Date.now().toString(),
      };
      const newSlides = [...slides];
      newSlides.splice(currentSlideIndex + 1, 0, newSlide);
      setSlides(newSlides);
      setSelectedSlide(newSlide);
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  // Delete slide
  const handleDeleteSlide = () => {
    if (slides.length > 1 && selectedSlide) {
      const newSlides = slides.filter((s) => s.id !== selectedSlide.id);
      setSlides(newSlides);
      const newIndex = Math.max(0, currentSlideIndex - 1);
      setSelectedSlide(newSlides[newIndex]);
      setCurrentSlideIndex(newIndex);
    }
  };

  // Update slide content
  const handleSlideContentChange = (content: string) => {
    if (selectedSlide) {
      const updatedSlides = slides.map((s) =>
        s.id === selectedSlide.id ? { ...s, content } : s
      );
      setSlides(updatedSlides);
      setSelectedSlide({ ...selectedSlide, content });
    }
  };

  // Update slide notes
  const handleNotesChange = (notes: string) => {
    setSlideNotes(notes);
    if (selectedSlide) {
      const updatedSlides = slides.map((s) =>
        s.id === selectedSlide.id ? { ...s, notes } : s
      );
      setSlides(updatedSlides);
      setSelectedSlide({ ...selectedSlide, notes });
    }
  };

  // Get layout template
  const getLayoutTemplate = (layout: string): string => {
    const templates: Record<string, string> = {
      title: '<h1>Title Slide</h1><p>Subtitle</p>',
      content: '<h2>Content Slide</h2><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul>',
      'two-column': '<div style="display:flex;gap:2rem"><div style="flex:1"><h3>Left Column</h3><p>Content</p></div><div style="flex:1"><h3>Right Column</h3><p>Content</p></div></div>',
      'image-left': '<div style="display:flex;gap:2rem;align-items:center"><div style="flex:1"><img src="https://via.placeholder.com/400x300" alt="placeholder"/></div><div style="flex:1"><h3>Title</h3><p>Content</p></div></div>',
      'image-right': '<div style="display:flex;gap:2rem;align-items:center"><div style="flex:1"><h3>Title</h3><p>Content</p></div><div style="flex:1"><img src="https://via.placeholder.com/400x300" alt="placeholder"/></div></div>',
      blank: '<div style="min-height:500px"></div>',
    };
    return templates[layout] || templates.content;
  };

  // Start presentation
  const handlePresent = () => {
    setIsPresenting(true);
    const presentWindow = window.open('', '_blank', 'fullscreen=yes');
    if (presentWindow) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${presentationTitle}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/${selectedTheme}.css">
            <style>
              body { margin: 0; overflow: hidden; }
              .reveal { width: 100vw; height: 100vh; }
            </style>
          </head>
          <body>
            <div class="reveal">
              <div class="slides">
                ${slides.map((slide) => `<section data-transition="${slide.transition || selectedTransition}">${slide.content}</section>`).join('')}
              </div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
            <script>
              Reveal.initialize({
                controls: true,
                progress: true,
                center: true,
                hash: true,
                transition: '${selectedTransition}',
              });
            </script>
          </body>
        </html>
      `;
      presentWindow.document.write(html);
      presentWindow.document.close();
    }
    setTimeout(() => setIsPresenting(false), 1000);
  };

  // Export presentation
  const handleExport = async (format: 'pdf' | 'pptx') => {
    if (selectedPresentation) {
      try {
        await presentationsApi.get(`/${selectedPresentation}/export?format=${format}`);
        alert(`Exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error('Export error:', error);
        alert('Export failed');
      }
    }
  };

  // Save presentation
  const handleSave = async () => {
    const presentationData = {
      title: presentationTitle,
      slides,
      theme: selectedTheme,
    };

    if (selectedPresentation) {
      await updateMutation.mutateAsync({
        id: selectedPresentation,
        data: presentationData,
      });
    } else {
      const result = await createMutation.mutateAsync(presentationData);
      setSelectedPresentation(result.id);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className="w-80 border-r border-border bg-card flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">Presentations</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search presentations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border">
              <button
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  !showTemplates
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setShowTemplates(false)}
              >
                <Grid3x3 className="h-4 w-4 inline mr-2" />
                Slides
              </button>
              <button
                className={cn(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  showTemplates
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setShowTemplates(true)}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Templates
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {!showTemplates ? (
                // Slide Thumbnails
                <div className="space-y-2">
                  {slides.map((slide, index) => (
                    <motion.div
                      key={slide.id}
                      layout
                      onClick={() => handleSlideSelect(slide, index)}
                      className={cn(
                        'relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all',
                        selectedSlide?.id === slide.id
                          ? 'border-primary shadow-lg'
                          : 'border-border hover:border-muted-foreground'
                      )}
                    >
                      <div className="aspect-video bg-background p-4 text-xs">
                        <div
                          dangerouslySetInnerHTML={{ __html: slide.content }}
                          className="pointer-events-none"
                        />
                      </div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                      {slide.notes && (
                        <div className="absolute top-2 right-2">
                          <StickyNote className="h-4 w-4 text-yellow-400" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Templates Gallery
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Layout Templates
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {layouts.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => handleAddSlide(layout.id)}
                        className="aspect-video border-2 border-border rounded-lg hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 bg-background"
                      >
                        <layout.icon className="h-8 w-8 text-muted-foreground" />
                        <span className="text-xs font-medium">{layout.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent Files */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Recent</h3>
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {presentations?.slice(0, 5).map((pres: any) => (
                  <button
                    key={pres.id}
                    onClick={() => setSelectedPresentation(pres.id)}
                    className="w-full text-left px-2 py-1 text-sm rounded hover:bg-accent transition-colors truncate"
                  >
                    {pres.title}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {!showSidebar && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSidebar(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {isEditingTitle ? (
              <Input
                type="text"
                value={presentationTitle}
                onChange={(e) => setPresentationTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingTitle(false);
                }}
                className="max-w-xs"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-semibold cursor-pointer hover:text-primary"
                onClick={() => setIsEditingTitle(true)}
              >
                {presentationTitle}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-t-lg"
                >
                  Export PDF
                </button>
                <button
                  onClick={() => handleExport('pptx')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-b-lg"
                >
                  Export PPTX
                </button>
              </div>
            </div>
            <Button onClick={handlePresent}>
              <Play className="h-4 w-4 mr-2" />
              Present
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="border-b border-border bg-card px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAddSlide()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
            <Button variant="outline" size="sm" onClick={handleDuplicateSlide}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSlide}
              disabled={slides.length <= 1}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <div className="w-px h-6 bg-border mx-2" />

            {/* Theme Selector */}
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Palette className="h-4 w-4 mr-2" />
                Theme
              </Button>
              <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 max-h-64 overflow-y-auto">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2',
                      selectedTheme === theme.id && 'bg-accent'
                    )}
                  >
                    <div
                      className="w-4 h-4 rounded border border-border"
                      style={{ backgroundColor: theme.color }}
                    />
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Transition Selector */}
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Transition
              </Button>
              <div className="absolute left-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                {transitions.map((transition) => (
                  <button
                    key={transition.id}
                    onClick={() => setSelectedTransition(transition.id)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-accent',
                      selectedTransition === transition.id && 'bg-accent'
                    )}
                  >
                    {transition.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-px h-6 bg-border mx-2" />

            {/* Insert Elements */}
            <Button variant="outline" size="sm">
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Chart
            </Button>
            <Button variant="outline" size="sm">
              <Code2 className="h-4 w-4 mr-2" />
              Code
            </Button>
            <Button variant="outline" size="sm">
              <Video className="h-4 w-4 mr-2" />
              Media
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showNotes ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowNotes(!showNotes)}
            >
              <StickyNote className="h-4 w-4 mr-2" />
              Notes
            </Button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-muted/20">
            <motion.div
              layout
              className="bg-card shadow-2xl rounded-lg overflow-hidden"
              style={{
                width: '960px',
                height: '700px',
              }}
            >
              <div ref={revealRef} className="reveal h-full">
                <div className="slides">
                  {slides.map((slide, index) => (
                    <section
                      key={slide.id}
                      data-transition={slide.transition || selectedTransition}
                      dangerouslySetInnerHTML={{ __html: slide.content }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Presenter Notes */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 200 }}
                exit={{ height: 0 }}
                className="border-t border-border bg-card overflow-hidden"
              >
                <div className="p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Presenter Notes</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotes(false)}
                    >
                      <ChevronRight className="h-4 w-4 rotate-90" />
                    </Button>
                  </div>
                  <textarea
                    value={slideNotes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="Add notes for this slide..."
                    className="flex-1 w-full p-3 border border-border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Status Bar */}
        <div className="h-10 border-t border-border bg-card px-4 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            <span className="w-px h-4 bg-border" />
            <span>Theme: {themes.find((t) => t.id === selectedTheme)?.name}</span>
            <span className="w-px h-4 bg-border" />
            <span>Transition: {transitions.find((t) => t.id === selectedTransition)?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Last saved: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
