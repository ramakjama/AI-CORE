'use client';

import { useState } from 'react';
import { Home, Edit, Trash2, Eye, CheckCircle, AlertCircle, Bed, Bath, Maximize } from 'lucide-react';
import { Property, PropertyType, PropertyUsage } from '@/types/assets';

interface PropertyCardProps {
  property: Property;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PropertyCard({ property, onView, onEdit, onDelete }: PropertyCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPropertyTypeLabel = (type: PropertyType) => {
    const labels: Record<PropertyType, string> = {
      APARTMENT: 'Piso',
      HOUSE: 'Casa',
      PENTHOUSE: 'Ático',
      DUPLEX: 'Dúplex',
      STUDIO: 'Estudio',
      COMMERCIAL: 'Local Comercial',
      OFFICE: 'Oficina',
      GARAGE: 'Garaje',
      STORAGE: 'Trastero',
      LAND: 'Terreno',
      BUILDING: 'Edificio',
      OTHER: 'Otro'
    };
    return labels[type];
  };

  const getUsageLabel = (usage: PropertyUsage) => {
    const labels: Record<PropertyUsage, string> = {
      PRIMARY_RESIDENCE: 'Vivienda Habitual',
      SECONDARY_RESIDENCE: 'Segunda Residencia',
      RENTAL: 'Alquiler',
      INVESTMENT: 'Inversión',
      VACANT: 'Vacía',
      PROFESSIONAL: 'Uso Profesional'
    };
    return labels[usage];
  };

  const getUsageColor = (usage: PropertyUsage) => {
    const colors: Record<PropertyUsage, string> = {
      PRIMARY_RESIDENCE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      SECONDARY_RESIDENCE: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      RENTAL: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      INVESTMENT: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      VACANT: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400',
      PROFESSIONAL: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
    };
    return colors[usage];
  };

  const primaryPhoto = property.photos.find(p => p.isPrimary) || property.photos[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div
        className="relative h-48 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 cursor-pointer"
        onClick={onView}
      >
        {primaryPhoto && !imageError ? (
          <img
            src={primaryPhoto.url}
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Home className="w-20 h-20 text-gray-400" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
          {getPropertyTypeLabel(property.type)}
        </div>

        {/* Photo Count */}
        {property.photos.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
            📷 {property.photos.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Address */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-green-600 dark:hover:text-green-400 line-clamp-2" onClick={onView}>
          {property.address}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {property.city}, {property.province}
        </p>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Maximize className="w-4 h-4 text-gray-600 dark:text-gray-400 mb-1" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Superficie</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{property.area} m²</span>
          </div>
          {property.rooms && (
            <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Bed className="w-4 h-4 text-gray-600 dark:text-gray-400 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Habitaciones</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{property.rooms}</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Bath className="w-4 h-4 text-gray-600 dark:text-gray-400 mb-1" />
              <span className="text-xs text-gray-600 dark:text-gray-400">Baños</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{property.bathrooms}</span>
            </div>
          )}
        </div>

        {/* Floor */}
        {property.floor && (
          <div className="mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Planta: </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{property.floor}</span>
          </div>
        )}

        {/* Value */}
        {property.currentValue && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor estimado</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(property.currentValue)}
              </span>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Usage Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(property.usage)}`}>
            {getUsageLabel(property.usage)}
          </span>

          {/* Mortgage Badge */}
          {property.hasMortgage ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
              🏦 Hipoteca
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              ✓ Sin Hipoteca
            </span>
          )}

          {/* Insurance Badge */}
          {property.policyId ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              <CheckCircle className="w-3 h-3" />
              Asegurado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              Sin seguro
            </span>
          )}

          {/* Tenant Badge */}
          {property.tenant && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              👤 Alquilado
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Ver
          </button>
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
