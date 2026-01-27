'use client';

import { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: 'web' | 'referral' | 'call' | 'social';
  interest: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
  value: number;
}

const mockLeads: Lead[] = [
  { id: '1', name: 'Roberto Fernandez', email: 'roberto@email.es', phone: '+34 612 345 678', source: 'web', interest: 'Seguro Auto', status: 'new', createdAt: '2024-03-15', value: 450 },
  { id: '2', name: 'Elena Torres', email: 'elena.t@email.es', phone: '+34 623 456 789', source: 'referral', interest: 'Seguro Hogar', status: 'contacted', createdAt: '2024-03-14', value: 280 },
  { id: '3', name: 'Miguel Ruiz', email: 'mruiz@empresa.es', phone: '+34 634 567 890', source: 'call', interest: 'Seguro Vida', status: 'qualified', createdAt: '2024-03-13', value: 1200 },
  { id: '4', name: 'Sofia Navarro', email: 'sofia.n@email.es', phone: '+34 645 678 901', source: 'social', interest: 'Seguro Salud', status: 'converted', createdAt: '2024-03-12', value: 680 },
  { id: '5', name: 'David Moreno', email: 'david.m@email.es', phone: '+34 656 789 012', source: 'web', interest: 'Seguro Auto', status: 'lost', createdAt: '2024-03-11', value: 350 },
  { id: '6', name: 'Laura Sanchez', email: 'laura.s@email.es', phone: '+34 667 890 123', source: 'referral', interest: 'Seguro Empresa', status: 'new', createdAt: '2024-03-16', value: 2400 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'NUEVO', color: '#94a3b8' },
  contacted: { label: 'CONTACTADO', color: '#ffd93d' },
  qualified: { label: 'CUALIFICADO', color: '#00f5ff' },
  converted: { label: 'CONVERTIDO', color: '#4ade80' },
  lost: { label: 'PERDIDO', color: '#f87171' },
};

const sourceConfig: Record<string, { label: string; icon: string }> = {
  web: { label: 'WEB', icon: '🌐' },
  referral: { label: 'REFERIDO', icon: '👥' },
  call: { label: 'LLAMADA', icon: '📞' },
  social: { label: 'RRSS', icon: '📱' },
};

export default function LeadsPage(): React.ReactElement {
  const [leads] = useState<Lead[]>(mockLeads);
  const [search, setSearch] = useState('');

  const filtered = leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()));
  const totalValue = leads.reduce((sum, l) => sum + l.value, 0);

  return (
    <>
      <style>{`
        .leads-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 30px rgba(0,245,255,0.5); transform: translateY(-2px); }
        .pipeline-fui { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        @media (max-width: 1024px) { .pipeline-fui { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 640px) { .pipeline-fui { grid-template-columns: repeat(2, 1fr); } }
        .pipeline-card { padding: 16px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 10px; text-align: center; position: relative; overflow: hidden; }
        .pipeline-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
        .pipeline-count { font-family: var(--font-display); font-size: 2rem; font-weight: 700; }
        .pipeline-label { font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-text-4); letter-spacing: 0.1em; margin-top: 4px; }
        .pipeline-value { font-family: var(--font-mono); font-size: 0.7rem; margin-top: 8px; }
        .search-input-fui { flex: 1; max-width: 400px; padding: 12px 16px 12px 44px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text); font-family: var(--font-mono); font-size: 0.85rem; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300f5ff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; background-size: 20px; }
        .search-input-fui:focus { outline: none; border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.2); }
        .leads-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
        .lead-card-fui { padding: 20px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; position: relative; overflow: hidden; transition: all 0.2s; }
        .lead-card-fui:hover { border-color: rgba(0,245,255,0.4); box-shadow: 0 0 20px rgba(0,245,255,0.1); }
        .lead-card-fui::before, .lead-card-fui::after { content: ''; position: absolute; width: 10px; height: 10px; border-color: var(--color-cyan); border-style: solid; opacity: 0.5; }
        .lead-card-fui::before { top: 8px; left: 8px; border-width: 1px 0 0 1px; }
        .lead-card-fui::after { bottom: 8px; right: 8px; border-width: 0 1px 1px 0; }
        .lead-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .lead-name { font-family: var(--font-ui); font-size: 1rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px; }
        .lead-interest { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.05em; }
        .lead-value { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.4); }
        .lead-info { margin-bottom: 16px; }
        .lead-info-row { display: flex; align-items: center; gap: 10px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); margin-bottom: 8px; }
        .lead-info-row svg { width: 14px; height: 14px; color: var(--color-cyan); opacity: 0.7; }
        .lead-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px solid var(--color-border); }
        .lead-badges { display: flex; gap: 8px; }
        .badge-fui { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui.active::before { content: ''; width: 5px; height: 5px; background: currentColor; border-radius: 50%; box-shadow: 0 0 6px currentColor; }
        .lead-date { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); }
      `}</style>

      <div className="leads-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">LEADS</h1>
            <span className="page-subtitle">PIPELINE DE VENTAS // {leads.length} REGISTROS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            NUEVO LEAD
          </button>
        </div>

        <div className="pipeline-fui">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const count = leads.filter(l => l.status === key).length;
            const value = leads.filter(l => l.status === key).reduce((s, l) => s + l.value, 0);
            return (
              <div key={key} className="pipeline-card" style={{ borderTopColor: cfg.color }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: cfg.color }} />
                <div className="pipeline-count" style={{ color: cfg.color, textShadow: `0 0 15px ${cfg.color}60` }}>{count}</div>
                <div className="pipeline-label">{cfg.label}</div>
                <div className="pipeline-value" style={{ color: cfg.color }}>€{value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input type="text" className="search-input-fui" placeholder="BUSCAR LEADS..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-text-3)' }}>
            VALOR TOTAL: <span style={{ color: 'var(--color-cyan)', fontWeight: 600, textShadow: '0 0 8px rgba(0,245,255,0.4)' }}>€{totalValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="leads-grid">
          {filtered.map(lead => (
            <div key={lead.id} className="lead-card-fui">
              <div className="lead-header">
                <div>
                  <div className="lead-name">{lead.name}</div>
                  <div className="lead-interest">{lead.interest}</div>
                </div>
                <div className="lead-value">€{lead.value}</div>
              </div>
              <div className="lead-info">
                <div className="lead-info-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
                  {lead.email}
                </div>
                <div className="lead-info-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  {lead.phone}
                </div>
              </div>
              <div className="lead-footer">
                <div className="lead-badges">
                  <span className={`badge-fui ${lead.status === 'converted' ? 'active' : ''}`} style={{ background: `${statusConfig[lead.status].color}15`, borderColor: `${statusConfig[lead.status].color}40`, color: statusConfig[lead.status].color }}>{statusConfig[lead.status].label}</span>
                  <span className="badge-fui" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-4)' }}>{sourceConfig[lead.source].icon} {sourceConfig[lead.source].label}</span>
                </div>
                <span className="lead-date">{lead.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
