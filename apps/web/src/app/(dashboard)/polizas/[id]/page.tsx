'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Car,
  Home,
  Heart,
  AlertTriangle,
  ChevronLeft,
  Download,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface PolicyDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt?: string;
}

interface Policy {
  id: string;
  policyNumber: string;
  type: 'AUTO' | 'HOGAR' | 'VIDA' | 'SALUD';
  company: string;
  companyPhone?: string;
  companyEmail?: string;
  companyAddress?: string;
  premium: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED';
  expirationDate: string;
  startDate: string;
  description?: string;
  documents?: PolicyDocument[];
  coverage?: string;
  insuranceAmount?: number;
  deductible?: number;
  policyHolder?: string;
  beneficiary?: string;
}

const POLICY_TYPES = [
  { value: 'AUTO', label: 'Seguros de Auto', icon: Car, color: 'text-blue-600' },
  { value: 'HOGAR', label: 'Seguros de Hogar', icon: Home, color: 'text-amber-600' },
  { value: 'VIDA', label: 'Seguros de Vida', icon: Heart, color: 'text-red-600' },
  { value: 'SALUD', label: 'Seguros de Salud', icon: Shield, color: 'text-green-600' },
];

const STATUS_CONFIG = {
  ACTIVE: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-800 dark:text-green-200', label: 'Activa', icon: CheckCircle },
  EXPIRED: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-800 dark:text-red-200', label: 'Vencida', icon: XCircle },
  PENDING: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-800 dark:text-yellow-200', label: 'Pendiente', icon: Clock },
  CANCELLED: { bg: 'bg-gray-50 dark:bg-gray-900/20', text: 'text-gray-800 dark:text-gray-200', label: 'Cancelada', icon: AlertCircle },
};

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPolicy();
  }, [policyId]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/policies/${policyId}?includeDocuments=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch policy');
      }
      const data = await response.json();
      setPolicy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching policy');
      console.error('Error fetching policy:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Error al cargar la póliza
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[policy.status];
  const PolicyTypeIcon = POLICY_TYPES.find((t) => t.value === policy.type)?.icon || Shield;
  const daysUntilExpiration = calculateDaysUntilExpiration(policy.expirationDate);
  const showWarning = isExpiringSoon(policy.expirationDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6 font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a Pólizas
          </button>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <PolicyTypeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {policy.policyNumber}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{policy.company}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${statusConfig.bg} ${statusConfig.text}`}>
              {statusConfig.icon && <statusConfig.icon className="w-5 h-5" />}
              {statusConfig.label}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        {showWarning && (
          <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Próximo a Vencer
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mt-1">
                Esta póliza vence en <strong>{daysUntilExpiration} días</strong> ({formatDate(policy.expirationDate)}). Considera renovarla para evitar interrupciones en tu cobertura.
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Policy Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Información de la Póliza
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Prima Anual
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(policy.premium)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Cantidad Asegurada
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {policy.insuranceAmount ? formatCurrency(policy.insuranceAmount) : 'N/A'}
                  </p>
                </div>

                {policy.deductible !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                      Deducible
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(policy.deductible)}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Tipo
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {POLICY_TYPES.find((t) => t.value === policy.type)?.label || policy.type}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Vigencia
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Inicio
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(policy.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Vencimiento
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatDate(policy.expirationDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {policy.description && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Descripción
                </h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {policy.description}
                </p>
              </div>
            )}

            {/* Coverage */}
            {policy.coverage && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Cobertura
                </h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {policy.coverage}
                </p>
              </div>
            )}

            {/* Policyholder & Beneficiary */}
            {(policy.policyHolder || policy.beneficiary) && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Personas
                </h2>

                <div className="space-y-4">
                  {policy.policyHolder && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                        Asegurado
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {policy.policyHolder}
                      </p>
                    </div>
                  )}

                  {policy.beneficiary && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-2">
                        Beneficiario
                      </p>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {policy.beneficiary}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {policy.documents && policy.documents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documentos ({policy.documents.length})
                </h2>

                <div className="space-y-3">
                  {policy.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {doc.name}
                          </p>
                          {doc.uploadedAt && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Download className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Company Info & Actions */}
          <div className="space-y-6">
            {/* Company Contact Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Contacto Asegurador
              </h2>

              <div className="space-y-4">
                {policy.companyPhone && (
                  <a
                    href={`tel:${policy.companyPhone}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Teléfono</p>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {policy.companyPhone}
                      </p>
                    </div>
                  </a>
                )}

                {policy.companyEmail && (
                  <a
                    href={`mailto:${policy.companyEmail}`}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {policy.companyEmail}
                      </p>
                    </div>
                  </a>
                )}

                {policy.companyAddress && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Dirección</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {policy.companyAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Acciones
              </h2>

              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
                  Renovar Póliza
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Realizar Reclamación
                </button>
                <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Modificar Datos
                </button>
              </div>
            </div>

            {/* Status Summary */}
            <div className={`rounded-lg shadow p-6 ${statusConfig.bg}`}>
              <h2 className={`text-lg font-semibold mb-3 ${statusConfig.text}`}>
                Estado Actual
              </h2>
              <p className={`text-sm ${statusConfig.text} mb-4`}>
                {policy.status === 'ACTIVE'
                  ? 'Tu póliza está activa y en vigor. Disfrutas de todas las coberturas.'
                  : policy.status === 'EXPIRED'
                    ? 'Tu póliza ha expirado. Contacta al asegurador para renovarla.'
                    : policy.status === 'PENDING'
                      ? 'Tu póliza está pendiente de activación. Se activará en breve.'
                      : 'Tu póliza ha sido cancelada.'}
              </p>
              {showWarning && policy.status === 'ACTIVE' && (
                <div className="pt-4 border-t border-orange-200 dark:border-orange-800">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Se recomienda renovar {daysUntilExpiration} días antes del vencimiento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
