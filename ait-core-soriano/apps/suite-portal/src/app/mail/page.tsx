"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Mail,
  Send,
  Inbox,
  FileText,
  Trash2,
  Star,
  Search,
  RefreshCw,
  MoreVertical,
  Reply,
  Forward,
  Archive,
  Paperclip,
  X,
  ChevronLeft,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { mailApi } from "@/lib/api";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Types
interface Email {
  id: string;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  to: string[];
  subject: string;
  body: string;
  snippet: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  folder: string;
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
}

type Folder = "inbox" | "sent" | "drafts" | "trash" | "starred";

// Folder configuration
const folderConfig: Record<Folder, { label: string; icon: any; color: string }> = {
  inbox: { label: "Bandeja de Entrada", icon: Inbox, color: "text-blue-500" },
  sent: { label: "Enviados", icon: Send, color: "text-green-500" },
  drafts: { label: "Borradores", icon: FileText, color: "text-yellow-500" },
  trash: { label: "Papelera", icon: Trash2, color: "text-red-500" },
  starred: { label: "Destacados", icon: Star, color: "text-orange-500" },
};

// Mock data
const mockEmails: Email[] = [
  {
    id: "1",
    from: {
      name: "María García",
      email: "maria.garcia@example.com",
      avatar: undefined,
    },
    to: ["you@example.com"],
    subject: "Reunión de equipo - Actualización del proyecto",
    body: "<p>Hola,</p><p>Me gustaría programar una reunión para discutir el progreso del proyecto. ¿Estarías disponible el próximo martes a las 10:00 AM?</p><p>Saludos,<br/>María</p>",
    snippet: "Me gustaría programar una reunión para discutir el progreso del proyecto...",
    date: new Date().toISOString(),
    isRead: false,
    isStarred: true,
    folder: "inbox",
    attachments: [
      {
        id: "att1",
        name: "proyecto_agenda.pdf",
        size: 245678,
        type: "application/pdf",
      },
    ],
  },
  {
    id: "2",
    from: {
      name: "Carlos Rodríguez",
      email: "carlos.rodriguez@example.com",
      avatar: undefined,
    },
    to: ["you@example.com"],
    subject: "Propuesta de colaboración",
    body: "<p>Estimado/a,</p><p>Estoy interesado en discutir una posible colaboración en el nuevo proyecto de IA. Adjunto un documento con más detalles.</p><p>Un cordial saludo,<br/>Carlos</p>",
    snippet: "Estoy interesado en discutir una posible colaboración en el nuevo proyecto...",
    date: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
    isStarred: false,
    folder: "inbox",
  },
  {
    id: "3",
    from: {
      name: "Ana López",
      email: "ana.lopez@example.com",
      avatar: undefined,
    },
    to: ["you@example.com"],
    subject: "Re: Informe mensual",
    body: "<p>Hola,</p><p>Gracias por el informe. Todo se ve excelente. Tengo algunas preguntas sobre los números del Q4.</p><p>Saludos,<br/>Ana</p>",
    snippet: "Gracias por el informe. Todo se ve excelente. Tengo algunas preguntas...",
    date: new Date(Date.now() - 7200000).toISOString(),
    isRead: true,
    isStarred: false,
    folder: "inbox",
  },
];

// Email List Item Component
interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
  onStar: (e: React.MouseEvent) => void;
}

function EmailListItem({ email, isSelected, onClick, onStar }: EmailListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer border-b p-4 transition-colors hover:bg-accent",
        isSelected && "bg-accent",
        !email.isRead && "bg-muted/30"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={email.from.avatar} alt={email.from.name} />
          <AvatarFallback>{getInitials(email.from.name)}</AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className={cn("truncate text-sm", !email.isRead && "font-semibold")}>
              {email.from.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {format(new Date(email.date), "HH:mm", { locale: es })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity",
                  email.isStarred && "opacity-100"
                )}
                onClick={onStar}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    email.isStarred && "fill-yellow-400 text-yellow-400"
                  )}
                />
              </Button>
            </div>
          </div>
          <p className={cn("mb-1 truncate text-sm", !email.isRead && "font-semibold")}>
            {email.subject}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email.snippet}</p>
          {email.attachments && email.attachments.length > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span>{email.attachments.length} archivo(s)</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Email Detail View Component
interface EmailDetailProps {
  email: Email;
  onClose: () => void;
  onReply: () => void;
  onForward: () => void;
  onDelete: () => void;
}

function EmailDetail({ email, onClose, onReply, onForward, onDelete }: EmailDetailProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onReply}>
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onForward}>
            <Forward className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Archive className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Marcar como no leído</DropdownMenuItem>
              <DropdownMenuItem>Mover a carpeta</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Email Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Subject */}
          <h1 className="mb-6 text-2xl font-bold">{email.subject}</h1>

          {/* Sender Info */}
          <div className="mb-6 flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={email.from.avatar} alt={email.from.name} />
              <AvatarFallback>{getInitials(email.from.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{email.from.name}</p>
                  <p className="text-sm text-muted-foreground">{email.from.email}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(email.date), "d 'de' MMMM 'de' yyyy, HH:mm", {
                    locale: es,
                  })}
                </p>
              </div>
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  Para: <span className="text-foreground">{email.to.join(", ")}</span>
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Email Body */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body }}
          />

          {/* Attachments */}
          {email.attachments && email.attachments.length > 0 && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Archivos adjuntos</h3>
                <div className="space-y-2">
                  {email.attachments.map((attachment) => (
                    <Card key={attachment.id}>
                      <CardContent className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded bg-blue-100 dark:bg-blue-900 p-2">
                            <Paperclip className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Descargar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Compose Email Dialog Component
interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: Email;
}

function ComposeDialog({ open, onOpenChange, replyTo }: ComposeDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    to: replyTo?.from.email || "",
    subject: replyTo ? `Re: ${replyTo.subject}` : "",
    body: "",
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => mailApi.post("/emails/send", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      onOpenChange(false);
      setFormData({ to: "", subject: "", body: "" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate({
      to: [formData.to],
      subject: formData.subject,
      body: formData.body,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {replyTo ? "Responder correo" : "Nuevo mensaje"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="to">Para</Label>
            <Input
              id="to"
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="destinatario@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Asunto</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Asunto del correo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Mensaje</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Escribe tu mensaje aquí..."
              rows={12}
              className="resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline">
              <Paperclip className="mr-2 h-4 w-4" />
              Adjuntar archivo
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={sendMutation.isPending}>
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Mail Page Component
export default function MailPage() {
  const [selectedFolder, setSelectedFolder] = useState<Folder>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyToEmail, setReplyToEmail] = useState<Email | undefined>(undefined);

  const queryClient = useQueryClient();

  // Fetch emails
  const { data: emailsData, isLoading } = useQuery({
    queryKey: ["emails", selectedFolder],
    queryFn: () => mailApi.get("/emails", { params: { folder: selectedFolder } }),
    initialData: { data: mockEmails.filter((e) => e.folder === selectedFolder) },
  });

  const emails: Email[] = emailsData?.data || [];

  // Filter emails by search query
  const filteredEmails = useMemo(() => {
    if (!searchQuery) return emails;
    const query = searchQuery.toLowerCase();
    return emails.filter(
      (email) =>
        email.from.name.toLowerCase().includes(query) ||
        email.subject.toLowerCase().includes(query) ||
        email.snippet.toLowerCase().includes(query)
    );
  }, [emails, searchQuery]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (emailId: string) => mailApi.patch(`/emails/${emailId}`, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  // Toggle star mutation
  const toggleStarMutation = useMutation({
    mutationFn: ({ emailId, isStarred }: { emailId: string; isStarred: boolean }) =>
      mailApi.patch(`/emails/${emailId}`, { is_starred: !isStarred }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: (emailId: string) => mailApi.delete(`/emails/${emailId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      setSelectedEmail(null);
    },
  });

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsReadMutation.mutate(email.id);
    }
  };

  const handleStarClick = (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    toggleStarMutation.mutate({ emailId: email.id, isStarred: email.isStarred });
  };

  const handleReply = () => {
    setReplyToEmail(selectedEmail || undefined);
    setIsComposeOpen(true);
  };

  const handleCompose = () => {
    setReplyToEmail(undefined);
    setIsComposeOpen(true);
  };

  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b p-4">
        <h1 className="text-2xl font-bold">Correo</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar correos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={handleCompose}>
            <Edit className="mr-2 h-4 w-4" />
            Redactar
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/30 dark:bg-slate-900/50 p-4">
          <nav className="space-y-2">
            {(Object.entries(folderConfig) as [Folder, typeof folderConfig[Folder]][]).map(
              ([folder, config]) => {
                const Icon = config.icon;
                const count =
                  folder === "inbox"
                    ? unreadCount
                    : folder === "starred"
                    ? emails.filter((e) => e.isStarred).length
                    : emails.filter((e) => e.folder === folder).length;

                return (
                  <Button
                    key={folder}
                    variant={selectedFolder === folder ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedFolder(folder);
                      setSelectedEmail(null);
                    }}
                  >
                    <Icon className={cn("mr-2 h-4 w-4", config.color)} />
                    <span className="flex-1 text-left">{config.label}</span>
                    {count > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {count}
                      </Badge>
                    )}
                  </Button>
                );
              }
            )}
          </nav>
        </div>

        {/* Email List */}
        <div className="w-96 border-r bg-background overflow-hidden flex flex-col">
          <div className="border-b p-4">
            <h2 className="font-semibold">
              {folderConfig[selectedFolder].label}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredEmails.length})
              </span>
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Cargando correos...</p>
                </div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay correos</p>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {filteredEmails.map((email) => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    isSelected={selectedEmail?.id === email.id}
                    onClick={() => handleEmailClick(email)}
                    onStar={(e) => handleStarClick(e, email)}
                  />
                ))}
              </AnimatePresence>
            )}
          </ScrollArea>
        </div>

        {/* Email Detail */}
        <div className="flex-1 bg-background">
          {selectedEmail ? (
            <EmailDetail
              email={selectedEmail}
              onClose={() => setSelectedEmail(null)}
              onReply={handleReply}
              onForward={() => console.log("Forward")}
              onDelete={() => deleteEmailMutation.mutate(selectedEmail.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Mail className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Selecciona un correo</h3>
                <p className="text-sm text-muted-foreground">
                  Elige un correo de la lista para ver su contenido
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Dialog */}
      <ComposeDialog
        open={isComposeOpen}
        onOpenChange={setIsComposeOpen}
        replyTo={replyToEmail}
      />
    </div>
  );
}
