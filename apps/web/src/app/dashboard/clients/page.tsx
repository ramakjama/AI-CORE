'use client';

import { useState } from 'react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'person' | 'company';
  status: 'active' | 'inactive';
  policies: number;
  createdAt: string;
}

const mockClients: Client[] = [
  { id: '1', name: 'Maria Garcia Lopez', email: 'maria@ejemplo.es', phone: '+34 612 345 678', type: 'person', status: 'active', policies: 3, createdAt: '2024-01-15' },
  { id: '2', name: 'Construcciones ABC S.L.', email: 'info@abc.es', phone: '+34 91 234 5678', type: 'company', status: 'active', policies: 8, createdAt: '2023-11-20' },
  { id: '3', name: 'Juan Martinez Ruiz', email: 'juan@ejemplo.es', phone: '+34 623 456 789', type: 'person', status: 'active', policies: 2, createdAt: '2024-02-10' },
  { id: '4', name: 'Tech Solutions S.A.', email: 'contact@tech.es', phone: '+34 93 456 7890', type: 'company', status: 'inactive', policies: 5, createdAt: '2023-08-05' },
  { id: '5', name: 'Ana Fernandez Diaz', email: 'ana@ejemplo.es', phone: '+34 634 567 890', type: 'person', status: 'active', policies: 1, createdAt: '2024-03-01' },
];

export default function ClientsPage(): React.ReactElement {
  const [clients] = useState<Client[]>(mockClients);
  const [search, setSearch] = useState('');

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = clients.filter(c => c.status === 'active').length;
  const totalPolicies = clients.reduce((sum, c) => sum + c.policies, 0);

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════════════
           FUI CLIENTS PAGE - HOLOGRAPHIC STYLE
           ═══════════════════════════════════════════════════════════ */

        .clients-fui {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* ─── Page Header ─── */
        .page-header-fui {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: linear-gradient(90deg, rgba(0, 245, 255, 0.05) 0%, transparent 50%, rgba(0, 245, 255, 0.05) 100%);
          border: 1px solid rgba(0, 245, 255, 0.2);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }

        .page-header-fui::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-cyan), transparent);
          animation: scan-header 4s linear infinite;
        }

        @keyframes scan-header {
          to { transform: translateX(50%); }
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-title-fui {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-cyan);
          text-shadow: 0 0 10px rgba(0, 245, 255, 0.5);
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-title-fui::before {
          content: '◈';
          font-size: 1rem;
        }

        .page-subtitle {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--color-text-3);
          letter-spacing: 0.15em;
        }

        .btn-primary-fui {
          padding: 12px 24px;
          background: transparent;
          color: var(--color-cyan);
          border: 1px solid var(--color-cyan);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-primary-fui::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 245, 255, 0.2), transparent);
          transition: left 0.4s ease;
        }

        .btn-primary-fui:hover::before {
          left: 100%;
        }

        .btn-primary-fui:hover {
          background: rgba(0, 245, 255, 0.1);
          box-shadow: 0 0 20px rgba(0, 245, 255, 0.3), inset 0 0 20px rgba(0, 245, 255, 0.05);
        }

        .btn-primary-fui svg {
          width: 16px;
          height: 16px;
        }

        /* ─── Stats Row ─── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr; }
        }

        .stat-card-fui {
          padding: 20px;
          background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          position: relative;
          overflow: hidden;
        }

        .stat-card-fui::before,
        .stat-card-fui::after {
          content: '';
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: var(--color-cyan);
          border-style: solid;
          opacity: 0.6;
        }

        .stat-card-fui::before {
          top: 8px;
          left: 8px;
          border-width: 1px 0 0 1px;
        }

        .stat-card-fui::after {
          bottom: 8px;
          right: 8px;
          border-width: 0 1px 1px 0;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-cyan);
          text-shadow: 0 0 15px rgba(0, 245, 255, 0.4);
          line-height: 1;
        }

        .stat-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          color: var(--color-text-4);
          letter-spacing: 0.15em;
          margin-top: 8px;
        }

        /* ─── Filters ─── */
        .filters-fui {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-input-fui {
          flex: 1;
          max-width: 400px;
          padding: 12px 16px 12px 44px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          transition: all 0.2s;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300f5ff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'%3E%3C/path%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: 12px center;
          background-size: 20px;
        }

        .search-input-fui::placeholder {
          color: var(--color-text-4);
        }

        .search-input-fui:focus {
          outline: none;
          border-color: var(--color-cyan);
          box-shadow: 0 0 15px rgba(0, 245, 255, 0.2), inset 0 0 20px rgba(0, 245, 255, 0.03);
        }

        .filter-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--color-text-3);
          letter-spacing: 0.05em;
        }

        .filter-badge .count {
          color: var(--color-cyan);
          font-weight: 600;
        }

        /* ─── Table Container ─── */
        .table-container-fui {
          background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        .table-container-fui::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-cyan), transparent);
          opacity: 0.5;
        }

        .table-fui {
          width: 100%;
          border-collapse: collapse;
        }

        .table-fui th {
          text-align: left;
          padding: 16px 20px;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--color-cyan);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border-bottom: 1px solid var(--color-border);
          background: rgba(0, 245, 255, 0.03);
        }

        .table-fui th::before {
          content: '▸ ';
          opacity: 0.5;
        }

        .table-fui td {
          padding: 16px 20px;
          font-size: 0.875rem;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-border);
          transition: all 0.15s;
        }

        .table-fui tr:last-child td {
          border-bottom: none;
        }

        .table-fui tbody tr {
          transition: all 0.15s;
        }

        .table-fui tbody tr:hover {
          background: rgba(0, 245, 255, 0.03);
        }

        .table-fui tbody tr:hover td {
          color: var(--color-text);
        }

        .client-name-fui {
          font-family: var(--font-ui);
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 2px;
        }

        .client-email-fui {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--color-text-4);
        }

        .client-phone {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--color-text-2);
        }

        .badge-fui {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1px solid;
        }

        .badge-fui.person {
          background: rgba(0, 245, 255, 0.1);
          border-color: rgba(0, 245, 255, 0.3);
          color: var(--color-cyan);
        }

        .badge-fui.company {
          background: rgba(167, 139, 250, 0.1);
          border-color: rgba(167, 139, 250, 0.3);
          color: #a78bfa;
        }

        .badge-fui.active {
          background: rgba(74, 222, 128, 0.1);
          border-color: rgba(74, 222, 128, 0.3);
          color: var(--color-success);
        }

        .badge-fui.active::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--color-success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--color-success);
          animation: pulse-led 2s ease-in-out infinite;
        }

        @keyframes pulse-led {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .badge-fui.inactive {
          background: rgba(248, 113, 113, 0.1);
          border-color: rgba(248, 113, 113, 0.3);
          color: var(--color-error);
        }

        .policies-count {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-cyan);
          text-shadow: 0 0 8px rgba(0, 245, 255, 0.4);
        }

        .actions-fui {
          display: flex;
          gap: 8px;
        }

        .btn-icon-fui {
          width: 34px;
          height: 34px;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .btn-icon-fui:hover {
          background: rgba(0, 245, 255, 0.1);
          border-color: var(--color-cyan);
          color: var(--color-cyan);
          box-shadow: 0 0 10px rgba(0, 245, 255, 0.2);
        }

        .btn-icon-fui svg {
          width: 14px;
          height: 14px;
        }

        .empty-fui {
          text-align: center;
          padding: 60px 20px;
          color: var(--color-text-4);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }

        .empty-fui::before {
          content: '◇';
          display: block;
          font-size: 2rem;
          color: var(--color-cyan);
          opacity: 0.3;
          margin-bottom: 16px;
        }
      `}</style>

      <div className="clients-fui">
        {/* Header */}
        <div className="page-header-fui">
          <div className="header-left">
            <h1 className="page-title-fui">CLIENTES</h1>
            <span className="page-subtitle">GESTIÓN DE CARTERA // {clients.length} REGISTROS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            NUEVO CLIENTE
          </button>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card-fui">
            <div className="stat-value">{clients.length}</div>
            <div className="stat-label">TOTAL CLIENTES</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74, 222, 128, 0.4)' }}>{activeCount}</div>
            <div className="stat-label">ACTIVOS</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#a78bfa', textShadow: '0 0 15px rgba(167, 139, 250, 0.4)' }}>{totalPolicies}</div>
            <div className="stat-label">PÓLIZAS TOTALES</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#ffd93d', textShadow: '0 0 15px rgba(255, 217, 61, 0.4)' }}>{(totalPolicies / clients.length).toFixed(1)}</div>
            <div className="stat-label">PÓLIZAS/CLIENTE</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-fui">
          <input
            type="text"
            className="search-input-fui"
            placeholder="BUSCAR POR NOMBRE O EMAIL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="filter-badge">
            MOSTRANDO: <span className="count">{filtered.length}</span> DE <span className="count">{clients.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="table-container-fui">
          {filtered.length === 0 ? (
            <div className="empty-fui">NO SE ENCONTRARON CLIENTES</div>
          ) : (
            <table className="table-fui">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Teléfono</th>
                  <th>Pólizas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-name-fui">{client.name}</div>
                      <div className="client-email-fui">{client.email}</div>
                    </td>
                    <td>
                      <span className={`badge-fui ${client.type}`}>
                        {client.type === 'person' ? '◈ Persona' : '◆ Empresa'}
                      </span>
                    </td>
                    <td>
                      <span className="client-phone">{client.phone}</span>
                    </td>
                    <td>
                      <span className="policies-count">{client.policies}</span>
                    </td>
                    <td>
                      <span className={`badge-fui ${client.status}`}>
                        {client.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
