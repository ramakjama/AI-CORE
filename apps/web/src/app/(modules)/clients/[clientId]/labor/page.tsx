'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Briefcase,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  TrendingUp,
  Award,
  Clock
} from 'lucide-react';

interface LaborInfo {
  currentJob: {
    position: string;
    company: string;
    companySize: string;
    industry: string;
    department?: string;
    startDate: string;
    yearsInPosition: number;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'self-employed';
    workLocation: string;
    salary: number;
    salaryFrequency: 'monthly' | 'annual';
    benefits?: string[];
  };
  workHistory: {
    id: string;
    position: string;
    company: string;
    startDate: string;
    endDate?: string;
    duration: string;
    description?: string;
  }[];
  skills: string[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }[];
  employmentStatus: 'employed' | 'unemployed' | 'self-employed' | 'retired';
  totalWorkExperience: number;
}

export default function LaborPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [laborInfo, setLaborInfo] = useState<LaborInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLaborInfo();
  }, [clientId]);

  const loadLaborInfo = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/labor`);
      if (response.ok) {
        const data = await response.json();
        setLaborInfo(data);
      }
    } catch (error) {
      console.error('Error loading labor info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmploymentTypeLabel = (type: string) => {
    const labels = {
      'full-time': 'Tiempo Completo',
      'part-time': 'Tiempo Parcial',
      contract: 'Contrato',
      freelance: 'Freelance',
      'self-employed': 'Autónomo'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getEmploymentStatusLabel = (status: string) => {
    const labels = {
      employed: 'Empleado',
      unemployed: 'Desempleado',
      'self-employed': 'Autónomo',
      retired: 'Jubilado'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!laborInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No se encontró información laboral
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Situación Laboral
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Profesión, empresa, trayectoria y experiencia
          </p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
            {getEmploymentStatusLabel(laborInfo.employmentStatus)}
          </span>
        </div>
      </div>

      {/* Experience Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {laborInfo.totalWorkExperience}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Años de Experiencia Total
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4">
            <Building2 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {laborInfo.currentJob.yearsInPosition}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Años en la Empresa Actual
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {laborInfo.certifications.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Certificaciones
          </div>
        </div>
      </div>

      {/* Current Job */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-blue-600" />
          Empleo Actual
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cargo / Posición
            </label>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {laborInfo.currentJob.position}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empresa
            </label>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">
              {laborInfo.currentJob.company}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sector / Industria
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {laborInfo.currentJob.industry}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Empleo
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {getEmploymentTypeLabel(laborInfo.currentJob.employmentType)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tamaño de la Empresa
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {laborInfo.currentJob.companySize}
            </p>
          </div>

          {laborInfo.currentJob.department && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Departamento
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {laborInfo.currentJob.department}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ubicación del Trabajo
            </label>
            <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              {laborInfo.currentJob.workLocation}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Inicio
            </label>
            <p className="text-gray-900 dark:text-white font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              {new Date(laborInfo.currentJob.startDate).toLocaleDateString('es-ES')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Salario
            </label>
            <p className="text-xl font-bold text-green-600 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {formatCurrency(laborInfo.currentJob.salary)}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                / {laborInfo.currentJob.salaryFrequency === 'monthly' ? 'mes' : 'año'}
              </span>
            </p>
          </div>
        </div>

        {laborInfo.currentJob.benefits && laborInfo.currentJob.benefits.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Beneficios
            </label>
            <div className="flex flex-wrap gap-2">
              {laborInfo.currentJob.benefits.map((benefit, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Work History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Historial Laboral
        </h2>
        <div className="space-y-4">
          {laborInfo.workHistory.map((job, index) => (
            <div
              key={job.id}
              className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 relative"
            >
              {index === 0 && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                  Más Reciente
                </span>
              )}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {job.position}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {job.company}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                    {new Date(job.startDate).toLocaleDateString('es-ES')} - {job.endDate ? new Date(job.endDate).toLocaleDateString('es-ES') : 'Presente'} • {job.duration}
                  </p>
                  {job.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-3">
                      {job.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Certifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-purple-600" />
            Habilidades
          </h2>
          <div className="flex flex-wrap gap-2">
            {laborInfo.skills.map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="w-6 h-6 text-orange-600" />
            Certificaciones
          </h2>
          <div className="space-y-3">
            {laborInfo.certifications.map((cert) => (
              <div
                key={cert.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {cert.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {cert.issuer}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Emitido: {new Date(cert.issueDate).toLocaleDateString('es-ES')}
                  {cert.expiryDate && ` • Vence: ${new Date(cert.expiryDate).toLocaleDateString('es-ES')}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
