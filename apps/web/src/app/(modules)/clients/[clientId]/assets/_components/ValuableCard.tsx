'use client';

import { Gem, Edit, Trash2 } from 'lucide-react';
import { Valuable, ValuableType } from '@/types/assets';

interface ValuableCardProps {
  valuable: Valuable;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ValuableCard({ valuable, onEdit, onDelete }: ValuableCardProps) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount);

  const getTypeIcon = (type: ValuableType) => {
    const icons: Record<ValuableType, string> = {
      JEWELRY: '💎',
      ART: '🎨',
      WATCH: '⌚',
      ANTIQUE: '🏺',
      COLLECTION: '🗂️',
      MUSICAL_INSTRUMENT: '🎸',
      ELECTRONICS: '💻',
      OTHER: '📦'
    };
    return icons[type];
  };

  const getTypeLabel = (type: ValuableType) => {
    const labels: Record<ValuableType, string> = {
      JEWELRY: 'Joya',
      ART: 'Arte',
      WATCH: 'Reloj',
      ANTIQUE: 'Antigüedad',
      COLLECTION: 'Colección',
      MUSICAL_INSTRUMENT: 'Instrumento Musical',
      ELECTRONICS: 'Electrónica',
      OTHER: 'Otro'
    };
    return labels[type];
  };

  const primaryPhoto = valuable.photos.find(p => p.isPrimary) || valuable.photos[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      <div className="relative h-40 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
        {primaryPhoto ? (
          <img src={primaryPhoto.url} alt={valuable.description} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full text-6xl">{getTypeIcon(valuable.type)}</div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">{getTypeLabel(valuable.type)}</div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{valuable.description}</h3>
        {(valuable.brand || valuable.artist) && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{valuable.brand || valuable.artist}</p>
        )}
        {valuable.currentValue && (
          <div className="mb-4">
            <span className="text-xs text-gray-500">Valor estimado</span>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{formatCurrency(valuable.currentValue)}</p>
          </div>
        )}
        {valuable.policyId && (
          <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium mb-3">✓ Asegurado</span>
        )}
        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Edit className="w-4 h-4" />Editar
          </button>
          <button onClick={onDelete} className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
