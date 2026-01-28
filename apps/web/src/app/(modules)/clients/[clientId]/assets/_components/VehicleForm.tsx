'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Loader, Sparkles } from 'lucide-react';
import { Vehicle, VehicleFormData, VehicleType, VehicleFuelType, VehicleUsage } from '@/types/assets';

interface VehicleFormProps {
  clientId: string;
  vehicle?: Vehicle | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function VehicleForm({ clientId, vehicle, onClose, onSaved }: VehicleFormProps) {
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    type: vehicle?.type || VehicleType.CAR,
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || new Date().getFullYear(),
    licensePlate: vehicle?.licensePlate || '',
    vin: vehicle?.vin || '',
    fuelType: vehicle?.fuelType || VehicleFuelType.GASOLINE,
    mileage: vehicle?.mileage || undefined,
    color: vehicle?.color || '',
    purchaseDate: vehicle?.purchaseDate || undefined,
    purchasePrice: vehicle?.purchasePrice || undefined,
    isFinanced: vehicle?.isFinanced || false,
    financingEntity: vehicle?.financingEntity || '',
    remainingDebt: vehicle?.remainingDebt || undefined,
    usage: vehicle?.usage || VehicleUsage.PRIVATE,
    location: vehicle?.location || '',
    policyId: vehicle?.policyId || '',
    itvExpiryDate: vehicle?.itvExpiryDate || undefined,
    notes: vehicle?.notes || ''
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add photos
      photos.forEach(photo => {
        formDataToSend.append('photos', photo);
      });

      // Add documents
      documents.forEach(doc => {
        formDataToSend.append('documents', doc);
      });

      const url = vehicle
        ? `/api/clients/${clientId}/assets/vehicles/${vehicle.id}`
        : `/api/clients/${clientId}/assets/vehicles`;

      const response = await fetch(url, {
        method: vehicle ? 'PUT' : 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        onSaved();
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Error al guardar el vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateValue = async () => {
    if (!formData.brand || !formData.model || !formData.year) {
      alert('Por favor, completa marca, modelo y año para estimar el valor');
      return;
    }

    setEstimating(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/assets/vehicles/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          mileage: formData.mileage,
          fuelType: formData.fuelType,
          condition: 'good'
        })
      });

      if (response.ok) {
        const { estimatedValue } = await response.json();
        setFormData(prev => ({ ...prev, purchasePrice: estimatedValue }));
      }
    } catch (error) {
      console.error('Error estimating value:', error);
    } finally {
      setEstimating(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {vehicle ? 'Editar Vehículo' : 'Añadir Vehículo'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Vehículo *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as VehicleType })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value={VehicleType.CAR}>Turismo</option>
                <option value={VehicleType.MOTORCYCLE}>Motocicleta</option>
                <option value={VehicleType.VAN}>Furgoneta</option>
                <option value={VehicleType.TRUCK}>Camión</option>
                <option value={VehicleType.CAMPER}>Autocaravana</option>
                <option value={VehicleType.BOAT}>Embarcación</option>
                <option value={VehicleType.OTHER}>Otro</option>
              </select>
            </div>

            {/* Brand and Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Marca *
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Toyota, BMW, Mercedes..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Modelo *
                </label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Ej: Corolla, Serie 3, Clase C..."
                  required
                />
              </div>
            </div>

            {/* Year and License Plate */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Año *
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matrícula *
                </label>
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                  placeholder="1234ABC"
                  required
                />
              </div>
            </div>

            {/* VIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                VIN (Número de Bastidor)
              </label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono"
                placeholder="17 caracteres"
                maxLength={17}
              />
            </div>

            {/* Fuel Type and Mileage */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Combustible *
                </label>
                <select
                  value={formData.fuelType}
                  onChange={(e) => setFormData({ ...formData, fuelType: e.target.value as VehicleFuelType })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value={VehicleFuelType.GASOLINE}>Gasolina</option>
                  <option value={VehicleFuelType.DIESEL}>Diésel</option>
                  <option value={VehicleFuelType.ELECTRIC}>Eléctrico</option>
                  <option value={VehicleFuelType.HYBRID}>Híbrido</option>
                  <option value={VehicleFuelType.PLUGIN_HYBRID}>Híbrido Enchufable</option>
                  <option value={VehicleFuelType.GAS}>Gas</option>
                  <option value={VehicleFuelType.HYDROGEN}>Hidrógeno</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kilómetros
                </label>
                <input
                  type="number"
                  value={formData.mileage || ''}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Color and Usage */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Blanco, Negro, Rojo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Uso *
                </label>
                <select
                  value={formData.usage}
                  onChange={(e) => setFormData({ ...formData, usage: e.target.value as VehicleUsage })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value={VehicleUsage.PRIVATE}>Uso Privado</option>
                  <option value={VehicleUsage.PROFESSIONAL}>Uso Profesional</option>
                  <option value={VehicleUsage.MIXED}>Uso Mixto</option>
                </select>
              </div>
            </div>

            {/* Purchase Date and Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Compra
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate ? new Date(formData.purchaseDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precio de Compra
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <button
                    type="button"
                    onClick={handleEstimateValue}
                    disabled={estimating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Estimar valor con IA"
                  >
                    {estimating ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Financing */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFinanced}
                  onChange={(e) => setFormData({ ...formData, isFinanced: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehículo financiado
                </span>
              </label>
            </div>

            {formData.isFinanced && (
              <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-blue-500">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entidad Financiera
                  </label>
                  <input
                    type="text"
                    value={formData.financingEntity}
                    onChange={(e) => setFormData({ ...formData, financingEntity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Banco, financiera..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Deuda Restante
                  </label>
                  <input
                    type="number"
                    value={formData.remainingDebt || ''}
                    onChange={(e) => setFormData({ ...formData, remainingDebt: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ubicación Habitual
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Garaje, calle, ciudad..."
              />
            </div>

            {/* ITV Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Caducidad ITV
              </label>
              <input
                type="date"
                value={formData.itvExpiryDate ? new Date(formData.itvExpiryDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, itvExpiryDate: e.target.value ? new Date(e.target.value) : undefined })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Policy ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ID de Póliza de Seguro
              </label>
              <input
                type="text"
                value={formData.policyId}
                onChange={(e) => setFormData({ ...formData, policyId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Link con póliza existente"
              />
            </div>

            {/* Photos Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fotos del Vehículo
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="photos"
                />
                <label htmlFor="photos" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click para subir fotos o arrastra aquí
                  </p>
                  {photos.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      {photos.length} foto(s) seleccionada(s)
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Documents Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Documentos (ITV, permisos, facturas...)
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleDocumentChange}
                  className="hidden"
                  id="documents"
                />
                <label htmlFor="documents" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click para subir documentos o arrastra aquí
                  </p>
                  {documents.length > 0 && (
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                      {documents.length} documento(s) seleccionado(s)
                    </p>
                  )}
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                rows={4}
                placeholder="Información adicional sobre el vehículo..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                vehicle ? 'Actualizar Vehículo' : 'Guardar Vehículo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
