"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  Share2,
  MoreVertical,
  Grid3x3,
  List,
  Search,
  Plus,
  FolderPlus,
  Home,
  ChevronRight,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Archive,
  Code,
  Eye,
  Edit,
  Copy,
  Star,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { storageApi } from "@/lib/api";
import { cn, formatBytes, getFileExtension } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Types
interface StorageItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  modifiedAt: string;
  createdAt: string;
  parentId?: string;
  isStarred?: boolean;
  owner?: {
    name: string;
    email: string;
  };
}

interface StorageStats {
  used: number;
  total: number;
  byType: {
    images: number;
    documents: number;
    videos: number;
    audio: number;
    other: number;
  };
}

type ViewMode = "grid" | "list";

// File type icons
const getFileIcon = (mimeType?: string, extension?: string) => {
  if (!mimeType && !extension) return File;

  const type = mimeType?.split("/")[0];
  const ext = extension?.toLowerCase();

  if (type === "image" || ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext || ""))
    return ImageIcon;
  if (type === "video" || ["mp4", "avi", "mov", "webm"].includes(ext || "")) return Film;
  if (type === "audio" || ["mp3", "wav", "ogg", "m4a"].includes(ext || "")) return Music;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) return Archive;
  if (
    ["js", "ts", "tsx", "jsx", "html", "css", "py", "java", "cpp"].includes(ext || "")
  )
    return Code;
  if (["pdf", "doc", "docx", "txt"].includes(ext || "")) return FileText;

  return File;
};

// Mock data
const mockItems: StorageItem[] = [
  {
    id: "1",
    name: "Documentos",
    type: "folder",
    modifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isStarred: true,
  },
  {
    id: "2",
    name: "Imágenes",
    type: "folder",
    modifiedAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    name: "Proyecto_2024.pdf",
    type: "file",
    size: 2456789,
    mimeType: "application/pdf",
    modifiedAt: new Date(Date.now() - 7200000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    isStarred: true,
  },
  {
    id: "4",
    name: "Presentación.pptx",
    type: "file",
    size: 5234567,
    mimeType: "application/vnd.ms-powerpoint",
    modifiedAt: new Date(Date.now() - 10800000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: "5",
    name: "logo.png",
    type: "file",
    size: 234567,
    mimeType: "image/png",
    modifiedAt: new Date(Date.now() - 14400000).toISOString(),
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
];

const mockStats: StorageStats = {
  used: 45.8 * 1024 * 1024 * 1024,
  total: 100 * 1024 * 1024 * 1024,
  byType: {
    images: 12.5 * 1024 * 1024 * 1024,
    documents: 15.2 * 1024 * 1024 * 1024,
    videos: 10.1 * 1024 * 1024 * 1024,
    audio: 3.5 * 1024 * 1024 * 1024,
    other: 4.5 * 1024 * 1024 * 1024,
  },
};

// Breadcrumb Component
interface BreadcrumbProps {
  path: Array<{ id: string; name: string }>;
  onNavigate: (id: string) => void;
}

function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate("root")}
        className="h-8 px-2"
      >
        <Home className="h-4 w-4" />
      </Button>
      {path.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className={cn(
              "h-8 px-2",
              index === path.length - 1 && "font-semibold"
            )}
          >
            {item.name}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
}

// File/Folder Card Component (Grid View)
interface ItemCardProps {
  item: StorageItem;
  onClick: () => void;
  onStar: (e: React.MouseEvent) => void;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
}

function ItemCard({ item, onClick, onStar, onDownload, onShare, onDelete }: ItemCardProps) {
  const Icon = item.type === "folder" ? Folder : getFileIcon(item.mimeType, getFileExtension(item.name));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className="group relative"
    >
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div
              className={cn(
                "rounded-lg p-3",
                item.type === "folder"
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-gray-100 dark:bg-gray-800"
              )}
            >
              <Icon
                className={cn(
                  "h-8 w-8",
                  item.type === "folder"
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                )}
              />
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onStar}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    item.isStarred && "fill-yellow-400 text-yellow-400"
                  )}
                />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Renombrar
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="mr-2 h-4 w-4" />
                    Hacer copia
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div>
            <p className="mb-1 truncate font-medium text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.type === "folder"
                ? "Carpeta"
                : item.size
                ? formatBytes(item.size)
                : "0 B"}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// File/Folder List Item Component (List View)
interface ItemListRowProps {
  item: StorageItem;
  onClick: () => void;
  onStar: (e: React.MouseEvent) => void;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
}

function ItemListRow({ item, onClick, onStar, onDownload, onShare, onDelete }: ItemListRowProps) {
  const Icon = item.type === "folder" ? Folder : getFileIcon(item.mimeType, getFileExtension(item.name));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group flex items-center gap-4 border-b p-3 hover:bg-accent cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div
        className={cn(
          "rounded p-2",
          item.type === "folder"
            ? "bg-blue-100 dark:bg-blue-900"
            : "bg-gray-100 dark:bg-gray-800"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            item.type === "folder"
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-600 dark:text-gray-400"
          )}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-sm">{item.name}</p>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="w-24 text-right">
          {item.type === "folder" ? "-" : item.size ? formatBytes(item.size) : "0 B"}
        </span>
        <span className="w-32">
          {format(new Date(item.modifiedAt), "d MMM yyyy", { locale: es })}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onStar}
          >
            <Star
              className={cn(
                "h-4 w-4",
                item.isStarred && "fill-yellow-400 text-yellow-400"
              )}
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Hacer copia
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}

// Upload Zone Component
interface UploadZoneProps {
  onUpload: (files: File[]) => void;
}

function UploadZone({ onUpload }: UploadZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onUpload,
    noClick: true,
  });

  if (!isDragActive) return null;

  return (
    <div
      {...getRootProps()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <input {...getInputProps()} />
      <Card className="border-2 border-dashed border-primary p-12 text-center">
        <Upload className="mx-auto mb-4 h-16 w-16 text-primary" />
        <h3 className="mb-2 text-xl font-semibold">Suelta los archivos aquí</h3>
        <p className="text-muted-foreground">
          Los archivos se cargarán en la carpeta actual
        </p>
      </Card>
    </div>
  );
}

// Create Folder Dialog
interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string;
}

function CreateFolderDialog({ open, onOpenChange, parentId }: CreateFolderDialogProps) {
  const queryClient = useQueryClient();
  const [folderName, setFolderName] = useState("");

  const createMutation = useMutation({
    mutationFn: (name: string) =>
      storageApi.post("/folders", { name, parent_id: parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      onOpenChange(false);
      setFolderName("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(folderName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva carpeta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folderName">Nombre de la carpeta</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Mi carpeta"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              Crear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Storage Page Component
export default function StoragePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState<string>("root");
  const [breadcrumbPath, setBreadcrumbPath] = useState<Array<{ id: string; name: string }>>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const queryClient = useQueryClient();

  // Fetch storage items
  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["storage", currentFolder],
    queryFn: () =>
      storageApi.get("/files", {
        params: { folder_id: currentFolder !== "root" ? currentFolder : undefined },
      }),
    initialData: { data: mockItems },
  });

  // Fetch storage stats
  const { data: statsData } = useQuery({
    queryKey: ["storage-stats"],
    queryFn: () => storageApi.get("/stats"),
    initialData: { data: mockStats },
  });

  const items: StorageItem[] = itemsData?.data || [];
  const stats: StorageStats = statsData?.data || mockStats;

  // Filter items by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, searchQuery]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      storageApi.upload(
        `/upload${currentFolder !== "root" ? `?folder_id=${currentFolder}` : ""}`,
        file,
        setUploadProgress
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      queryClient.invalidateQueries({ queryKey: ["storage-stats"] });
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => storageApi.delete(`/files/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
      queryClient.invalidateQueries({ queryKey: ["storage-stats"] });
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: ({ itemId, isStarred }: { itemId: string; isStarred: boolean }) =>
      storageApi.patch(`/files/${itemId}`, { is_starred: !isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storage"] });
    },
  });

  const handleItemClick = (item: StorageItem) => {
    if (item.type === "folder") {
      setCurrentFolder(item.id);
      setBreadcrumbPath([...breadcrumbPath, { id: item.id, name: item.name }]);
    }
  };

  const handleNavigate = (folderId: string) => {
    if (folderId === "root") {
      setCurrentFolder("root");
      setBreadcrumbPath([]);
    } else {
      const index = breadcrumbPath.findIndex((item) => item.id === folderId);
      if (index !== -1) {
        setCurrentFolder(folderId);
        setBreadcrumbPath(breadcrumbPath.slice(0, index + 1));
      }
    }
  };

  const handleUpload = useCallback(
    (files: File[]) => {
      files.forEach((file) => uploadMutation.mutate(file));
    },
    [uploadMutation]
  );

  const handleDownload = (item: StorageItem) => {
    if (item.type === "file") {
      storageApi.download(`/files/${item.id}/download`, item.name);
    }
  };

  const usagePercentage = (stats.used / stats.total) * 100;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Almacenamiento</h1>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center rounded-lg border p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => setIsCreateFolderOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Nueva carpeta
            </Button>
            <label>
              <Button asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir archivo
                </span>
              </Button>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleUpload(files);
                }}
              />
            </label>
          </div>
        </div>
        <div className="px-4 pb-4">
          <Breadcrumb path={breadcrumbPath} onNavigate={handleNavigate} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r bg-muted/30 dark:bg-slate-900/50 p-4 space-y-6">
          {/* Storage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Almacenamiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatBytes(stats.used)} de {formatBytes(stats.total)}
                  </span>
                  <span className="font-medium">{usagePercentage.toFixed(1)}%</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    Documentos
                  </span>
                  <span className="font-medium">{formatBytes(stats.byType.documents)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    Imágenes
                  </span>
                  <span className="font-medium">{formatBytes(stats.byType.images)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500" />
                    Videos
                  </span>
                  <span className="font-medium">{formatBytes(stats.byType.videos)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    Audio
                  </span>
                  <span className="font-medium">{formatBytes(stats.byType.audio)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-500" />
                    Otros
                  </span>
                  <span className="font-medium">{formatBytes(stats.byType.other)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Access */}
          <div>
            <h3 className="mb-3 font-semibold text-sm">Acceso rápido</h3>
            <nav className="space-y-1">
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Clock className="mr-2 h-4 w-4" />
                Recientes
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Star className="mr-2 h-4 w-4" />
                Destacados
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Compartidos
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Papelera
              </Button>
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6">
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Cargando archivos...</p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Folder className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No hay archivos</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Comienza subiendo algunos archivos o creando carpetas
                    </p>
                    <Button onClick={() => setIsCreateFolderOpen(true)}>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Crear carpeta
                    </Button>
                  </div>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  <AnimatePresence>
                    {filteredItems.map((item) => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onClick={() => handleItemClick(item)}
                        onStar={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate({
                            itemId: item.id,
                            isStarred: item.isStarred || false,
                          });
                        }}
                        onDownload={() => handleDownload(item)}
                        onShare={() => console.log("Share", item.id)}
                        onDelete={() => deleteMutation.mutate(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <div className="flex items-center gap-4 border-b bg-muted/50 p-3 text-sm font-medium text-muted-foreground">
                    <div className="flex-1">Nombre</div>
                    <div className="w-24 text-right">Tamaño</div>
                    <div className="w-32">Modificado</div>
                    <div className="w-20"></div>
                  </div>
                  <AnimatePresence>
                    {filteredItems.map((item) => (
                      <ItemListRow
                        key={item.id}
                        item={item}
                        onClick={() => handleItemClick(item)}
                        onStar={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate({
                            itemId: item.id,
                            isStarred: item.isStarred || false,
                          });
                        }}
                        onDownload={() => handleDownload(item)}
                        onShare={() => console.log("Share", item.id)}
                        onDelete={() => deleteMutation.mutate(item.id)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Upload Zone */}
      <UploadZone onUpload={handleUpload} />

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="fixed bottom-4 right-4 w-80">
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Subiendo archivo...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        parentId={currentFolder !== "root" ? currentFolder : undefined}
      />
    </div>
  );
}
