'use client';

import { useState } from 'react';
import { Car, Edit, Trash2, Eye, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import { Vehicle, VehicleType, VehicleFuelType } from '@/types/assets';

interface VehicleCardProps {
  vehicle: Vehicle;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function VehicleCard({ vehicle, onView, onEdit, onDelete }: VehicleCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getVehicleTypeLabel = (type: VehicleType) => {
    const labels: Record<VehicleType, string> = {
      CAR: 'Turismo',
      MOTORCYCLE: 'Motocicleta',
      VAN: 'Furgoneta',
      TRUCK: 'Camión',
      CAMPER: 'Autocaravana',
      BOAT: 'Embarcación',
      OTHER: 'Otro'
    };
    return labels[type];
  };

  const getFuelTypeLabel = (fuelType: VehicleFuelType) => {
    const labels: Record<VehicleFuelType, string> = {
      GASOLINE: 'Gasolina',
      DIESEL: 'Diésel',
      ELECTRIC: 'Eléctrico',
      HYBRID: 'Híbrido',
      PLUGIN_HYBRID: 'Híbrido Enchufable',
      GAS: 'Gas',
      HYDROGEN: 'Hidrógeno'
    };
    return labels[fuelType];
  };

  const getFuelTypeIcon = (fuelType: VehicleFuelType) => {
    if (fuelType === 'ELECTRIC') return '⚡';
    if (fuelType === 'HYBRID' || fuelType === 'PLUGIN_HYBRID') return '🔋';
    return '⛽';
  };

  const isItvExpiringSoon = () => {
    if (!vehicle.itvExpiryDate) return false;
    const expiryDate = new Date(vehicle.itvExpiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isItvExpired = () => {
    if (!vehicle.itvExpiryDate) return false;
    return new Date(vehicle.itvExpiryDate) < new Date();
  };

  const primaryPhoto = vehicle.photos.find(p => p.isPrimary) || vehicle.photos[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Image */}
      <div
        className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 cursor-pointer"
        onClick={onView}
      >
        {primaryPhoto && !imageError ? (
          <img
            src={primaryPhoto.url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Car className="w-20 h-20 text-gray-400" />
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
          {getVehicleTypeLabel(vehicle.type)}
        </div>

        {/* Photo Count */}
        {vehicle.photos.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-white">
            📷 {vehicle.photos.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand and Model */}
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={onView}>
          {vehicle.brand} {vehicle.model}
        </h3>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Año</span>
            <span className="font-medium text-gray-900 dark:text-white">{vehicle.year}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Matrícula</span>
            <span className="font-mono font-medium text-gray-900 dark:text-white">
              {vehicle.licensePlate}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Combustible</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {getFuelTypeIcon(vehicle.fuelType)} {getFuelTypeLabel(vehicle.fuelType)}
            </span>
          </div>

          {vehicle.mileage && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Kilómetros</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {vehicle.mileage.toLocaleString('es-ES')} km
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        {vehicle.currentValue && (
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Valor estimado</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(vehicle.currentValue)}
              </span>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Insurance Badge */}
          {vehicle.policyId ? (
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

          {/* ITV Badge */}
          {vehicle.itvExpiryDate && (
            <>
              {isItvExpired() ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">
                  <AlertCircle className="w-3 h-3" />
                  ITV Caducada
                </span>
              ) : isItvExpiringSoon() ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                  <Calendar className="w-3 h-3" />
                  ITV Próxima
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  ITV Vigente
                </span>
              )}
            </>
          )}

          {/* Financing Badge */}
          {vehicle.isFinanced && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
              Financiado
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
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
