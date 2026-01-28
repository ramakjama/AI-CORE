'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  FileText,
  RefreshCw,
  ArrowUpDown,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Calendar,
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
import { Claim, ClaimStatus, ClaimType, ClaimPriority } from '@/types';
import { formatCurrency, formatDate, formatRelativeDate, truncate } from '@/lib/format';
import toast from 'react-hot-toast';

export default function SiniestrosPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ClaimType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<ClaimPriority | 'all'>('all');
  const [sortField, setSortField] = useState<string>('reportDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch claims
  const { data: claims, isLoading, refetch } = useDataFetcher<Claim[]>(
    '/api/siniestros',
    {
      enabled: true,
      refetchInterval: 30000,
    }
  );

  // Delete mutation
  const { mutate: deleteClaim, isLoading: isDeleting } = useDataMutation();

  // Mock data for demonstration
  const mockClaims: Claim[] = useMemo(
    () =>
      claims ||
      Array.from({ length: 30 }, (_, i) => ({
        id: `claim-${i + 1}`,
        claimNumber: `CLM-2024-${String(i + 1).padStart(4, '0')}`,
        policyId: `policy-${i + 1}`,
        clientId: `client-${i + 1}`,
        type: ['accident', 'theft', 'damage', 'medical', 'liability'][i % 5] as ClaimType,
        status: ['submitted', 'under-review', 'approved', 'denied', 'paid', 'closed'][i % 6] as ClaimStatus,
        priority: ['low', 'medium', 'high', 'urgent'][i % 4] as ClaimPriority,
        incidentDate: new Date(2024, 5, i + 1),
        reportDate: new Date(2024, 5, i + 2),
        description: `Descripción detallada del siniestro número ${i + 1}. Incluye información relevante sobre el incidente.`,
        estimatedAmount: 1000 + i * 500,
        approvedAmount: i % 3 === 0 ? 800 + i * 400 : undefined,
        paidAmount: i % 5 === 0 ? 750 + i * 350 : undefined,
        documents: [],
        timeline: [
          {
            id: '1',
            date: new Date(2024, 5, i + 2),
            action: 'submitted',
            description: 'Siniestro reportado',
            userId: 'user-1',
          },
          {
            id: '2',
            date: new Date(2024, 5, i + 3),
            action: 'under-review',
            description: 'En revisión',
            userId: 'user-2',
          },
        ],
        assignedAdjusterId: i % 2 === 0 ? `adjuster-${(i % 3) + 1}` : undefined,
        notes: i % 3 === 0 ? `Notas adicionales del siniestro ${i + 1}` : undefined,
        createdAt: new Date(2024, 5, i + 2),
        updatedAt: new Date(2024, 5, i + 2),
        closedAt: i % 7 === 0 ? new Date(2024, 5, i + 10) : undefined,
      })),
    [claims]
  );

  // Filter and sort claims
  const filteredClaims = useMemo(() => {
    let result = [...mockClaims];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(
        (claim) =>
          claim.claimNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          claim.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter((claim) => claim.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter((claim) => claim.type === typeFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      result = result.filter((claim) => claim.priority === priorityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof Claim];
      let bValue: any = b[sortField as keyof Claim];

      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [mockClaims, searchQuery, statusFilter, typeFilter, priorityFilter, sortField, sortOrder]);

  // Statistics
  const statistics = useMemo(() => {
    return {
      total: mockClaims.length,
      pending: mockClaims.filter((c) => c.status === 'submitted' || c.status === 'under-review').length,
      approved: mockClaims.filter((c) => c.status === 'approved').length,
      paid: mockClaims.filter((c) => c.status === 'paid').length,
      denied: mockClaims.filter((c) => c.status === 'denied').length,
      totalEstimated: mockClaims.reduce((sum, c) => sum + c.estimatedAmount, 0),
      totalApproved: mockClaims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0),
      totalPaid: mockClaims.reduce((sum, c) => sum + (c.paidAmount || 0), 0),
      avgProcessingTime: 7.5, // days
    };
  }, [mockClaims]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (!selectedClaim) return;

    try {
      await deleteClaim('delete', `/api/siniestros/${selectedClaim.id}`);
      toast.success('Siniestro eliminado correctamente');
      setDeleteDialogOpen(false);
      setSelectedClaim(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el siniestro');
    }
  };

  const handleExport = () => {
    toast.success('Exportando siniestros...');
  };

  const getStatusIcon = (status: ClaimStatus) => {
    const icons: Record<ClaimStatus, React.ReactNode> = {
      submitted: <Clock className="h-4 w-4" />,
      'under-review': <AlertCircle className="h-4 w-4" />,
      approved: <CheckCircle className="h-4 w-4" />,
      denied: <XCircle className="h-4 w-4" />,
      paid: <DollarSign className="h-4 w-4" />,
      closed: <CheckCircle className="h-4 w-4" />,
    };

    return icons[status];
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const variants: Record<ClaimStatus, any> = {
      submitted: 'outline',
      'under-review': 'default',
      approved: 'default',
      denied: 'destructive',
      paid: 'default',
      closed: 'secondary',
    };

    const labels: Record<ClaimStatus, string> = {
      submitted: 'Enviado',
      'under-review': 'En Revisión',
      approved: 'Aprobado',
      denied: 'Denegado',
      paid: 'Pagado',
      closed: 'Cerrado',
    };

    return (
      <Badge variant={variants[status]} className="flex items-center gap-1 w-fit">
        {getStatusIcon(status)}
        {labels[status]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ClaimPriority) => {
    const variants: Record<ClaimPriority, any> = {
      low: 'secondary',
      medium: 'outline',
      high: 'default',
      urgent: 'destructive',
    };

    const labels: Record<ClaimPriority, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };

    return <Badge variant={variants[priority]}>{labels[priority]}</Badge>;
  };

  const getTypeBadge = (type: ClaimType) => {
    const labels: Record<ClaimType, string> = {
      accident: 'Accidente',
      theft: 'Robo',
      damage: 'Daño',
      medical: 'Médico',
      liability: 'Responsabilidad',
      other: 'Otro',
    };

    return <Badge variant="outline">{labels[type]}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Siniestros</h1>
          <p className="text-muted-foreground">
            Gestiona y procesa reclamaciones de seguros
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => router.push('/siniestros/nuevo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Siniestro
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siniestros Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending}</div>
            <p className="text-xs text-muted-foreground">
              de {statistics.total} totales
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Tiempo promedio: {statistics.avgProcessingTime} días
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siniestros Aprobados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.approved}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.paid} pagados
            </p>
            <div className="mt-2 text-xs text-green-600">
              Tasa de aprobación: {((statistics.approved / statistics.total) * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalEstimated)}</div>
            <p className="text-xs text-muted-foreground">
              Aprobado: {formatCurrency(statistics.totalApproved)}
            </p>
            <div className="mt-2 text-xs text-muted-foreground">
              Pagado: {formatCurrency(statistics.totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denegados</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.denied}</div>
            <p className="text-xs text-muted-foreground">
              Tasa: {((statistics.denied / statistics.total) * 100).toFixed(1)}%
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
                placeholder="Buscar por número o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ClaimStatus | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="submitted">Enviado</SelectItem>
                <SelectItem value="under-review">En Revisión</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="denied">Denegado</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => setTypeFilter(value as ClaimType | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="accident">Accidente</SelectItem>
                <SelectItem value="theft">Robo</SelectItem>
                <SelectItem value="damage">Daño</SelectItem>
                <SelectItem value="medical">Médico</SelectItem>
                <SelectItem value="liability">Responsabilidad</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as ClaimPriority | 'all')}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
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
          Mostrando {filteredClaims.length} de {mockClaims.length} siniestros
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
                      onClick={() => handleSort('claimNumber')}
                      className="h-8 px-2"
                    >
                      Número
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('priority')}
                      className="h-8 px-2"
                    >
                      Prioridad
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
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
                      onClick={() => handleSort('estimatedAmount')}
                      className="h-8 px-2"
                    >
                      Monto Estimado
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('incidentDate')}
                      className="h-8 px-2"
                    >
                      Fecha Incidente
                      <ArrowUpDown className="ml-2 h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('reportDate')}
                      className="h-8 px-2"
                    >
                      Fecha Reporte
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
                      Cargando siniestros...
                    </TableCell>
                  </TableRow>
                ) : filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No se encontraron siniestros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow
                      key={claim.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/siniestros/${claim.id}`)}
                    >
                      <TableCell className="font-medium">
                        {claim.claimNumber}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {truncate(claim.description, 80)}
                      </TableCell>
                      <TableCell>{getTypeBadge(claim.type)}</TableCell>
                      <TableCell>{getPriorityBadge(claim.priority)}</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {formatCurrency(claim.estimatedAmount)}
                          </span>
                          {claim.approvedAmount && (
                            <span className="text-xs text-green-600">
                              Aprobado: {formatCurrency(claim.approvedAmount)}
                            </span>
                          )}
                          {claim.paidAmount && (
                            <span className="text-xs text-blue-600">
                              Pagado: {formatCurrency(claim.paidAmount)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(claim.incidentDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatRelativeDate(claim.reportDate)}
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
                                router.push(`/siniestros/${claim.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/siniestros/${claim.id}/editar`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/siniestros/${claim.id}/documentos`);
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Documentos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClaim(claim);
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
            <DialogTitle>¿Eliminar siniestro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el siniestro{' '}
              <strong>{selectedClaim?.claimNumber}</strong> y toda su información asociada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedClaim(null);
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
