'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Wallet,
  Home,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Award
} from 'lucide-react';

interface ClientOverview {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;

  // Resumen ejecutivo
  customerScore: number;
  lifetimeValue: number;
  riskLevel: 'low' | 'medium' | 'high';
  relationshipAge: number;

  // Estadísticas clave
  totalAssets: number;
  activeProducts: number;
  pendingTasks: number;
  lastInteraction: string;

  // Estado general
  profileCompleteness: number;
  kycStatus: 'pending' | 'approved' | 'rejected';
  preferredChannel: string;

  // Datos básicos
  age?: number;
  occupation?: string;
  city?: string;

  // Indicadores financieros
  monthlyIncome?: number;
  creditScore?: number;

  // Actividad reciente
  recentActivities: {
    id: string;
    type: string;
    description: string;
    date: string;
    icon: string;
  }[];

  // Alertas
  alerts: {
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    date: string;
  }[];
}

export default function OverviewPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [overview, setOverview] = useState<ClientOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, [clientId]);

  const loadOverview = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/overview`);
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Error loading overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'rejected':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No se pudo cargar la información del cliente
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vista General
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Resumen ejecutivo del cliente
            </p>
          </div>
          <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getKycStatusColor(overview.kycStatus)}`}>
              KYC: {overview.kycStatus === 'approved' ? 'Aprobado' : overview.kycStatus === 'pending' ? 'Pendiente' : 'Rechazado'}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Customer Score */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Award className="w-6 h-6 text-blue-600" />
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getRiskColor(overview.riskLevel)}`}>
              Riesgo {overview.riskLevel === 'low' ? 'Bajo' : overview.riskLevel === 'medium' ? 'Medio' : 'Alto'}
            </span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {overview.customerScore}/100
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Puntuación del Cliente
          </div>
          <div className="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${overview.customerScore}%` }}
            />
          </div>
        </div>

        {/* Lifetime Value */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(overview.lifetimeValue)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Valor de Vida del Cliente (LTV)
          </div>
        </div>

        {/* Total Assets */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Home className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(overview.totalAssets)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Patrimonio Total
          </div>
        </div>

        {/* Relationship Age */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {overview.relationshipAge}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Años de Relación
          </div>
        </div>
      </div>

      {/* Profile Completeness & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Profile Completeness */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Completitud del Perfil
          </h3>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-200 dark:text-gray-700"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - overview.profileCompleteness / 100)}`}
                className="text-blue-600 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {overview.profileCompleteness}%
              </span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {overview.profileCompleteness < 50 ? 'Completa más información' : overview.profileCompleteness < 80 ? 'Buen progreso' : 'Perfil completo'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Estadísticas Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overview.activeProducts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Productos Activos
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Target className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overview.pendingTasks}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tareas Pendientes
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overview.monthlyIncome ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(overview.monthlyIncome) : '-'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Ingresos Mensuales
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(overview.lastInteraction).toLocaleDateString('es-ES')}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Última Interacción
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Alerts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Alertas y Notificaciones
          </h3>
          <div className="space-y-3">
            {overview.alerts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay alertas pendientes
                </p>
              </div>
            ) : (
              overview.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-lg ${
                    alert.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : alert.type === 'info'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                      : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  }`}
                >
                  <AlertCircle
                    className={`w-5 h-5 flex-shrink-0 ${
                      alert.type === 'warning'
                        ? 'text-yellow-600'
                        : alert.type === 'info'
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(alert.date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4">
            {overview.recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(activity.date).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href={`/clients/${clientId}/profile`}
            className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <User className="w-6 h-6 text-white" />
            <span className="text-sm text-white font-medium">Ver Perfil</span>
          </Link>
          <Link
            href={`/clients/${clientId}/contact`}
            className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Phone className="w-6 h-6 text-white" />
            <span className="text-sm text-white font-medium">Contacto</span>
          </Link>
          <Link
            href={`/clients/${clientId}/assets`}
            className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Home className="w-6 h-6 text-white" />
            <span className="text-sm text-white font-medium">Patrimonio</span>
          </Link>
          <Link
            href={`/clients/${clientId}/relations`}
            className="flex flex-col items-center gap-2 p-4 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Users className="w-6 h-6 text-white" />
            <span className="text-sm text-white font-medium">Relaciones</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
