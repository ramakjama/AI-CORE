'use client';

import { useState, useEffect } from 'react';
import { Brain, Loader, TrendingUp, AlertTriangle, Shield, DollarSign, PieChart, Lightbulb } from 'lucide-react';
import { PatrimonyAnalysis as PatrimonyAnalysisType } from '@/types/assets';

interface PatrimonyAnalysisProps {
  clientId: string;
}

export default function PatrimonyAnalysis({ clientId }: PatrimonyAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PatrimonyAnalysisType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/clients/${clientId}/assets/analysis`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        setError('Error al generar el análisis');
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
      setError('Error al generar el análisis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, [clientId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
        <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Generando análisis con IA...</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Esto puede tardar unos segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <p className="text-red-800 dark:text-red-400 text-center mb-4">{error}</p>
        <button
          onClick={loadAnalysis}
          className="mx-auto block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">No hay análisis disponible</p>
        <button
          onClick={loadAnalysis}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Generar Análisis
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" />
          <h3 className="text-2xl font-bold">Análisis Inteligente del Patrimonio</h3>
        </div>
        <p className="text-purple-100">
          Generado el {new Date(analysis.generatedAt).toLocaleString('es-ES')}
        </p>
      </div>

      {/* Executive Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">Resumen Ejecutivo</h4>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
          {analysis.executiveSummary}
        </p>
      </div>

      {/* Strengths and Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Puntos Fuertes</h4>
          </div>
          <ul className="space-y-3">
            {analysis.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span className="text-gray-700 dark:text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Coverage Gaps */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Gaps de Cobertura</h4>
          </div>
          <ul className="space-y-3">
            {analysis.coverageGaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-600 font-bold mt-1">⚠</span>
                <span className="text-gray-700 dark:text-gray-300">{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Insurance Recommendations */}
      {analysis.insuranceRecommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recomendaciones de Seguros
            </h4>
          </div>
          <div className="space-y-4">
            {analysis.insuranceRecommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded mb-2">
                      {rec.assetType}
                    </span>
                    <h5 className="font-semibold text-gray-900 dark:text-white">{rec.assetName}</h5>
                  </div>
                  {rec.estimatedPremium && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Prima estimada</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(rec.estimatedPremium)}/año
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{rec.recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tax Optimization */}
      {analysis.taxOptimizationOpportunities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-600" />
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
              Oportunidades de Optimización Fiscal
            </h4>
          </div>
          <ul className="space-y-3">
            {analysis.taxOptimizationOpportunities.map((opportunity, index) => (
              <li key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Lightbulb className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{opportunity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diversification Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <PieChart className="w-6 h-6 text-purple-600" />
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
            Análisis de Diversificación
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Current Allocation */}
          <div>
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Asignación Actual</h5>
            <div className="space-y-2">
              {analysis.diversificationAnalysis.currentAllocation.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.category}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Allocation */}
          <div>
            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Asignación Recomendada</h5>
            <div className="space-y-2">
              {analysis.diversificationAnalysis.recommendedAllocation.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{item.category}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div>
          <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Sugerencias</h5>
          <ul className="space-y-2">
            {analysis.diversificationAnalysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-purple-600 font-bold mt-1">•</span>
                <span className="text-gray-700 dark:text-gray-300">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={loadAnalysis}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Brain className="w-4 h-4" />
          Regenerar Análisis
        </button>
        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          Exportar a PDF
        </button>
      </div>
    </div>
  );
}
