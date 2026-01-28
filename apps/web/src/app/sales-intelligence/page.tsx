'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalOpportunities: number;
  pendingOpportunities: number;
  highPriorityOpportunities: number;
  highRiskChurn: number;
  criticalGaps: number;
}

interface Opportunity {
  id: string;
  partyId: string;
  productName: string;
  productType: string;
  recommendedCoverage: string;
  estimatedPremium: number;
  confidenceScore: number;
  priority: string;
  status: string;
  reasoning: string;
  createdAt: string;
}

export default function SalesIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'gaps' | 'churn'>('opportunities');
  const [stats, setStats] = useState<Stats | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3001/sales-intelligence/dashboard/stats').then(r => r.json()),
      fetch('http://localhost:3001/sales-intelligence/opportunities').then(r => r.json()),
    ])
      .then(([statsData, oppsData]) => {
        setStats(statsData);
        setOpportunities(Array.isArray(oppsData) ? oppsData : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Sales Intelligence</h1>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sales Intelligence</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Total Opportunities</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalOpportunities}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOpportunities}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">High Priority</p>
              <p className="text-3xl font-bold text-orange-600">{stats.highPriorityOpportunities}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">High Risk Churn</p>
              <p className="text-3xl font-bold text-red-600">{stats.highRiskChurn}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-600 mb-2">Critical Gaps</p>
              <p className="text-3xl font-bold text-purple-600">{stats.criticalGaps}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'opportunities'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Opportunities ({opportunities.length})
              </button>
              <button
                onClick={() => setActiveTab('gaps')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'gaps'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Coverage Gaps
              </button>
              <button
                onClick={() => setActiveTab('churn')}
                className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'churn'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Churn Predictions
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'opportunities' && (
              <div className="space-y-4">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{opp.productName}</h3>
                        <p className="text-sm text-gray-600">{opp.productType}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          opp.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          opp.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                          opp.status === 'CONVERTED' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {opp.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          opp.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                          opp.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {opp.priority}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{opp.reasoning}</p>

                    <div className="flex items-center gap-6 text-sm">
                      <span className="text-gray-600">
                        <span className="font-medium">Coverage:</span> {opp.recommendedCoverage}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">Premium:</span> €{opp.estimatedPremium.toLocaleString()}
                      </span>
                      <span className="text-gray-600">
                        <span className="font-medium">Confidence:</span> {Math.round(opp.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>
                ))}

                {opportunities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No opportunities available
                  </div>
                )}
              </div>
            )}

            {activeTab === 'gaps' && (
              <div className="text-center py-8 text-gray-500">
                Coverage gaps data loading...
              </div>
            )}

            {activeTab === 'churn' && (
              <div className="text-center py-8 text-gray-500">
                Churn predictions data loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
