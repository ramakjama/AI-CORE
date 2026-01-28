'use client';

import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Property, PropertyFormData, PropertyType, PropertyUsage } from '@/types/assets';

interface PropertyFormProps {
  clientId: string;
  property?: Property | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PropertyForm({ clientId, property, onClose, onSaved }: PropertyFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PropertyFormData>({
    type: property?.type || PropertyType.APARTMENT,
    usage: property?.usage || PropertyUsage.PRIMARY_RESIDENCE,
    address: property?.address || '',
    city: property?.city || '',
    province: property?.province || '',
    postalCode: property?.postalCode || '',
    country: property?.country || 'España',
    cadastralReference: property?.cadastralReference || '',
    area: property?.area || 0,
    rooms: property?.rooms || undefined,
    bathrooms: property?.bathrooms || undefined,
    floor: property?.floor || '',
    purchaseDate: property?.purchaseDate || undefined,
    purchasePrice: property?.purchasePrice || undefined,
    currentValue: property?.currentValue || undefined,
    hasMortgage: property?.hasMortgage || false,
    mortgage: property?.mortgage || undefined,
    characteristics: property?.characteristics || {
      hasElevator: false,
      hasGarage: false,
      hasTerrace: false,
      hasGarden: false,
      hasPool: false,
      hasStorageRoom: false,
      hasAirConditioning: false,
      hasHeating: false
    },
    tenant: property?.tenant || undefined,
    policyId: property?.policyId || '',
    notes: property?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = property
        ? `/api/clients/${clientId}/assets/properties/${property.id}`
        : `/api/clients/${clientId}/assets/properties`;

      const response = await fetch(url, {
        method: property ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSaved();
      } else {
        alert('Error al guardar la propiedad');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar la propiedad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {property ? 'Editar Propiedad' : 'Añadir Propiedad'}
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo *</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required>
                  <option value={PropertyType.APARTMENT}>Piso</option>
                  <option value={PropertyType.HOUSE}>Casa</option>
                  <option value={PropertyType.PENTHOUSE}>Ático</option>
                  <option value={PropertyType.DUPLEX}>Dúplex</option>
                  <option value={PropertyType.STUDIO}>Estudio</option>
                  <option value={PropertyType.COMMERCIAL}>Local Comercial</option>
                  <option value={PropertyType.OFFICE}>Oficina</option>
                  <option value={PropertyType.GARAGE}>Garaje</option>
                  <option value={PropertyType.STORAGE}>Trastero</option>
                  <option value={PropertyType.LAND}>Terreno</option>
                  <option value={PropertyType.BUILDING}>Edificio</option>
                  <option value={PropertyType.OTHER}>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Uso *</label>
                <select value={formData.usage} onChange={(e) => setFormData({ ...formData, usage: e.target.value as PropertyUsage })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required>
                  <option value={PropertyUsage.PRIMARY_RESIDENCE}>Vivienda Habitual</option>
                  <option value={PropertyUsage.SECONDARY_RESIDENCE}>Segunda Residencia</option>
                  <option value={PropertyUsage.RENTAL}>Alquiler</option>
                  <option value={PropertyUsage.INVESTMENT}>Inversión</option>
                  <option value={PropertyUsage.VACANT}>Vacía</option>
                  <option value={PropertyUsage.PROFESSIONAL}>Uso Profesional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dirección *</label>
              <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ciudad *</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Provincia *</label>
                <input type="text" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CP *</label>
                <input type="text" value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Superficie (m²) *</label>
                <input type="number" value={formData.area} onChange={(e) => setFormData({ ...formData, area: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" required min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Habitaciones</label>
                <input type="number" value={formData.rooms || ''} onChange={(e) => setFormData({ ...formData, rooms: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Baños</label>
                <input type="number" value={formData.bathrooms || ''} onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value ? parseInt(e.target.value) : undefined })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" min="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Planta</label>
                <input type="text" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" placeholder="Ej: 3º, Bajo, Ático..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio de Compra</label>
                <input type="number" value={formData.purchasePrice || ''} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor Actual</label>
                <input type="number" value={formData.currentValue || ''} onChange={(e) => setFormData({ ...formData, currentValue: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" step="0.01" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Características</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(formData.characteristics).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={value} onChange={(e) => setFormData({ ...formData, characteristics: { ...formData.characteristics, [key]: e.target.checked } })} className="w-4 h-4 text-green-600 rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1').replace('has ', '')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white" rows={3} />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader className="w-5 h-5 animate-spin" />Guardando...</> : (property ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
