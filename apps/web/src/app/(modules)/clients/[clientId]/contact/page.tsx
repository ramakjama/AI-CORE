'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Phone,
  Mail,
  MapPin,
  Home,
  Briefcase,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  MessageCircle,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';

interface ContactInfo {
  phones: {
    id: string;
    type: 'mobile' | 'home' | 'work' | 'other';
    number: string;
    preferred: boolean;
  }[];
  emails: {
    id: string;
    type: 'personal' | 'work' | 'other';
    address: string;
    preferred: boolean;
  }[];
  addresses: {
    id: string;
    type: 'home' | 'work' | 'billing' | 'shipping' | 'other';
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    preferred: boolean;
  }[];
  socialMedia: {
    id: string;
    platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'other';
    handle: string;
    url?: string;
  }[];
  website?: string;
}

export default function ContactPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactInfo();
  }, [clientId]);

  const loadContactInfo = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/contact`);
      if (response.ok) {
        const data = await response.json();
        setContactInfo(data);
      }
    } catch (error) {
      console.error('Error loading contact info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhoneTypeLabel = (type: string) => {
    const labels = { mobile: 'Móvil', home: 'Casa', work: 'Trabajo', other: 'Otro' };
    return labels[type as keyof typeof labels] || type;
  };

  const getEmailTypeLabel = (type: string) => {
    const labels = { personal: 'Personal', work: 'Trabajo', other: 'Otro' };
    return labels[type as keyof typeof labels] || type;
  };

  const getAddressTypeLabel = (type: string) => {
    const labels = {
      home: 'Domicilio',
      work: 'Trabajo',
      billing: 'Facturación',
      shipping: 'Envío',
      other: 'Otro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getSocialIcon = (platform: string) => {
    const icons = {
      instagram: Instagram,
      facebook: Facebook,
      twitter: Twitter,
      linkedin: Linkedin,
      whatsapp: MessageCircle
    };
    return icons[platform as keyof typeof icons] || Globe;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contactInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No se encontró información de contacto
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Información de Contacto
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Teléfonos, emails, direcciones y redes sociales
        </p>
      </div>

      {/* Teléfonos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-blue-600" />
            Teléfonos
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contactInfo.phones.map((phone) => (
            <div
              key={phone.id}
              className={`p-4 rounded-lg border-2 ${
                phone.preferred
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {getPhoneTypeLabel(phone.type)}
                </span>
                {phone.preferred && (
                  <span className="text-xs px-2 py-1 bg-blue-600 text-white rounded-full">
                    Preferido
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {phone.number}
              </p>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Emails */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-6 h-6 text-green-600" />
            Correos Electrónicos
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactInfo.emails.map((email) => (
            <div
              key={email.id}
              className={`p-4 rounded-lg border-2 ${
                email.preferred
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {getEmailTypeLabel(email.type)}
                </span>
                {email.preferred && (
                  <span className="text-xs px-2 py-1 bg-green-600 text-white rounded-full">
                    Preferido
                  </span>
                )}
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-3 break-all">
                {email.address}
              </p>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-700">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direcciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-600" />
            Direcciones
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>
        <div className="space-y-4">
          {contactInfo.addresses.map((address) => (
            <div
              key={address.id}
              className={`p-5 rounded-lg border-2 ${
                address.preferred
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase">
                      {getAddressTypeLabel(address.type)}
                    </span>
                    {address.preferred && (
                      <span className="text-xs px-2 py-1 bg-red-600 text-white rounded-full">
                        Preferida
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium mb-1">
                    {address.street}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {address.postalCode} {address.city}, {address.state}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {address.country}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-700">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redes Sociales */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-600" />
            Redes Sociales
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Plus className="w-4 h-4" />
            Añadir
          </button>
        </div>

        {contactInfo.website && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sitio Web
            </label>
            <a
              href={contactInfo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {contactInfo.website}
            </a>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contactInfo.socialMedia.map((social) => {
            const Icon = getSocialIcon(social.platform);
            return (
              <div
                key={social.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {social.platform}
                  </span>
                </div>
                <p className="text-gray-900 dark:text-white font-medium mb-3">
                  @{social.handle}
                </p>
                <div className="flex gap-2">
                  {social.url && (
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Ver perfil
                    </a>
                  )}
                  <button className="text-blue-600 hover:text-blue-700">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
