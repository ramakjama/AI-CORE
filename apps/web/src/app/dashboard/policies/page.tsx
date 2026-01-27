'use client';

import { useState } from 'react';

interface Policy {
  id: string;
  number: string;
  client: string;
  type: 'auto' | 'home' | 'life' | 'health' | 'business';
  status: 'active' | 'pending' | 'expired' | 'cancelled';
  premium: number;
  startDate: string;
  endDate: string;
}

const mockPolicies: Policy[] = [
  { id: '1', number: 'POL-2024-001', client: 'Maria Garcia Lopez', type: 'auto', status: 'active', premium: 450, startDate: '2024-01-15', endDate: '2025-01-15' },
  { id: '2', number: 'POL-2024-002', client: 'Construcciones ABC S.L.', type: 'business', status: 'active', premium: 2500, startDate: '2024-02-01', endDate: '2025-02-01' },
  { id: '3', number: 'POL-2024-003', client: 'Juan Martinez Ruiz', type: 'home', status: 'active', premium: 380, startDate: '2024-02-10', endDate: '2025-02-10' },
  { id: '4', number: 'POL-2023-098', client: 'Tech Solutions S.A.', type: 'life', status: 'expired', premium: 1200, startDate: '2023-03-01', endDate: '2024-03-01' },
  { id: '5', number: 'POL-2024-004', client: 'Ana Fernandez Diaz', type: 'health', status: 'pending', premium: 650, startDate: '2024-04-01', endDate: '2025-04-01' },
  { id: '6', number: 'POL-2024-005', client: 'Logistica Express S.L.', type: 'business', status: 'active', premium: 3200, startDate: '2024-03-10', endDate: '2025-03-10' },
];

const typeConfig: Record<string, { label: string; icon: string; color: string }> = {
  auto: { label: 'AUTO', icon: '🚗', color: '#00f5ff' },
  home: { label: 'HOGAR', icon: '🏠', color: '#ffd93d' },
  life: { label: 'VIDA', icon: '❤️', color: '#4ade80' },
  health: { label: 'SALUD', icon: '🏥', color: '#ec4899' },
  business: { label: 'EMPRESA', icon: '🏢', color: '#a78bfa' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'ACTIVA', color: '#4ade80' },
  pending: { label: 'PENDIENTE', color: '#ffd93d' },
  expired: { label: 'VENCIDA', color: '#f87171' },
  cancelled: { label: 'CANCELADA', color: '#94a3b8' },
};

export default function PoliciesPage(): React.ReactElement {
  const [policies] = useState<Policy[]>(mockPolicies);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = policies.filter(p => {
    const matchSearch = p.number.toLowerCase().includes(search.toLowerCase()) ||
                       p.client.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  const totalPremium = policies.reduce((acc, p) => acc + p.premium, 0);
  const activePolicies = policies.filter(p => p.status === 'active');
  const activePremium = activePolicies.reduce((acc, p) => acc + p.premium, 0);

  return (
    <>
      <style>{`
        .policies-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 30px rgba(0,245,255,0.5); transform: translateY(-2px); }

        .stats-grid-fui { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .stats-grid-fui { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stats-grid-fui { grid-template-columns: 1fr; } }
        .stat-card-fui { padding: 20px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; position: relative; overflow: hidden; }
        .stat-card-fui::before, .stat-card-fui::after { content: ''; position: absolute; width: 8px; height: 8px; border-color: var(--color-cyan); border-style: solid; opacity: 0.4; }
        .stat-card-fui::before { top: 6px; left: 6px; border-width: 1px 0 0 1px; }
        .stat-card-fui::after { bottom: 6px; right: 6px; border-width: 0 1px 1px 0; }
        .stat-label-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.1em; margin-bottom: 8px; }
        .stat-value-fui { font-family: var(--font-display); font-size: 2rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 15px rgba(0,245,255,0.4); }
        .stat-value-fui.success { color: #4ade80; text-shadow: 0 0 15px rgba(74,222,128,0.4); }
        .stat-value-fui.warning { color: #ffd93d; text-shadow: 0 0 15px rgba(255,217,61,0.4); }
        .stat-value-fui.purple { color: #a78bfa; text-shadow: 0 0 15px rgba(167,139,250,0.4); }
        .stat-trend { font-family: var(--font-mono); font-size: 0.7rem; margin-top: 8px; display: flex; align-items: center; gap: 4px; }

        .filters-fui { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .search-input-fui { flex: 1; max-width: 400px; padding: 12px 16px 12px 44px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text); font-family: var(--font-mono); font-size: 0.85rem; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300f5ff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; background-size: 20px; }
        .search-input-fui:focus { outline: none; border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.2); }
        .filter-btn-fui { padding: 10px 16px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .filter-btn-fui:hover { border-color: rgba(0,245,255,0.4); color: var(--color-text); }
        .filter-btn-fui.active { background: rgba(0,245,255,0.1); border-color: var(--color-cyan); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }

        .table-container-fui { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; position: relative; }
        .table-container-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent); }
        .table-fui { width: 100%; border-collapse: collapse; }
        .table-fui th { text-align: left; padding: 16px 20px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; color: var(--color-cyan); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%); }
        .table-fui td { padding: 16px 20px; font-family: var(--font-ui); font-size: 0.85rem; color: var(--color-text); border-bottom: 1px solid var(--color-border); }
        .table-fui tbody tr { transition: all 0.2s; }
        .table-fui tbody tr:hover { background: rgba(0,245,255,0.03); }
        .table-fui tbody tr:last-child td { border-bottom: none; }

        .policy-number-fui { font-family: var(--font-mono); font-weight: 600; color: var(--color-cyan); text-shadow: 0 0 8px rgba(0,245,255,0.3); }
        .client-name { font-weight: 500; }
        .premium-fui { font-family: var(--font-display); font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 8px rgba(0,245,255,0.3); }

        .badge-fui { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui .led { width: 5px; height: 5px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }

        .type-badge { padding: 5px 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.05em; display: inline-flex; align-items: center; gap: 6px; }

        .date-fui { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); }

        .actions-fui { display: flex; gap: 8px; }
        .btn-icon-fui { width: 32px; height: 32px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-icon-fui:hover { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.4); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }
        .btn-icon-fui svg { width: 14px; height: 14px; }
      `}</style>

      <div className="policies-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">POLIZAS</h1>
            <span className="page-subtitle">GESTION DE CONTRATOS // {policies.length} REGISTROS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            NUEVA POLIZA
          </button>
        </div>

        <div className="stats-grid-fui">
          <div className="stat-card-fui">
            <div className="stat-label-fui">TOTAL POLIZAS</div>
            <div className="stat-value-fui">{policies.length}</div>
            <div className="stat-trend" style={{ color: 'var(--color-text-4)' }}>CARTERA ACTIVA</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-label-fui">POLIZAS ACTIVAS</div>
            <div className="stat-value-fui success">{activePolicies.length}</div>
            <div className="stat-trend" style={{ color: '#4ade80' }}>● OPERATIVAS</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-label-fui">PENDIENTES</div>
            <div className="stat-value-fui warning">{policies.filter(p => p.status === 'pending').length}</div>
            <div className="stat-trend" style={{ color: '#ffd93d' }}>◐ REVISION</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-label-fui">PRIMA TOTAL ANUAL</div>
            <div className="stat-value-fui purple">€{totalPremium.toLocaleString()}</div>
            <div className="stat-trend" style={{ color: '#a78bfa' }}>ACTIVAS: €{activePremium.toLocaleString()}</div>
          </div>
        </div>

        <div className="filters-fui">
          <input
            type="text"
            className="search-input-fui"
            placeholder="BUSCAR POLIZAS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="button" className={`filter-btn-fui ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>TODAS</button>
          <button type="button" className={`filter-btn-fui ${filter === 'active' ? 'active' : ''}`} onClick={() => setFilter('active')}>ACTIVAS</button>
          <button type="button" className={`filter-btn-fui ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>PENDIENTES</button>
          <button type="button" className={`filter-btn-fui ${filter === 'expired' ? 'active' : ''}`} onClick={() => setFilter('expired')}>VENCIDAS</button>
        </div>

        <div className="table-container-fui">
          <table className="table-fui">
            <thead>
              <tr>
                <th>NUMERO</th>
                <th>CLIENTE</th>
                <th>TIPO</th>
                <th>ESTADO</th>
                <th>PRIMA</th>
                <th>VENCIMIENTO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(policy => (
                <tr key={policy.id}>
                  <td><span className="policy-number-fui">{policy.number}</span></td>
                  <td><span className="client-name">{policy.client}</span></td>
                  <td>
                    <span
                      className="type-badge"
                      style={{
                        background: `${typeConfig[policy.type].color}15`,
                        color: typeConfig[policy.type].color,
                        border: `1px solid ${typeConfig[policy.type].color}40`
                      }}
                    >
                      {typeConfig[policy.type].icon} {typeConfig[policy.type].label}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge-fui"
                      style={{
                        background: `${statusConfig[policy.status].color}15`,
                        borderColor: `${statusConfig[policy.status].color}40`,
                        color: statusConfig[policy.status].color
                      }}
                    >
                      <span className="led" style={{ background: statusConfig[policy.status].color }} />
                      {statusConfig[policy.status].label}
                    </span>
                  </td>
                  <td><span className="premium-fui">€{policy.premium.toLocaleString()}</span></td>
                  <td><span className="date-fui">{policy.endDate}</span></td>
                  <td>
                    <div className="actions-fui">
                      <button type="button" className="btn-icon-fui" title="Ver">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      <button type="button" className="btn-icon-fui" title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button type="button" className="btn-icon-fui" title="Descargar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
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
