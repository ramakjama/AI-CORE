'use client';

import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Valuable, ValuableFormData, ValuableType } from '@/types/assets';

interface ValuableFormProps {
  clientId: string;
  valuable?: Valuable | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ValuableForm({ clientId, valuable, onClose, onSaved }: ValuableFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ValuableFormData>({
    type: valuable?.type || ValuableType.JEWELRY,
    description: valuable?.description || '',
    brand: valuable?.brand || '',
    artist: valuable?.artist || '',
    model: valuable?.model || '',
    serialNumber: valuable?.serialNumber || '',
    acquisitionDate: valuable?.acquisitionDate || undefined,
    purchasePrice: valuable?.purchasePrice || undefined,
    currentValue: valuable?.currentValue || undefined,
    location: valuable?.location || '',
    policyId: valuable?.policyId || '',
    notes: valuable?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = valuable ? `/api/clients/${clientId}/assets/valuables/${valuable.id}` : `/api/clients/${clientId}/assets/valuables`;
      const response = await fetch(url, { method: valuable ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) onSaved();
      else alert('Error al guardar');
    } catch (error) {
      alert('Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{valuable ? 'Editar' : 'Añadir'} Objeto de Valor</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as ValuableType })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required>
                <option value={ValuableType.JEWELRY}>Joya</option>
                <option value={ValuableType.ART}>Obra de Arte</option>
                <option value={ValuableType.WATCH}>Reloj</option>
                <option value={ValuableType.ANTIQUE}>Antigüedad</option>
                <option value={ValuableType.COLLECTION}>Colección</option>
                <option value={ValuableType.MUSICAL_INSTRUMENT}>Instrumento Musical</option>
                <option value={ValuableType.ELECTRONICS}>Electrónica</option>
                <option value={ValuableType.OTHER}>Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descripción *</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" rows={3} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Marca</label>
                <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Artista/Autor</label>
                <input type="text" value={formData.artist} onChange={(e) => setFormData({ ...formData, artist: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Precio de Compra</label>
                <input type="number" value={formData.purchasePrice || ''} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valor Actual</label>
                <input type="number" value={formData.currentValue || ''} onChange={(e) => setFormData({ ...formData, currentValue: e.target.value ? parseFloat(e.target.value) : undefined })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" step="0.01" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ubicación</label>
              <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" placeholder="Dónde se guarda..." />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">
              {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : (valuable ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
