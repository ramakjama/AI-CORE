'use client';

import { useState } from 'react';
import { X, Edit, ChevronLeft, ChevronRight, MapPin, Building } from 'lucide-react';
import { Property } from '@/types/assets';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  onEdit: () => void;
}

export default function PropertyDetailModal({ property, onClose, onEdit }: PropertyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'characteristics' | 'location' | 'insurance' | 'tenant' | 'documents'>('general');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{property.address}</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{property.city}, {property.province}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Edit className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {property.photos.length > 0 && (
          <div className="relative h-80 bg-gray-100 dark:bg-gray-900">
            <img src={property.photos[currentPhotoIndex].url} alt={property.address} className="w-full h-full object-contain" />
            {property.photos.length > 1 && (
              <>
                <button onClick={() => setCurrentPhotoIndex((prev) => (prev - 1 + property.photos.length) % property.photos.length)} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setCurrentPhotoIndex((prev) => (prev + 1) % property.photos.length)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        )}

        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {['general', 'financial', 'characteristics', 'location', 'insurance', 'tenant', 'documents'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === tab ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-600'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && (
            <div className="grid grid-cols-2 gap-6">
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Tipo</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{property.type}</p></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Uso</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{property.usage}</p></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Superficie</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{property.area} m²</p></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Habitaciones</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{property.rooms || '-'}</p></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Baños</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{property.bathrooms || '-'}</p></div>
              <div><label className="text-sm text-gray-600 dark:text-gray-400">Planta</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{property.floor || '-'}</p></div>
              {property.cadastralReference && <div><label className="text-sm text-gray-600 dark:text-gray-400">Referencia Catastral</label><p className="text-lg font-mono font-medium text-gray-900 dark:text-white mt-1">{property.cadastralReference}</p></div>}
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {property.purchaseDate && <div><label className="text-sm text-gray-600">Fecha de Compra</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{formatDate(property.purchaseDate)}</p></div>}
                {property.purchasePrice && <div><label className="text-sm text-gray-600">Precio de Compra</label><p className="text-lg font-medium text-gray-900 dark:text-white mt-1">{formatCurrency(property.purchasePrice)}</p></div>}
                {property.currentValue && <div><label className="text-sm text-gray-600">Valor Actual</label><p className="text-lg font-bold text-green-600 mt-1">{formatCurrency(property.currentValue)}</p></div>}
              </div>
              {property.hasMortgage && property.mortgage && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <h3 className="text-lg font-semibold mb-4">Hipoteca</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-sm text-gray-600">Banco</label><p className="font-medium text-gray-900 dark:text-white">{property.mortgage.bank}</p></div>
                    <div><label className="text-sm text-gray-600">Capital Pendiente</label><p className="font-bold text-red-600">{formatCurrency(property.mortgage.remainingPrincipal)}</p></div>
                    <div><label className="text-sm text-gray-600">Cuota Mensual</label><p className="font-medium text-gray-900 dark:text-white">{formatCurrency(property.mortgage.monthlyPayment)}</p></div>
                    <div><label className="text-sm text-gray-600">Interés</label><p className="font-medium text-gray-900 dark:text-white">{property.mortgage.interestRate}%</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'characteristics' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(property.characteristics).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`text-2xl ${value ? '✓' : '✗'}`}></span>
                  <span className="text-gray-900 dark:text-white">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tenant' && property.tenant && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-4">Información del Inquilino</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-600">Nombre</label><p className="font-medium text-gray-900 dark:text-white">{property.tenant.name}</p></div>
                {property.tenant.email && <div><label className="text-sm text-gray-600">Email</label><p className="font-medium text-gray-900 dark:text-white">{property.tenant.email}</p></div>}
                {property.tenant.phone && <div><label className="text-sm text-gray-600">Teléfono</label><p className="font-medium text-gray-900 dark:text-white">{property.tenant.phone}</p></div>}
                <div><label className="text-sm text-gray-600">Renta Mensual</label><p className="font-bold text-green-600">{formatCurrency(property.tenant.monthlyRent)}</p></div>
                <div><label className="text-sm text-gray-600">Inicio Contrato</label><p className="font-medium text-gray-900 dark:text-white">{formatDate(property.tenant.contractStartDate)}</p></div>
                {property.tenant.contractEndDate && <div><label className="text-sm text-gray-600">Fin Contrato</label><p className="font-medium text-gray-900 dark:text-white">{formatDate(property.tenant.contractEndDate)}</p></div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
