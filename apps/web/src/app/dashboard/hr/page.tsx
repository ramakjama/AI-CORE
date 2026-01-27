'use client';

import { useState } from 'react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: 'active' | 'vacation' | 'sick' | 'remote';
  startDate: string;
  avatar: string;
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Maria Garcia', role: 'Directora Comercial', department: 'Ventas', email: 'maria@ain-tech.cloud', phone: '+34 612 345 678', status: 'active', startDate: '2020-03-15', avatar: 'MG' },
  { id: '2', name: 'Carlos Lopez', role: 'Desarrollador Senior', department: 'Tecnologia', email: 'carlos@ain-tech.cloud', phone: '+34 623 456 789', status: 'remote', startDate: '2021-06-01', avatar: 'CL' },
  { id: '3', name: 'Ana Martinez', role: 'Responsable RRHH', department: 'RRHH', email: 'ana@ain-tech.cloud', phone: '+34 634 567 890', status: 'active', startDate: '2019-01-10', avatar: 'AM' },
  { id: '4', name: 'Pedro Sanchez', role: 'Comercial', department: 'Ventas', email: 'pedro@ain-tech.cloud', phone: '+34 645 678 901', status: 'vacation', startDate: '2022-09-01', avatar: 'PS' },
  { id: '5', name: 'Laura Diaz', role: 'Contable', department: 'Finanzas', email: 'laura@ain-tech.cloud', phone: '+34 656 789 012', status: 'sick', startDate: '2021-02-15', avatar: 'LD' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'EN OFICINA', color: '#4ade80' },
  vacation: { label: 'VACACIONES', color: '#ffd93d' },
  sick: { label: 'BAJA', color: '#f87171' },
  remote: { label: 'REMOTO', color: '#00f5ff' },
};

const deptConfig: Record<string, string> = {
  'Ventas': '#00f5ff',
  'Tecnologia': '#a78bfa',
  'RRHH': '#ec4899',
  'Finanzas': '#4ade80',
};

export default function HRPage(): React.ReactElement {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    remote: employees.filter(e => e.status === 'remote').length,
    absent: employees.filter(e => e.status === 'vacation' || e.status === 'sick').length,
  };

  return (
    <>
      <style>{`
        .hr-fui { display: flex; flex-direction: column; gap: 24px; }
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

        .search-input-fui { width: 100%; max-width: 400px; padding: 12px 16px 12px 44px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text); font-family: var(--font-mono); font-size: 0.85rem; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300f5ff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; background-size: 20px; }
        .search-input-fui:focus { outline: none; border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.2); }

        .employees-grid-fui { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }

        .employee-card-fui { padding: 24px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 16px; position: relative; overflow: hidden; transition: all 0.2s; }
        .employee-card-fui:hover { border-color: rgba(0,245,255,0.4); box-shadow: 0 0 30px rgba(0,245,255,0.1); }
        .employee-card-fui::before, .employee-card-fui::after { content: ''; position: absolute; width: 12px; height: 12px; border-color: var(--color-cyan); border-style: solid; opacity: 0.4; }
        .employee-card-fui::before { top: 10px; left: 10px; border-width: 1px 0 0 1px; }
        .employee-card-fui::after { bottom: 10px; right: 10px; border-width: 0 1px 1px 0; }

        .employee-header-fui { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
        .employee-avatar-fui { width: 60px; height: 60px; background: linear-gradient(135deg, var(--color-cyan) 0%, #06b6d4 100%); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--color-void); box-shadow: 0 0 20px rgba(0,245,255,0.3); position: relative; }
        .employee-avatar-fui::after { content: ''; position: absolute; inset: -2px; border-radius: 16px; border: 1px solid rgba(0,245,255,0.3); }
        .employee-main-fui { flex: 1; }
        .employee-name-fui { font-family: var(--font-ui); font-size: 1.1rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px; }
        .employee-role-fui { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.05em; }

        .employee-info-fui { margin-bottom: 20px; }
        .info-row-fui { display: flex; align-items: center; gap: 12px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); margin-bottom: 10px; }
        .info-row-fui:last-child { margin-bottom: 0; }
        .info-row-fui svg { width: 16px; height: 16px; color: var(--color-cyan); opacity: 0.7; flex-shrink: 0; }

        .employee-footer-fui { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--color-border); }

        .badge-fui { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui .led { width: 5px; height: 5px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }

        .dept-badge-fui { padding: 5px 12px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; }
      `}</style>

      <div className="hr-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">RECURSOS HUMANOS</h1>
            <span className="page-subtitle">GESTION DE PERSONAL // {employees.length} EMPLEADOS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            NUEVO EMPLEADO
          </button>
        </div>

        <div className="stats-grid-fui">
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--color-cyan)' }} />
            <div className="stat-value-fui" style={{ color: 'var(--color-cyan)', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{stats.total}</div>
            <div className="stat-label-fui">TOTAL EMPLEADOS</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#4ade80' }} />
            <div className="stat-value-fui" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{stats.active}</div>
            <div className="stat-label-fui">EN OFICINA</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#00f5ff' }} />
            <div className="stat-value-fui" style={{ color: '#00f5ff', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{stats.remote}</div>
            <div className="stat-label-fui">REMOTO</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#ffd93d' }} />
            <div className="stat-value-fui" style={{ color: '#ffd93d', textShadow: '0 0 15px rgba(255,217,61,0.4)' }}>{stats.absent}</div>
            <div className="stat-label-fui">AUSENTES</div>
          </div>
        </div>

        <input
          type="text"
          className="search-input-fui"
          placeholder="BUSCAR EMPLEADOS..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div className="employees-grid-fui">
          {filtered.map(employee => (
            <div key={employee.id} className="employee-card-fui">
              <div className="employee-header-fui">
                <div className="employee-avatar-fui">{employee.avatar}</div>
                <div className="employee-main-fui">
                  <div className="employee-name-fui">{employee.name}</div>
                  <div className="employee-role-fui">{employee.role}</div>
                </div>
              </div>

              <div className="employee-info-fui">
                <div className="info-row-fui">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>
                  </svg>
                  {employee.email}
                </div>
                <div className="info-row-fui">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  {employee.phone}
                </div>
                <div className="info-row-fui">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  DESDE {employee.startDate}
                </div>
              </div>

              <div className="employee-footer-fui">
                <span
                  className="badge-fui"
                  style={{
                    background: `${statusConfig[employee.status].color}15`,
                    borderColor: `${statusConfig[employee.status].color}40`,
                    color: statusConfig[employee.status].color
                  }}
                >
                  <span className="led" style={{ background: statusConfig[employee.status].color }} />
                  {statusConfig[employee.status].label}
                </span>
                <span
                  className="dept-badge-fui"
                  style={{
                    color: deptConfig[employee.department] || 'var(--color-text-4)',
                    borderColor: `${deptConfig[employee.department] || 'var(--color-border)'}40`
                  }}
                >
                  {employee.department.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
