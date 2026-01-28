'use client';

import { TrendingUp, TrendingDown, Edit, Trash2, Calendar } from 'lucide-react';
import { Investment, InvestmentType, RiskLevel } from '@/types/assets';

interface InvestmentCardProps {
  investment: Investment;
  onEdit: () => void;
  onDelete: () => void;
}

export default function InvestmentCard({ investment, onEdit, onDelete }: InvestmentCardProps) {
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('es-ES');

  const returnRate = investment.returnRate || ((investment.currentValue - investment.principalAmount) / investment.principalAmount * 100);
  const isPositive = returnRate >= 0;

  const getTypeIcon = (type: InvestmentType) => {
    const icons: Record<InvestmentType, string> = {
      STOCKS: '📈',
      BONDS: '💰',
      MUTUAL_FUNDS: '📊',
      ETF: '🔷',
      DEPOSIT: '🏦',
      CRYPTOCURRENCY: '₿',
      REAL_ESTATE_FUND: '🏘️',
      PENSION_PLAN: '👴',
      LIFE_INSURANCE_INVESTMENT: '🛡️',
      OTHER: '💼'
    };
    return icons[type];
  };

  const getRiskColor = (risk: RiskLevel) => {
    const colors: Record<RiskLevel, string> = {
      LOW: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      MEDIUM: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      HIGH: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
      VERY_HIGH: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    };
    return colors[risk];
  };

  const getRiskLabel = (risk: RiskLevel) => {
    const labels: Record<RiskLevel, string> = {
      LOW: 'Riesgo Bajo',
      MEDIUM: 'Riesgo Medio',
      HIGH: 'Riesgo Alto',
      VERY_HIGH: 'Riesgo Muy Alto'
    };
    return labels[risk];
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{getTypeIcon(investment.type)}</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{investment.productName}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{investment.financialEntity}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Invertido</span>
            <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(investment.principalAmount)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Valor Actual</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(investment.currentValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Rendimiento</span>
            <div className="flex items-center gap-2">
              {isPositive ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{returnRate.toFixed(2)}%
              </span>
            </div>
          </div>
          {investment.maturityDate && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Vencimiento</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(investment.maturityDate)}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(investment.riskLevel)}`}>
            {getRiskLabel(investment.riskLevel)}
          </span>
        </div>

        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
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
