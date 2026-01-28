'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  User,
  Calendar,
  MapPin,
  Cake,
  Heart,
  IdCard,
  Flag,
  Languages,
  GraduationCap,
  Edit,
  Save,
  X
} from 'lucide-react';

interface ClientProfile {
  // Datos personales básicos
  name: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Estado civil y familia
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'partnered';
  nationality: string;
  birthPlace: string;

  // Educación
  educationLevel: string;
  profession: string;

  // Idiomas
  languages: {
    language: string;
    level: 'basic' | 'intermediate' | 'advanced' | 'native';
  }[];

  // Datos adicionales
  taxId: string;
  socialSecurityNumber?: string;
  passportNumber?: string;
  drivingLicense?: string;

  // Información médica básica
  bloodType?: string;
  allergies?: string[];

  // Notas
  notes?: string;
}

export default function ProfilePage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ClientProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, [clientId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditedProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedProfile) return;

    try {
      const response = await fetch(`/api/clients/${clientId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedProfile)
      });

      if (response.ok) {
        setProfile(editedProfile);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setEditing(false);
  };

  const getGenderLabel = (gender: string) => {
    const labels = {
      male: 'Masculino',
      female: 'Femenino',
      other: 'Otro',
      prefer_not_to_say: 'Prefiero no decir'
    };
    return labels[gender as keyof typeof labels] || gender;
  };

  const getMaritalStatusLabel = (status: string) => {
    const labels = {
      single: 'Soltero/a',
      married: 'Casado/a',
      divorced: 'Divorciado/a',
      widowed: 'Viudo/a',
      partnered: 'En pareja'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getLanguageLevelLabel = (level: string) => {
    const labels = {
      basic: 'Básico',
      intermediate: 'Intermedio',
      advanced: 'Avanzado',
      native: 'Nativo'
    };
    return labels[level as keyof typeof labels] || level;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No se encontró el perfil del cliente
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
            Perfil Completo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Datos personales completos del cliente
          </p>
        </div>
        <div className="flex gap-3">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Datos Personales Básicos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <User className="w-6 h-6 text-blue-600" />
          Datos Personales Básicos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nombre Completo
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.name || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              DNI / NIE
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.dni || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, dni: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.dni}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fecha de Nacimiento
            </label>
            {editing ? (
              <input
                type="date"
                value={editedProfile?.birthDate || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, birthDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(profile.birthDate).toLocaleDateString('es-ES')} ({profile.age} años)
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Género
            </label>
            {editing ? (
              <select
                value={editedProfile?.gender || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, gender: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
                <option value="other">Otro</option>
                <option value="prefer_not_to_say">Prefiero no decir</option>
              </select>
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{getGenderLabel(profile.gender)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado Civil
            </label>
            {editing ? (
              <select
                value={editedProfile?.maritalStatus || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, maritalStatus: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="single">Soltero/a</option>
                <option value="married">Casado/a</option>
                <option value="divorced">Divorciado/a</option>
                <option value="widowed">Viudo/a</option>
                <option value="partnered">En pareja</option>
              </select>
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{getMaritalStatusLabel(profile.maritalStatus)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nacionalidad
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.nationality || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, nationality: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.nationality}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lugar de Nacimiento
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.birthPlace || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, birthPlace: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.birthPlace}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              NIF / CIF
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.taxId || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, taxId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.taxId}</p>
            )}
          </div>
        </div>
      </div>

      {/* Educación y Profesión */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          Educación y Profesión
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel de Estudios
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.educationLevel || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, educationLevel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.educationLevel}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profesión
            </label>
            {editing ? (
              <input
                type="text"
                value={editedProfile?.profession || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile!, profession: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-900 dark:text-white font-medium">{profile.profession}</p>
            )}
          </div>
        </div>
      </div>

      {/* Idiomas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Languages className="w-6 h-6 text-blue-600" />
          Idiomas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {profile.languages.map((lang, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{lang.language}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{getLanguageLevelLabel(lang.level)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Documentación */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <IdCard className="w-6 h-6 text-blue-600" />
          Documentación
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de la Seguridad Social
            </label>
            <p className="text-gray-900 dark:text-white font-medium">{profile.socialSecurityNumber || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Número de Pasaporte
            </label>
            <p className="text-gray-900 dark:text-white font-medium">{profile.passportNumber || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Licencia de Conducir
            </label>
            <p className="text-gray-900 dark:text-white font-medium">{profile.drivingLicense || '-'}</p>
          </div>
        </div>
      </div>

      {/* Información Médica */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-600" />
          Información Médica Básica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Sangre
            </label>
            <p className="text-gray-900 dark:text-white font-medium">{profile.bloodType || '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Alergias
            </label>
            <p className="text-gray-900 dark:text-white font-medium">
              {profile.allergies && profile.allergies.length > 0 ? profile.allergies.join(', ') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Notas */}
      {profile.notes && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Notas Adicionales
          </h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.notes}</p>
        </div>
      )}
    </div>
  );
}
