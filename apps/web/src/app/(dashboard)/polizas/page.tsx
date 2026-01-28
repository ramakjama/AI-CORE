'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Car,
  Home,
  Heart,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

interface PolicyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
}

interface Policy {
  id: string;
  policyNumber: string;
  type: 'AUTO' | 'HOGAR' | 'VIDA' | 'SALUD';
  company: string;
  premium: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  expirationDate: string;
  startDate: string;
  description?: string;
  documents?: PolicyDocument[];
  coverage?: string;
  insuranceAmount?: number;
}

const POLICY_TYPES = [
  { value: 'AUTO', label: 'Auto', icon: Car, color: 'text-blue-600' },
  { value: 'HOGAR', label: 'Hogar', icon: Home, color: 'text-amber-600' },
  { value: 'VIDA', label: 'Vida', icon: Heart, color: 'text-red-600' },
  { value: 'SALUD', label: 'Salud', icon: Shield, color: 'text-green-600' },
];

const STATUS_CONFIG = {
  ACTIVE: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', label: 'Activa', badge: 'bg-green-200 dark:bg-green-800' },
  EXPIRED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: 'Vencida', badge: 'bg-red-200 dark:bg-red-800' },
  PENDING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', label: 'Pendiente', badge: 'bg-yellow-200 dark:bg-yellow-800' },
  CANCELLED: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-200', label: 'Cancelada', badge: 'bg-gray-200 dark:bg-gray-800' },
};

export default function PolizasPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/policies?includeDocuments=true');
      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }
      const data = await response.json();
      setPolicies(Array.isArray(data) ? data : data.policies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching policies');
      console.error('Error fetching policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiration = (expirationDate: string): number => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (expirationDate: string): boolean => {
    return calculateDaysUntilExpiration(expirationDate) <= 30 && calculateDaysUntilExpiration(expirationDate) > 0;
  };

  const isExpired = (expirationDate: string): boolean => {
    return calculateDaysUntilExpiration(expirationDate) <= 0;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const toggleTypeFilter = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(policy.type);
    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(policy.status);

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: policies.length,
    active: policies.filter((p) => p.status === 'ACTIVE').length,
    expiringSoon: policies.filter((p) => isExpiringSoon(p.expirationDate)).length,
    totalPremium: policies.reduce((sum, p) => sum + p.premium, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando pólizas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Mis Pólizas
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Gestiona y visualiza todas tus pólizas de seguros
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={fetchPolicies}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total de Pólizas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <Shield className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pólizas Activas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.active}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Por Vencer</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.expiringSoon}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Prima Total Anual</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCurrency(stats.totalPremium)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="space-y-6">
            {/* Search */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-3">
                <Search className="w-4 h-4" />
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por número de póliza, compañía..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Type Filters */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-3">
                <Filter className="w-4 h-4" />
                Tipo de Póliza
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {POLICY_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => toggleTypeFilter(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 font-medium text-sm ${
                        selectedTypes.includes(type.value)
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-3">
                <Filter className="w-4 h-4" />
                Estado
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => toggleStatusFilter(status)}
                    className={`p-3 rounded-lg border-2 transition-all font-medium text-sm ${
                      selectedStatus.includes(status)
                        ? `border-blue-600 ${config.bg} ${config.text}`
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Filters */}
            {(selectedTypes.length > 0 || selectedStatus.length > 0 || searchTerm) && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTypes([]);
                    setSelectedStatus([]);
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Policies List */}
        {filteredPolicies.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm || selectedTypes.length > 0 || selectedStatus.length > 0
                ? 'No se encontraron pólizas'
                : 'No tienes pólizas registradas'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              {searchTerm || selectedTypes.length > 0 || selectedStatus.length > 0
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Contáctanos para contratar tus pólizas de seguros'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPolicies.map((policy) => {
              const statusConfig = STATUS_CONFIG[policy.status];
              const TypeIcon = POLICY_TYPES.find((t) => t.value === policy.type)?.icon || Shield;
              const daysUntilExpiration = calculateDaysUntilExpiration(policy.expirationDate);
              const showWarning = isExpiringSoon(policy.expirationDate);

              return (
                <Link
                  key={policy.id}
                  href={`/polizas/${policy.id}`}
                  className={`group rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 ${statusConfig.bg}`}
                  style={{ borderLeftColor: policy.status === 'ACTIVE' ? '#16a34a' : policy.status === 'EXPIRED' ? '#dc2626' : policy.status === 'PENDING' ? '#f59e0b' : '#6b7280' }}
                >
                  <div className="p-6 bg-white dark:bg-gray-800">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${statusConfig.bg}`}>
                          <TypeIcon className={`w-6 h-6 ${POLICY_TYPES.find((t) => t.value === policy.type)?.color || 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                            {policy.policyNumber}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {policy.company}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.badge} ${statusConfig.text}`}>
                        {statusConfig.label}
                      </div>
                    </div>

                    {/* Warning Banner */}
                    {showWarning && (
                      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-orange-800 dark:text-orange-200">
                            Vencimiento próximo
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            {daysUntilExpiration} días restantes
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Prima Anual</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(policy.premium)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Cantidad Asegurada</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {policy.insuranceAmount ? formatCurrency(policy.insuranceAmount) : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {policy.description && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Descripción</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                            {policy.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Inicio
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(policy.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Vencimiento
                          </p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(policy.expirationDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Documents */}
                    {policy.documents && policy.documents.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-2">
                          Documentos ({policy.documents.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {policy.documents.slice(0, 2).map((doc) => (
                            <a
                              key={doc.id}
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              {doc.name}
                            </a>
                          ))}
                          {policy.documents.length > 2 && (
                            <span className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400">
                              +{policy.documents.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Ver detalles
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
