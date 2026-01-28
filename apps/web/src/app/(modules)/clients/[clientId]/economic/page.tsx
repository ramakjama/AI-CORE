'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  AlertTriangle,
  PieChart,
  BarChart3
} from 'lucide-react';

interface EconomicInfo {
  monthlyIncome: number;
  annualIncome: number;
  incomeSource: string;
  secondaryIncome?: number;
  secondaryIncomeSource?: string;

  monthlyExpenses: number;
  fixedExpenses: number;
  variableExpenses: number;

  paymentCapacity: number;
  availableIncome: number;

  debts: {
    id: string;
    type: string;
    creditor: string;
    amount: number;
    monthlyPayment: number;
    remainingBalance: number;
    interestRate: number;
    endDate?: string;
  }[];

  totalDebt: number;
  debtToIncomeRatio: number;
  economicRiskLevel: 'low' | 'medium' | 'high';

  savingsCapacity: number;
  financialHealthScore: number;
}

export default function EconomicPage() {
  const params = useParams();
  const clientId = params.clientId as string;

  const [economicInfo, setEconomicInfo] = useState<EconomicInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEconomicInfo();
  }, [clientId]);

  const loadEconomicInfo = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/economic`);
      if (response.ok) {
        const data = await response.json();
        setEconomicInfo(data);
      }
    } catch (error) {
      console.error('Error loading economic info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!economicInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            No se encontró información económica
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Situación Económica
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ingresos, gastos, capacidad de pago y deudas
          </p>
        </div>
        <div className="flex gap-3">
          <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getRiskColor(economicInfo.economicRiskLevel)}`}>
            Riesgo Económico: {economicInfo.economicRiskLevel === 'low' ? 'Bajo' : economicInfo.economicRiskLevel === 'medium' ? 'Medio' : 'Alto'}
          </span>
        </div>
      </div>

      {/* Financial Health Score */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-2">Puntuación de Salud Financiera</h3>
            <div className="text-5xl font-bold mb-2">{economicInfo.financialHealthScore}/100</div>
            <p className="text-blue-100">
              {economicInfo.financialHealthScore >= 80
                ? 'Excelente situación financiera'
                : economicInfo.financialHealthScore >= 60
                ? 'Buena situación financiera'
                : economicInfo.financialHealthScore >= 40
                ? 'Situación financiera regular'
                : 'Situación financiera delicada'}
            </p>
          </div>
          <div className="relative w-32 h-32">
            <svg className="transform -rotate-90 w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/20"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - economicInfo.financialHealthScore / 100)}`}
                className="text-white transition-all duration-1000"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Income Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatCurrency(economicInfo.monthlyIncome)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Ingresos Mensuales
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {economicInfo.incomeSource}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatCurrency(economicInfo.monthlyExpenses)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Gastos Mensuales
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatCurrency(economicInfo.availableIncome)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Ingreso Disponible
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {formatCurrency(economicInfo.paymentCapacity)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Capacidad de Pago
          </div>
        </div>
      </div>

      {/* Income Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Desglose de Ingresos
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingreso Principal</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{economicInfo.incomeSource}</p>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(economicInfo.monthlyIncome)}
              </p>
            </div>

            {economicInfo.secondaryIncome && economicInfo.secondaryIncome > 0 && (
              <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ingreso Secundario</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{economicInfo.secondaryIncomeSource}</p>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(economicInfo.secondaryIncome)}
                </p>
              </div>
            )}

            <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-t-2 border-green-600">
              <p className="font-semibold text-gray-900 dark:text-white">Total Anual</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(economicInfo.annualIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            Desglose de Gastos
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Gastos Fijos</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(economicInfo.fixedExpenses)}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Gastos Variables</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(economicInfo.variableExpenses)}
              </p>
            </div>

            <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg border-t-2 border-red-600">
              <p className="font-semibold text-gray-900 dark:text-white">Total Mensual</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(economicInfo.monthlyExpenses)}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Capacidad de Ahorro</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(economicInfo.savingsCapacity)}
                </p>
              </div>
              <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${(economicInfo.savingsCapacity / economicInfo.monthlyIncome) * 100}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-600" />
            Deudas Actuales
          </h3>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Deuda Total</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(economicInfo.totalDebt)}</p>
          </div>
        </div>

        {economicInfo.debts.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Sin deudas registradas
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              El cliente no tiene deudas activas
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {economicInfo.debts.map((debt) => (
              <div
                key={debt.id}
                className="p-5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {debt.type}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {debt.creditor}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-sm font-medium rounded-full">
                    {debt.interestRate}% interés
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Saldo Pendiente</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(debt.remainingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cuota Mensual</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(debt.monthlyPayment)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monto Original</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(debt.amount)}
                    </p>
                  </div>
                </div>

                {debt.endDate && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Vencimiento: {new Date(debt.endDate).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debt to Income Ratio */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Ratio Deuda/Ingreso
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Nivel de Endeudamiento</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {(economicInfo.debtToIncomeRatio * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  economicInfo.debtToIncomeRatio < 0.3
                    ? 'bg-green-600'
                    : economicInfo.debtToIncomeRatio < 0.5
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(economicInfo.debtToIncomeRatio * 100, 100)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-500">
              <span>0%</span>
              <span>30% (Óptimo)</span>
              <span>50% (Límite)</span>
              <span>100%</span>
            </div>
          </div>
          <div className="text-center">
            {economicInfo.debtToIncomeRatio < 0.3 ? (
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            ) : economicInfo.debtToIncomeRatio < 0.5 ? (
              <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center mb-2">
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-2">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {economicInfo.debtToIncomeRatio < 0.3
                ? 'Saludable'
                : economicInfo.debtToIncomeRatio < 0.5
                ? 'Moderado'
                : 'Alto Riesgo'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
