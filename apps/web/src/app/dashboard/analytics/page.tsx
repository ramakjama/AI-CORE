'use client';

import { useState } from 'react';

interface Metric {
  id: string;
  label: string;
  value: string;
  change: number;
  icon: 'users' | 'file' | 'card' | 'message';
}

const metrics: Metric[] = [
  { id: '1', label: 'NUEVOS CLIENTES', value: '47', change: 12, icon: 'users' },
  { id: '2', label: 'POLIZAS EMITIDAS', value: '128', change: 8, icon: 'file' },
  { id: '3', label: 'INGRESOS', value: '42.5K', change: 15, icon: 'card' },
  { id: '4', label: 'MENSAJES ENVIADOS', value: '892', change: -3, icon: 'message' },
];

const topProducts = [
  { name: 'Seguro de Auto', policies: 45, revenue: '18.500', conversion: 75 },
  { name: 'Seguro de Hogar', policies: 32, revenue: '12.800', conversion: 60 },
  { name: 'Seguro de Vida', policies: 28, revenue: '8.400', conversion: 45 },
  { name: 'Seguro de Salud', policies: 23, revenue: '6.900', conversion: 38 },
];

export default function AnalyticsPage(): React.ReactElement {
  const [period, setPeriod] = useState('7d');

  return (
    <>
      <style>{`
        .analytics-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }

        .date-filter-fui { display: flex; gap: 8px; }
        .date-btn-fui { padding: 8px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .date-btn-fui:hover { border-color: rgba(0,245,255,0.4); color: var(--color-text); }
        .date-btn-fui.active { background: rgba(0,245,255,0.1); border-color: var(--color-cyan); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }

        .metrics-grid-fui { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .metrics-grid-fui { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .metrics-grid-fui { grid-template-columns: 1fr; } }

        .metric-card-fui { padding: 24px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; position: relative; overflow: hidden; }
        .metric-card-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); }
        .metric-header-fui { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .metric-icon-fui { width: 44px; height: 44px; background: rgba(0,245,255,0.1); border: 1px solid rgba(0,245,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .metric-icon-fui svg { width: 22px; height: 22px; color: var(--color-cyan); filter: drop-shadow(0 0 4px rgba(0,245,255,0.5)); }
        .metric-label-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.1em; }
        .metric-value-fui { font-family: var(--font-display); font-size: 2.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 20px rgba(0,245,255,0.4); margin-bottom: 8px; }
        .metric-change-fui { font-family: var(--font-mono); font-size: 0.75rem; display: flex; align-items: center; gap: 6px; }
        .metric-change-fui.up { color: #4ade80; }
        .metric-change-fui.down { color: #f87171; }
        .metric-change-fui svg { width: 14px; height: 14px; }

        .charts-row-fui { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        @media (max-width: 1024px) { .charts-row-fui { grid-template-columns: 1fr; } }

        .chart-card-fui { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; position: relative; }
        .chart-card-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent); }
        .chart-header-fui { padding: 16px 24px; border-bottom: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%); }
        .chart-title-fui { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--color-cyan); letter-spacing: 0.1em; }
        .chart-body-fui { padding: 24px; min-height: 280px; display: flex; align-items: center; justify-content: center; }
        .chart-placeholder-fui { text-align: center; color: var(--color-text-4); }
        .chart-placeholder-fui svg { width: 48px; height: 48px; margin-bottom: 12px; color: var(--color-cyan); opacity: 0.4; }
        .chart-placeholder-fui p { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.1em; }

        .table-card-fui { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; position: relative; }
        .table-card-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent); }
        .table-header-fui { padding: 16px 24px; border-bottom: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%); }
        .table-title-fui { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--color-cyan); letter-spacing: 0.1em; }

        .table-fui { width: 100%; border-collapse: collapse; }
        .table-fui th { text-align: left; padding: 14px 24px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; color: var(--color-cyan); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); }
        .table-fui td { padding: 16px 24px; font-family: var(--font-ui); font-size: 0.85rem; color: var(--color-text); border-bottom: 1px solid var(--color-border); }
        .table-fui tbody tr { transition: all 0.2s; }
        .table-fui tbody tr:hover { background: rgba(0,245,255,0.03); }
        .table-fui tbody tr:last-child td { border-bottom: none; }

        .progress-bar-fui { height: 8px; background: var(--color-surface-3); border-radius: 4px; overflow: hidden; position: relative; }
        .progress-fill-fui { height: 100%; background: linear-gradient(90deg, var(--color-cyan), #06b6d4); border-radius: 4px; box-shadow: 0 0 10px rgba(0,245,255,0.4); position: relative; }
        .progress-fill-fui::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 20px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3)); animation: shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }

        .revenue-fui { font-family: var(--font-display); font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 8px rgba(0,245,255,0.3); }
      `}</style>

      <div className="analytics-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">ANALYTICS</h1>
            <span className="page-subtitle">METRICAS EN TIEMPO REAL // DASHBOARD</span>
          </div>
          <div className="date-filter-fui">
            <button type="button" className={`date-btn-fui ${period === '1d' ? 'active' : ''}`} onClick={() => setPeriod('1d')}>HOY</button>
            <button type="button" className={`date-btn-fui ${period === '7d' ? 'active' : ''}`} onClick={() => setPeriod('7d')}>7 DIAS</button>
            <button type="button" className={`date-btn-fui ${period === '30d' ? 'active' : ''}`} onClick={() => setPeriod('30d')}>30 DIAS</button>
            <button type="button" className={`date-btn-fui ${period === '1y' ? 'active' : ''}`} onClick={() => setPeriod('1y')}>ESTE ANO</button>
          </div>
        </div>

        <div className="metrics-grid-fui">
          {metrics.map(metric => (
            <div key={metric.id} className="metric-card-fui">
              <div className="metric-header-fui">
                <div className="metric-icon-fui">
                  {metric.icon === 'users' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                  )}
                  {metric.icon === 'file' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <path d="M14 2v6h6"/>
                    </svg>
                  )}
                  {metric.icon === 'card' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="1" y="4" width="22" height="16" rx="2"/>
                      <path d="M1 10h22"/>
                    </svg>
                  )}
                  {metric.icon === 'message' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
                    </svg>
                  )}
                </div>
                <span className="metric-label-fui">{metric.label}</span>
              </div>
              <div className="metric-value-fui">{metric.value}{metric.icon === 'card' ? '€' : ''}</div>
              <div className={`metric-change-fui ${metric.change >= 0 ? 'up' : 'down'}`}>
                {metric.change >= 0 ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                )}
                {metric.change >= 0 ? '+' : ''}{metric.change}% VS PERIODO ANTERIOR
              </div>
            </div>
          ))}
        </div>

        <div className="charts-row-fui">
          <div className="chart-card-fui">
            <div className="chart-header-fui">
              <h3 className="chart-title-fui">◇ POLIZAS POR TIPO</h3>
            </div>
            <div className="chart-body-fui">
              <div className="chart-placeholder-fui">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 20V10M12 20V4M6 20v-6"/>
                </svg>
                <p>GRAFICO DE BARRAS</p>
              </div>
            </div>
          </div>

          <div className="chart-card-fui">
            <div className="chart-header-fui">
              <h3 className="chart-title-fui">◇ DISTRIBUCION CANALES</h3>
            </div>
            <div className="chart-body-fui">
              <div className="chart-placeholder-fui">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a10 10 0 0110 10"/>
                </svg>
                <p>GRAFICO CIRCULAR</p>
              </div>
            </div>
          </div>
        </div>

        <div className="table-card-fui">
          <div className="table-header-fui">
            <h3 className="table-title-fui">◇ TOP PRODUCTOS</h3>
          </div>
          <table className="table-fui">
            <thead>
              <tr>
                <th>PRODUCTO</th>
                <th>POLIZAS</th>
                <th>INGRESOS</th>
                <th>CONVERSION</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, idx) => (
                <tr key={idx}>
                  <td>{product.name}</td>
                  <td>{product.policies}</td>
                  <td><span className="revenue-fui">€{product.revenue}</span></td>
                  <td>
                    <div className="progress-bar-fui">
                      <div className="progress-fill-fui" style={{ width: `${product.conversion}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
