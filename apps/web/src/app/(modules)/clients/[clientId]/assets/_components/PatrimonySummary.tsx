'use client';

import { Car, Home, Gem, TrendingUp, Euro } from 'lucide-react';
import { AssetSummary } from '@/types/assets';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PatrimonySummaryProps {
  summary: AssetSummary;
}

export default function PatrimonySummary({ summary }: PatrimonySummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Pie Chart Data
  const pieChartData = {
    labels: summary.distribution.map(d => d.label),
    datasets: [
      {
        data: summary.distribution.map(d => d.value),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(34, 197, 94, 0.8)',  // green
          'rgba(168, 85, 247, 0.8)', // purple
          'rgba(251, 146, 60, 0.8)'  // orange
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(168, 85, 247, 1)',
          'rgba(251, 146, 60, 1)'
        ],
        borderWidth: 2
      }
    ]
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = summary.distribution[context.dataIndex].percentage;
            return `${label}: ${formatCurrency(value)} (${formatPercentage(percentage)})`;
          }
        }
      }
    }
  };

  // Line Chart Data
  const lineChartData = {
    labels: summary.evolution.map(e =>
      new Date(e.date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    ),
    datasets: [
      {
        label: 'Valor del Patrimonio',
        data: summary.evolution.map(e => e.value),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Valor: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Patrimony */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white col-span-1 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <Euro className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-sm font-medium opacity-90 mb-1">Patrimonio Total</h3>
          <p className="text-3xl font-bold">{formatCurrency(summary.totalValue)}</p>
        </div>

        {/* Vehicles */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Car className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{summary.vehicles.count}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Vehículos</h3>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.vehicles.totalValue)}
          </p>
        </div>

        {/* Properties */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Home className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{summary.properties.count}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Propiedades</h3>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.properties.totalValue)}
          </p>
        </div>

        {/* Valuables */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <Gem className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">{summary.valuables.count}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Objetos de Valor</h3>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.valuables.totalValue)}
          </p>
        </div>

        {/* Investments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{summary.investments.count}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Inversiones</h3>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {formatCurrency(summary.investments.totalValue)}
          </p>
          {summary.investments.totalReturn !== 0 && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-gray-500">Rentabilidad:</span>
              <span className={`text-sm font-semibold ${summary.investments.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.investments.totalReturn >= 0 ? '+' : ''}{formatPercentage(summary.investments.totalReturn)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribución del Patrimonio
          </h3>
          <div className="h-80">
            <Pie data={pieChartData} options={pieChartOptions} />
          </div>
          <div className="mt-4 space-y-2">
            {summary.distribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="text-gray-500">
                    {formatPercentage(item.percentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Evolución del Patrimonio
          </h3>
          <div className="h-80">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Valor Inicial</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {summary.evolution.length > 0 ? formatCurrency(summary.evolution[0].value) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Valor Actual</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(summary.totalValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Crecimiento</p>
              {summary.evolution.length > 0 && (
                <p className={`text-sm font-semibold ${
                  summary.totalValue >= summary.evolution[0].value ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.totalValue >= summary.evolution[0].value ? '+' : ''}
                  {formatPercentage(
                    ((summary.totalValue - summary.evolution[0].value) / summary.evolution[0].value) * 100
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
