'use client';

import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { Investment, InvestmentFormData, InvestmentType, RiskLevel } from '@/types/assets';

interface InvestmentFormProps {
  clientId: string;
  investment?: Investment | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function InvestmentForm({ clientId, investment, onClose, onSaved }: InvestmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<InvestmentFormData>({
    type: investment?.type || InvestmentType.STOCKS,
    productName: investment?.productName || '',
    financialEntity: investment?.financialEntity || '',
    investmentDate: investment?.investmentDate || new Date(),
    principalAmount: investment?.principalAmount || 0,
    currentValue: investment?.currentValue || 0,
    maturityDate: investment?.maturityDate || undefined,
    riskLevel: investment?.riskLevel || RiskLevel.MEDIUM,
    notes: investment?.notes || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = investment ? `/api/clients/${clientId}/assets/investments/${investment.id}` : `/api/clients/${clientId}/assets/investments`;
      const response = await fetch(url, { method: investment ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{investment ? 'Editar' : 'Añadir'} Inversión</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo *</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as InvestmentType })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required>
                <option value={InvestmentType.STOCKS}>Acciones</option>
                <option value={InvestmentType.BONDS}>Bonos</option>
                <option value={InvestmentType.MUTUAL_FUNDS}>Fondos de Inversión</option>
                <option value={InvestmentType.ETF}>ETF</option>
                <option value={InvestmentType.DEPOSIT}>Depósito</option>
                <option value={InvestmentType.CRYPTOCURRENCY}>Criptomonedas</option>
                <option value={InvestmentType.REAL_ESTATE_FUND}>Fondo Inmobiliario</option>
                <option value={InvestmentType.PENSION_PLAN}>Plan de Pensiones</option>
                <option value={InvestmentType.LIFE_INSURANCE_INVESTMENT}>Seguro de Vida Inversión</option>
                <option value={InvestmentType.OTHER}>Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nombre del Producto *</label>
              <input type="text" value={formData.productName} onChange={(e) => setFormData({ ...formData, productName: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Entidad Financiera *</label>
              <input type="text" value={formData.financialEntity} onChange={(e) => setFormData({ ...formData, financialEntity: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Inversión *</label>
                <input type="date" value={new Date(formData.investmentDate).toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, investmentDate: new Date(e.target.value) })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha de Vencimiento</label>
                <input type="date" value={formData.maturityDate ? new Date(formData.maturityDate).toISOString().split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value ? new Date(e.target.value) : undefined })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Capital Invertido *</label>
                <input type="number" value={formData.principalAmount} onChange={(e) => setFormData({ ...formData, principalAmount: parseFloat(e.target.value) })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" step="0.01" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Valor Actual *</label>
                <input type="number" value={formData.currentValue} onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" step="0.01" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nivel de Riesgo *</label>
              <select value={formData.riskLevel} onChange={(e) => setFormData({ ...formData, riskLevel: e.target.value as RiskLevel })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" required>
                <option value={RiskLevel.LOW}>Bajo</option>
                <option value={RiskLevel.MEDIUM}>Medio</option>
                <option value={RiskLevel.HIGH}>Alto</option>
                <option value={RiskLevel.VERY_HIGH}>Muy Alto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notas</label>
              <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700" rows={3} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 rounded-lg">Cancelar</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg disabled:opacity-50">
              {loading ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : (investment ? 'Actualizar' : 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
