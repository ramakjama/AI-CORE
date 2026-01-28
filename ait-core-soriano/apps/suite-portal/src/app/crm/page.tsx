"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Building2,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Clock,
  MessageSquare,
  Calendar,
  TrendingUp,
  UserPlus,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { crmApi } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  avatar?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  lastContact?: string;
  value?: number;
  activities: Activity[];
}

interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  description: string;
  date: string;
}

interface CRMStats {
  totalContacts: number;
  newThisMonth: number;
  activeDeals: number;
  totalValue: number;
}

// Mock data
const mockContacts: Contact[] = [
  {
    id: "1",
    name: "María García López",
    email: "maria.garcia@example.com",
    phone: "+34 612 345 678",
    company: "Tech Solutions SL",
    position: "CEO",
    avatar: undefined,
    tags: ["Cliente VIP", "Tecnología"],
    notes: "Cliente importante desde 2020. Interesado en soluciones de IA.",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastContact: new Date(Date.now() - 3600000 * 24).toISOString(),
    value: 50000,
    activities: [
      {
        id: "a1",
        type: "meeting",
        description: "Reunión para discutir nuevos proyectos",
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "a2",
        type: "email",
        description: "Envío de propuesta comercial",
        date: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
    ],
  },
  {
    id: "2",
    name: "Carlos Rodríguez Pérez",
    email: "carlos.rodriguez@example.com",
    phone: "+34 623 456 789",
    company: "Innovate Corp",
    position: "Director de Marketing",
    avatar: undefined,
    tags: ["Prospecto", "Marketing"],
    notes: "Contactado en evento de networking. Interesado en servicios de marketing digital.",
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    lastContact: new Date(Date.now() - 3600000 * 48).toISOString(),
    value: 25000,
    activities: [
      {
        id: "a3",
        type: "call",
        description: "Llamada de seguimiento",
        date: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ],
  },
  {
    id: "3",
    name: "Ana López Martínez",
    email: "ana.lopez@example.com",
    phone: "+34 634 567 890",
    company: "Design Studio",
    position: "Directora Creativa",
    avatar: undefined,
    tags: ["Cliente", "Diseño"],
    notes: "Cliente recurrente. Proyectos de diseño web y branding.",
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    lastContact: new Date(Date.now() - 3600000 * 120).toISOString(),
    value: 35000,
    activities: [
      {
        id: "a4",
        type: "email",
        description: "Envío de facturas del proyecto anterior",
        date: new Date(Date.now() - 3600000 * 120).toISOString(),
      },
      {
        id: "a5",
        type: "meeting",
        description: "Revisión de avances del proyecto",
        date: new Date(Date.now() - 3600000 * 168).toISOString(),
      },
    ],
  },
];

const mockStats: CRMStats = {
  totalContacts: 156,
  newThisMonth: 23,
  activeDeals: 45,
  totalValue: 1250000,
};

// Activity type icons
const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: MessageSquare,
};

// Contact Card Component
interface ContactCardProps {
  contact: Contact;
  isSelected: boolean;
  onClick: () => void;
}

function ContactCard({ contact, isSelected, onClick }: ContactCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
        isSelected && "border-primary bg-accent"
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={contact.avatar} alt={contact.name} />
          <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate">{contact.name}</h3>
            {contact.value && contact.value > 40000 && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          {contact.company && (
            <p className="text-sm text-muted-foreground truncate mb-1">
              {contact.position} • {contact.company}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Mail className="h-3 w-3" />
            <span className="truncate">{contact.email}</span>
          </div>
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {contact.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{contact.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Contact Detail Panel Component
interface ContactDetailProps {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function ContactDetail({ contact, onClose, onEdit, onDelete }: ContactDetailProps) {
  const [newNote, setNewNote] = useState("");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={contact.avatar} alt={contact.name} />
            <AvatarFallback className="text-lg">{getInitials(contact.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-2xl font-bold mb-1">{contact.name}</h2>
            {contact.company && (
              <p className="text-muted-foreground mb-2">
                {contact.position} • {contact.company}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Star className="mr-2 h-4 w-4" />
                Marcar como favorito
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Exportar contacto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar contacto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{contact.email}</p>
                </div>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium">{contact.phone}</p>
                  </div>
                </div>
              )}
              {contact.company && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="text-sm font-medium">{contact.company}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Último contacto</p>
                    <p className="text-sm font-semibold">
                      {contact.lastContact
                        ? format(new Date(contact.lastContact), "d MMM yyyy", { locale: es })
                        : "Nunca"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor</p>
                    <p className="text-sm font-semibold">
                      {contact.value
                        ? new Intl.NumberFormat("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          }).format(contact.value)
                        : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="activities" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="activities" className="flex-1">
                Actividades
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Historial de actividades</CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.activities.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No hay actividades registradas
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {contact.activities.map((activity) => {
                        const Icon = activityIcons[activity.type];
                        return (
                          <div key={activity.id} className="flex gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(activity.date), "d MMM yyyy, HH:mm", {
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  Registrar llamada
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar reunión
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notas</CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.notes ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      No hay notas
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agregar nota</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Escribe una nota sobre este contacto..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <Button className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Guardar nota
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

// Contact Form Dialog Component
interface ContactFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
}

function ContactFormDialog({ open, onOpenChange, contact }: ContactFormDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: contact?.name || "",
    email: contact?.email || "",
    phone: contact?.phone || "",
    company: contact?.company || "",
    position: contact?.position || "",
    tags: contact?.tags.join(", ") || "",
    notes: contact?.notes || "",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => crmApi.post("/contacts", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      onOpenChange(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => crmApi.patch(`/contacts/${contact?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    if (contact) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{contact ? "Editar contacto" : "Nuevo contacto"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez García"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="juan@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+34 612 345 678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Tech Solutions SL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="CEO"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Cliente, VIP, Tecnología (separadas por comas)"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre el contacto..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {contact ? "Guardar cambios" : "Crear contacto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main CRM Page Component
export default function CRMPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ["contacts", searchQuery],
    queryFn: () => crmApi.get("/contacts", { params: { search: searchQuery } }),
    initialData: { data: mockContacts },
  });

  // Fetch CRM stats
  const { data: statsData } = useQuery({
    queryKey: ["crm-stats"],
    queryFn: () => crmApi.get("/stats"),
    initialData: { data: mockStats },
  });

  const contacts: Contact[] = contactsData?.data || [];
  const stats: CRMStats = statsData?.data || mockStats;

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  // Delete contact mutation
  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => crmApi.delete(`/contacts/${contactId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["crm-stats"] });
      setSelectedContact(null);
    },
  });

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingContact(null);
    setIsFormOpen(true);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Nombre", "Email", "Teléfono", "Empresa", "Cargo", "Etiquetas"],
      ...contacts.map((c) => [
        c.name,
        c.email,
        c.phone || "",
        c.company || "",
        c.position || "",
        c.tags.join("; "),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `contactos_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <div className="border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">CRM</h1>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar contactos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={handleCreate}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo contacto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 px-4 pb-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total contactos</p>
                  <p className="text-2xl font-bold">{stats.totalContacts}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nuevos este mes</p>
                  <p className="text-2xl font-bold">{stats.newThisMonth}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Deals activos</p>
                  <p className="text-2xl font-bold">{stats.activeDeals}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor total</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: "EUR",
                      notation: "compact",
                    }).format(stats.totalValue)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <TrendingUp className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Contacts List */}
        <div className="w-96 border-r bg-background overflow-hidden flex flex-col">
          <div className="border-b p-4">
            <h2 className="font-semibold">
              Contactos
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredContacts.length})
              </span>
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {contactsLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  <p className="text-sm text-muted-foreground">Cargando contactos...</p>
                </div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay contactos</p>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                <AnimatePresence>
                  {filteredContacts.map((contact) => (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedContact?.id === contact.id}
                      onClick={() => setSelectedContact(contact)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Contact Detail */}
        <div className="flex-1 bg-background">
          {selectedContact ? (
            <ContactDetail
              contact={selectedContact}
              onClose={() => setSelectedContact(null)}
              onEdit={() => handleEdit(selectedContact)}
              onDelete={() => deleteMutation.mutate(selectedContact.id)}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Selecciona un contacto</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Elige un contacto de la lista para ver sus detalles
                </p>
                <Button onClick={handleCreate}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear nuevo contacto
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Form Dialog */}
      <ContactFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        contact={editingContact}
      />
    </div>
  );
}
