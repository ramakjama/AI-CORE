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
  FileText,
  RefreshCw,
  ArrowUpDown,
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
import { useDataFetcher, useDataMutation } from '@/hooks/use-data-fetcher';
import { Policy, PolicyStatus, PolicyType } from '@/types';
import { formatCurrency, formatDate, truncate } from '@/lib/format';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function PolizasPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PolicyType | 'all'>('all');
  const [sortField, setSortField] = useState<string>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch policies
  const { data: policies, isLoading, refetch } = useDataFetcher<Policy[]>(
    '/api/polizas',
    {
      enabled: true,
      refetchInterval: 30000,
    }
  );

  // Delete mutation
  const { mutate: deletePolicy, isLoading: isDeleting } = useDataMutation();

  // Mock data for demonstration
  const mockPolicies: Policy[] = useMemo(
    () =>
      policies ||
      Array.from({ length: 20 }, (_, i) => ({
        id: `pol-${i + 1}`,
        policyNumber: `POL-2024-${String(i + 1).padStart(4, '0')}`,
        type: ['auto', 'home', 'life', 'health', 'business'][i % 5] as PolicyType,
        status: ['active', 'expired', 'pending', 'suspended'][i % 4] as PolicyStatus,
        clientId: `client-${i + 1}`,
        client: {
          id: `client-${i + 1}`,
          type: 'individual',
          status: 'active',
          firstName: `Cliente`,
          lastName: `${i + 1}`,
          email: `cliente${i + 1}@ejemplo.com`,
          phone: '+34 600 000 000',
          address: {
            street: 'Calle Principal',
            city: 'Madrid',
            state: 'Madrid',
            zipCode: '28001',
            country: 'España',
          },
          policies: [],
          claims: [],
          documents: [],
          assignedAgentId: 'agent-1',
          totalPremium: 0,
          totalClaims: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        insuranceCompany: ['Mapfre', 'Allianz', 'AXA', 'Zurich', 'Generali'][i % 5],
        startDate: new Date(2024, 0, i + 1),
        endDate: new Date(2025, 0, i + 1),
        premium: 500 + i * 50,
        paymentFrequency: 'monthly',
        coverage: [
          {
            id: '1',
            type: 'Cobertura principal',
            description: 'Cobertura básica',
            amount: 50000 + i * 1000,
          },
        ],
        documents: [],
        agentId: 'agent-1',
        createdAt: new Date(2024, 0, i + 1),
        updatedAt: new Date(2024, 0, i + 1),
      })),
    [policies]
  );

  // Filter and sort policies
  const filteredPolicies = useMemo(() => {
    let result = [...mockPolicies];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (policy) =>
          policy.policyNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.insuranceCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.client?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          policy.client?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((policy) => policy.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((policy) => policy.type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof Policy];
      let bValue: any = b[sortField as keyof Policy];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [mockPolicies, searchQuery, statusFilter, typeFilter, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;

    try {
      await deletePolicy('delete', `/api/polizas/${selectedPolicy.id}`);
      toast.success('Póliza eliminada correctamente');
      setDeleteDialogOpen(false);
      setSelectedPolicy(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar la póliza');
    }
  };

  const handleExport = () => {
    toast.success('Exportando pólizas...');
    // Implement export functionality
  };

  const getStatusBadge = (status: PolicyStatus) => {
    const variants: Record<PolicyStatus, any> = {
      active: 'default',
      expired: 'secondary',
      cancelled: 'destructive',
      pending: 'outline',
      suspended: 'secondary',
    };

    const labels: Record<PolicyStatus, string> = {
      active: 'Activa',
      expired: 'Expirada',
      cancelled: 'Cancelada',
      pending: 'Pendiente',
      suspended: 'Suspendida',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeBadge = (type: PolicyType) => {
    const labels: Record<PolicyType, string> = {
      auto: 'Auto',
      home: 'Hogar',
      life: 'Vida',
      health: 'Salud',
      business: 'Empresa',
      travel: 'Viaje',
      other: 'Otro',
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pólizas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las pólizas de seguros
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
          <Button onClick={() => router.push('/polizas/nueva')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Póliza
          </Button>
        </div>
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
                placeholder="Buscar por número, compañía o cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as PolicyStatus | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="expired">Expirada</SelectItem>
                <SelectItem value="suspended">Suspendida</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as PolicyType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="home">Hogar</SelectItem>
                <SelectItem value="life">Vida</SelectItem>
                <SelectItem value="health">Salud</SelectItem>
                <SelectItem value="business">Empresa</SelectItem>
                <SelectItem value="travel">Viaje</SelectItem>
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
          Mostrando {filteredPolicies.length} de {mockPolicies.length} pólizas
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('policyNumber')}
                      className="h-8 px-2"
                    >
                      Número
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('type')}
                      className="h-8 px-2"
                    >
                      Tipo
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Compañía</TableHead>
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
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('premium')}
                      className="h-8 px-2"
                    >
                      Prima
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('startDate')}
                      className="h-8 px-2"
                    >
                      Inicio
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('endDate')}
                      className="h-8 px-2"
                    >
                      Vencimiento
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Cargando pólizas...
                    </TableCell>
                  </TableRow>
                ) : filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No se encontraron pólizas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => (
                    <TableRow
                      key={policy.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/polizas/${policy.id}`)}
                    >
                      <TableCell className="font-medium">
                        {policy.policyNumber}
                      </TableCell>
                      <TableCell>{getTypeBadge(policy.type)}</TableCell>
                      <TableCell>
                        {policy.client
                          ? `${policy.client.firstName} ${policy.client.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>{policy.insuranceCompany}</TableCell>
                      <TableCell>{getStatusBadge(policy.status)}</TableCell>
                      <TableCell>{formatCurrency(policy.premium)}</TableCell>
                      <TableCell>{formatDate(policy.startDate)}</TableCell>
                      <TableCell>{formatDate(policy.endDate)}</TableCell>
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
                                router.push(`/polizas/${policy.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/polizas/${policy.id}/editar`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/polizas/${policy.id}/documentos`);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Documentos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPolicy(policy);
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
            <DialogTitle>¿Eliminar póliza?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la póliza{' '}
              <strong>{selectedPolicy?.policyNumber}</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedPolicy(null);
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
