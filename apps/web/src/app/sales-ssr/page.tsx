async function getStats() {
  try {
    const res = await fetch('http://localhost:3001/sales-intelligence/dashboard/stats', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

async function getOpportunities() {
  try {
    const res = await fetch('http://localhost:3001/sales-intelligence/opportunities', {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function SalesSSRPage() {
  const [stats, opportunities] = await Promise.all([getStats(), getOpportunities()]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Sales Intelligence (SSR Version)</h1>

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

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Opportunities ({opportunities.length})</h2>

          <div className="space-y-4">
            {opportunities.map((opp: any) => (
              <div key={opp.id} className="border border-gray-200 rounded-lg p-4">
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
                    <strong>Coverage:</strong> {opp.recommendedCoverage}
                  </span>
                  <span className="text-gray-600">
                    <strong>Premium:</strong> €{opp.estimatedPremium}
                  </span>
                  <span className="text-gray-600">
                    <strong>Confidence:</strong> {(opp.confidenceScore * 100).toFixed(0)}%
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
        </div>
      </div>
    </div>
  );
}
