'use client';

import { useState } from 'react';
import { X, Edit, ChevronLeft, ChevronRight, Calendar, MapPin, Euro, FileText, Wrench } from 'lucide-react';
import { Vehicle, VehicleType, VehicleFuelType, VehicleUsage } from '@/types/assets';

interface VehicleDetailModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onEdit: () => void;
}

export default function VehicleDetailModal({ vehicle, onClose, onEdit }: VehicleDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'insurance' | 'maintenance' | 'documents'>('general');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  const getUsageLabel = (usage: VehicleUsage) => {
    const labels: Record<VehicleUsage, string> = {
      PRIVATE: 'Uso Privado',
      PROFESSIONAL: 'Uso Profesional',
      MIXED: 'Uso Mixto'
    };
    return labels[usage];
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % vehicle.photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + vehicle.photos.length) % vehicle.photos.length);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {vehicle.year} • {vehicle.licensePlate}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Photo Gallery */}
        {vehicle.photos.length > 0 && (
          <div className="relative h-80 bg-gray-100 dark:bg-gray-900">
            <img
              src={vehicle.photos[currentPhotoIndex].url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-full object-contain"
            />
            {vehicle.photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {vehicle.photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentPhotoIndex
                          ? 'bg-white w-8'
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'general'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('financial')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'financial'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Financiero
          </button>
          <button
            onClick={() => setActiveTab('insurance')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'insurance'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Seguro
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'maintenance'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Mantenimiento
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
              activeTab === 'documents'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Documentos
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Tipo de Vehículo</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    {getVehicleTypeLabel(vehicle.type)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Marca</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{vehicle.brand}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Modelo</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{vehicle.model}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Año</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{vehicle.year}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Matrícula</label>
                  <p className="text-lg font-mono font-medium text-gray-900 dark:text-white mt-1">
                    {vehicle.licensePlate}
                  </p>
                </div>
                {vehicle.vin && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">VIN</label>
                    <p className="text-lg font-mono font-medium text-gray-900 dark:text-white mt-1">
                      {vehicle.vin}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Combustible</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    {getFuelTypeLabel(vehicle.fuelType)}
                  </p>
                </div>
                {vehicle.mileage && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Kilómetros</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                      {vehicle.mileage.toLocaleString('es-ES')} km
                    </p>
                  </div>
                )}
                {vehicle.color && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Color</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{vehicle.color}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Uso</label>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                    {getUsageLabel(vehicle.usage)}
                  </p>
                </div>
                {vehicle.location && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Ubicación habitual</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{vehicle.location}</p>
                  </div>
                )}
                {vehicle.itvExpiryDate && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Fecha ITV</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                      {formatDate(vehicle.itvExpiryDate)}
                    </p>
                  </div>
                )}
              </div>

              {vehicle.notes && (
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400">Notas</label>
                  <p className="text-gray-900 dark:text-white mt-2 whitespace-pre-wrap">{vehicle.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {vehicle.purchaseDate && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Fecha de Compra</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                      {formatDate(vehicle.purchaseDate)}
                    </p>
                  </div>
                )}
                {vehicle.purchasePrice && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Precio de Compra</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                      {formatCurrency(vehicle.purchasePrice)}
                    </p>
                  </div>
                )}
                {vehicle.currentValue && (
                  <div>
                    <label className="text-sm text-gray-600 dark:text-gray-400">Valor Actual Estimado</label>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {formatCurrency(vehicle.currentValue)}
                    </p>
                  </div>
                )}
              </div>

              {vehicle.isFinanced && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información de Financiación
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {vehicle.financingEntity && (
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">Entidad Financiera</label>
                        <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                          {vehicle.financingEntity}
                        </p>
                      </div>
                    )}
                    {vehicle.remainingDebt !== undefined && (
                      <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">Deuda Restante</label>
                        <p className="text-base font-bold text-red-600 dark:text-red-400 mt-1">
                          {formatCurrency(vehicle.remainingDebt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {vehicle.purchasePrice && vehicle.currentValue && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Depreciación
                  </h3>
                  <p className={`text-2xl font-bold ${
                    vehicle.currentValue >= vehicle.purchasePrice
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {vehicle.currentValue >= vehicle.purchasePrice ? '+' : ''}
                    {formatCurrency(vehicle.currentValue - vehicle.purchasePrice)}
                    {' '}
                    ({((vehicle.currentValue - vehicle.purchasePrice) / vehicle.purchasePrice * 100).toFixed(1)}%)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Insurance Tab */}
          {activeTab === 'insurance' && (
            <div className="space-y-6">
              {vehicle.policyId ? (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800 text-center">
                  <div className="text-green-600 dark:text-green-400 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Vehículo Asegurado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    ID de Póliza: {vehicle.policyId}
                  </p>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Ver Póliza Completa
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800 text-center">
                  <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Sin Seguro
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Este vehículo no tiene ningún seguro asociado
                  </p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Contratar Seguro
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              {vehicle.maintenanceHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Taller
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Kilómetros
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Coste
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {vehicle.maintenanceHistory.map((record, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatDate(record.date)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                            {record.description}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.workshop || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {record.mileage ? `${record.mileage.toLocaleString('es-ES')} km` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                            {formatCurrency(record.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay historial de mantenimiento registrado
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {vehicle.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicle.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FileText className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{doc.type}</p>
                        {doc.expiresAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Caduca: {formatDate(doc.expiresAt)}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay documentos adjuntos
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
