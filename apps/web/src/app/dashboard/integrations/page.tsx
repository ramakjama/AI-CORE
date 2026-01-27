'use client';

import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'insurance' | 'payment' | 'communication' | 'storage' | 'analytics';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  logo: string;
}

const mockIntegrations: Integration[] = [
  { id: '1', name: 'Mapfre API', description: 'Cotizacion y emision de polizas', category: 'insurance', status: 'connected', lastSync: 'Hace 5 min', logo: 'M' },
  { id: '2', name: 'Allianz Connect', description: 'Integracion con productos Allianz', category: 'insurance', status: 'connected', lastSync: 'Hace 10 min', logo: 'A' },
  { id: '3', name: 'Stripe', description: 'Procesamiento de pagos online', category: 'payment', status: 'connected', lastSync: 'Hace 2 min', logo: 'S' },
  { id: '4', name: 'Twilio', description: 'SMS y WhatsApp Business', category: 'communication', status: 'connected', lastSync: 'Hace 1 min', logo: 'T' },
  { id: '5', name: 'SendGrid', description: 'Envio de emails transaccionales', category: 'communication', status: 'error', lastSync: 'Hace 2 horas', logo: 'SG' },
  { id: '6', name: 'AWS S3', description: 'Almacenamiento de documentos', category: 'storage', status: 'connected', lastSync: 'Hace 30 seg', logo: 'S3' },
  { id: '7', name: 'Google Analytics', description: 'Analisis de trafico web', category: 'analytics', status: 'disconnected', lastSync: '-', logo: 'GA' },
  { id: '8', name: 'Zurich Partner', description: 'Portal de agentes Zurich', category: 'insurance', status: 'connected', lastSync: 'Hace 15 min', logo: 'Z' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  connected: { label: 'CONECTADO', color: '#4ade80' },
  disconnected: { label: 'DESCONECTADO', color: '#94a3b8' },
  error: { label: 'ERROR', color: '#f87171' },
};

const categoryConfig: Record<string, { label: string; color: string }> = {
  insurance: { label: 'ASEGURADORAS', color: '#00f5ff' },
  payment: { label: 'PAGOS', color: '#4ade80' },
  communication: { label: 'COMUNICACION', color: '#a78bfa' },
  storage: { label: 'ALMACENAMIENTO', color: '#ffd93d' },
  analytics: { label: 'ANALYTICS', color: '#ec4899' },
};

export default function IntegrationsPage(): React.ReactElement {
  const [integrations] = useState<Integration[]>(mockIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(integrations.map(i => i.category))];
  const filtered = selectedCategory === 'all'
    ? integrations
    : integrations.filter(i => i.category === selectedCategory);

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    error: integrations.filter(i => i.status === 'error').length,
    disconnected: integrations.filter(i => i.status === 'disconnected').length,
  };

  return (
    <>
      <style>{`
        .integrations-fui { display: flex; flex-direction: column; gap: 24px; }
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
        .stat-card-fui { padding: 20px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; position: relative; overflow: hidden; text-align: center; }
        .stat-card-fui::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
        .stat-value-fui { font-family: var(--font-display); font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
        .stat-label-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.1em; }

        .category-tabs-fui { display: flex; gap: 8px; flex-wrap: wrap; }
        .category-tab-fui { padding: 10px 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .category-tab-fui:hover { border-color: rgba(0,245,255,0.4); color: var(--color-text); }
        .category-tab-fui.active { background: rgba(0,245,255,0.1); border-color: var(--color-cyan); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }

        .integrations-grid-fui { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

        .integration-card-fui { padding: 24px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 16px; position: relative; overflow: hidden; transition: all 0.2s; }
        .integration-card-fui:hover { border-color: rgba(0,245,255,0.4); box-shadow: 0 0 30px rgba(0,245,255,0.1); }
        .integration-card-fui::before, .integration-card-fui::after { content: ''; position: absolute; width: 10px; height: 10px; border-color: var(--color-cyan); border-style: solid; opacity: 0.4; }
        .integration-card-fui::before { top: 8px; left: 8px; border-width: 1px 0 0 1px; }
        .integration-card-fui::after { bottom: 8px; right: 8px; border-width: 0 1px 1px 0; }

        .integration-header-fui { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .integration-logo-fui { width: 52px; height: 52px; background: linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-surface-3) 100%); border: 1px solid var(--color-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.4); }
        .integration-main-fui { flex: 1; }
        .integration-name-fui { font-family: var(--font-ui); font-size: 1rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px; }
        .integration-category-fui { font-family: var(--font-mono); font-size: 0.6rem; letter-spacing: 0.1em; }

        .integration-description-fui { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); margin-bottom: 20px; line-height: 1.5; }

        .integration-footer-fui { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--color-border); }
        .integration-status-fui { display: flex; align-items: center; gap: 10px; }
        .status-led-fui { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }
        .status-text-fui { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.05em; }
        .last-sync-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); }

        .btn-action-fui { padding: 8px 16px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .btn-action-fui:hover { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.4); color: var(--color-cyan); }
        .btn-action-fui.connect { background: var(--color-cyan); border-color: var(--color-cyan); color: var(--color-void); box-shadow: 0 0 10px rgba(0,245,255,0.3); }
        .btn-action-fui.connect:hover { box-shadow: 0 0 20px rgba(0,245,255,0.5); }
      `}</style>

      <div className="integrations-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">INTEGRACIONES</h1>
            <span className="page-subtitle">CONEXIONES API // {integrations.length} SERVICIOS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            MARKETPLACE
          </button>
        </div>

        <div className="stats-grid-fui">
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--color-cyan)' }} />
            <div className="stat-value-fui" style={{ color: 'var(--color-cyan)', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{stats.total}</div>
            <div className="stat-label-fui">TOTAL</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#4ade80' }} />
            <div className="stat-value-fui" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{stats.connected}</div>
            <div className="stat-label-fui">CONECTADAS</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#f87171' }} />
            <div className="stat-value-fui" style={{ color: '#f87171', textShadow: '0 0 15px rgba(248,113,113,0.4)' }}>{stats.error}</div>
            <div className="stat-label-fui">CON ERRORES</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#94a3b8' }} />
            <div className="stat-value-fui" style={{ color: '#94a3b8', textShadow: '0 0 15px rgba(148,163,184,0.4)' }}>{stats.disconnected}</div>
            <div className="stat-label-fui">DESCONECTADAS</div>
          </div>
        </div>

        <div className="category-tabs-fui">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              className={`category-tab-fui ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'all' ? 'TODAS' : categoryConfig[cat]?.label}
            </button>
          ))}
        </div>

        <div className="integrations-grid-fui">
          {filtered.map(integration => (
            <div key={integration.id} className="integration-card-fui">
              <div className="integration-header-fui">
                <div className="integration-logo-fui">{integration.logo}</div>
                <div className="integration-main-fui">
                  <div className="integration-name-fui">{integration.name}</div>
                  <div
                    className="integration-category-fui"
                    style={{ color: categoryConfig[integration.category].color }}
                  >
                    {categoryConfig[integration.category].label}
                  </div>
                </div>
              </div>

              <div className="integration-description-fui">{integration.description}</div>

              <div className="integration-footer-fui">
                <div className="integration-status-fui">
                  <span
                    className="status-led-fui"
                    style={{
                      background: statusConfig[integration.status].color,
                      color: statusConfig[integration.status].color
                    }}
                  />
                  <span
                    className="status-text-fui"
                    style={{ color: statusConfig[integration.status].color }}
                  >
                    {statusConfig[integration.status].label}
                  </span>
                  {integration.status === 'connected' && (
                    <span className="last-sync-fui">• {integration.lastSync}</span>
                  )}
                </div>
                <button
                  type="button"
                  className={`btn-action-fui ${integration.status === 'disconnected' ? 'connect' : ''}`}
                >
                  {integration.status === 'disconnected' ? 'CONECTAR' : 'CONFIG'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
