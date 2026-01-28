'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Mail,
  Phone,
  RefreshCw,
  ArrowUpDown,
  FileText,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDataFetcher, useDataMutation } from '@/hooks/use-data-fetcher';
import { Client, ClientStatus, ClientType } from '@/types';
import { formatCurrency, formatPhoneNumber, formatDate, formatInitials } from '@/lib/format';
import toast from 'react-hot-toast';

export default function ClientesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ClientType | 'all'>('all');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch clients
  const { data: clients, isLoading, refetch } = useDataFetcher<Client[]>(
    '/api/clientes',
    {
      enabled: true,
      refetchInterval: 30000,
    }
  );

  // Delete mutation
  const { mutate: deleteClient, isLoading: isDeleting } = useDataMutation();

  // Mock data for demonstration
  const mockClients: Client[] = useMemo(
    () =>
      clients ||
      Array.from({ length: 50 }, (_, i) => ({
        id: `client-${i + 1}`,
        type: i % 5 === 0 ? 'business' : 'individual',
        status: ['active', 'inactive', 'lead', 'prospect'][i % 4] as ClientStatus,
        firstName: `Cliente`,
        lastName: `Apellido ${i + 1}`,
        companyName: i % 5 === 0 ? `Empresa ${i + 1}` : undefined,
        email: `cliente${i + 1}@ejemplo.com`,
        phone: `+34 6${String(i).padStart(8, '0')}`,
        alternatePhone: i % 3 === 0 ? `+34 9${String(i).padStart(8, '0')}` : undefined,
        address: {
          street: `Calle Principal ${i + 1}`,
          city: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao'][i % 5],
          state: ['Madrid', 'Cataluña', 'Valencia', 'Andalucía', 'País Vasco'][i % 5],
          zipCode: `${28000 + i}`,
          country: 'España',
        },
        dateOfBirth: i % 5 === 0 ? undefined : new Date(1980 + (i % 30), (i % 12), (i % 28) + 1),
        taxId: `${String(i).padStart(8, '0')}-A`,
        occupation: i % 5 === 0 ? undefined : ['Ingeniero', 'Médico', 'Abogado', 'Comerciante', 'Profesor'][i % 5],
        policies: [],
        claims: [],
        documents: [],
        notes: i % 3 === 0 ? `Notas importantes del cliente ${i + 1}` : undefined,
        tags: i % 4 === 0 ? ['VIP', 'Fidelizado'] : i % 4 === 1 ? ['Nuevo'] : undefined,
        assignedAgentId: `agent-${(i % 5) + 1}`,
        totalPremium: 500 + i * 100,
        totalClaims: i % 7,
        createdAt: new Date(2024, 0, i + 1),
        updatedAt: new Date(2024, 0, i + 1),
        lastContactDate: i % 3 === 0 ? new Date(2024, 5, i + 1) : undefined,
      })),
    [clients]
  );

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = [...mockClients];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (client) =>
          client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone.includes(searchQuery) ||
          (client.companyName && client.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (client.taxId && client.taxId.includes(searchQuery))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((client) => client.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((client) => client.type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof Client];
      let bValue: any = b[sortField as keyof Client];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [mockClients, searchQuery, statusFilter, typeFilter, sortField, sortOrder]);

  // Statistics
  const statistics = useMemo(() => {
    return {
      total: mockClients.length,
      active: mockClients.filter((c) => c.status === 'active').length,
      leads: mockClients.filter((c) => c.status === 'lead').length,
      prospects: mockClients.filter((c) => c.status === 'prospect').length,
      totalPremium: mockClients.reduce((sum, c) => sum + c.totalPremium, 0),
      avgPremium: mockClients.reduce((sum, c) => sum + c.totalPremium, 0) / mockClients.length,
    };
  }, [mockClients]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;

    try {
      await deleteClient('delete', `/api/clientes/${selectedClient.id}`);
      toast.success('Cliente eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedClient(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el cliente');
    }
  };

  const handleExport = () => {
    toast.success('Exportando clientes...');
    // Implement export functionality
  };

  const handleSendEmail = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${client.email}`;
  };

  const handleCall = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${client.phone}`;
  };

  const getStatusBadge = (status: ClientStatus) => {
    const variants: Record<ClientStatus, any> = {
      active: 'default',
      inactive: 'secondary',
      lead: 'outline',
      prospect: 'outline',
    };

    const labels: Record<ClientStatus, string> = {
      active: 'Activo',
      inactive: 'Inactivo',
      lead: 'Lead',
      prospect: 'Prospecto',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: ClientType) => {
    const labels: Record<ClientType, string> = {
      individual: 'Individual',
      business: 'Empresa',
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => router.push('/clientes/nuevo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.active} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.leads}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.prospects} prospectos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primas Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalPremium)}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(statistics.avgPremium)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground">
              +12% este mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email, teléfono o NIF..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ClientStatus | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="prospect">Prospecto</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as ClientType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="business">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredClients.length} de {mockClients.length} clientes
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]"></TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('firstName')}
                      className="h-8 px-2"
                    >
                      Cliente
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('status')}
                      className="h-8 px-2"
                    >
                      Estado
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('totalPremium')}
                      className="h-8 px-2"
                    >
                      Prima Total
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Pólizas</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('createdAt')}
                      className="h-8 px-2"
                    >
                      Fecha Registro
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      Cargando clientes...
                    </TableCell>
                  </TableRow>
                ) : filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/clientes/${client.id}`)}
                    >
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={undefined} alt={`${client.firstName} ${client.lastName}`} />
                          <AvatarFallback>
                            {formatInitials(`${client.firstName} ${client.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {client.type === 'business' && client.companyName
                              ? client.companyName
                              : `${client.firstName} ${client.lastName}`}
                          </span>
                          {client.type === 'business' && (
                            <span className="text-xs text-muted-foreground">
                              {`${client.firstName} ${client.lastName}`}
                            </span>
                          )}
                          {client.tags && client.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {client.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(client.type)}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={`mailto:${client.email}`}
                              onClick={(e) => handleSendEmail(client, e)}
                              className="text-sm hover:underline"
                            >
                              {client.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <a
                              href={`tel:${client.phone}`}
                              onClick={(e) => handleCall(client, e)}
                              className="text-sm hover:underline"
                            >
                              {formatPhoneNumber(client.phone)}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.address.city}, {client.address.state}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(client.totalPremium)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span>{client.policies.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(client.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/clientes/${client.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/clientes/${client.id}/editar`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleSendEmail(client, e)}
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleCall(client, e)}
                            >
                              <Phone className="mr-2 h-4 w-4" />
                              Llamar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{' '}
              <strong>
                {selectedClient?.type === 'business' && selectedClient?.companyName
                  ? selectedClient?.companyName
                  : `${selectedClient?.firstName} ${selectedClient?.lastName}`}
              </strong> y toda su información asociada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedClient(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
