'use client';

import { useState } from 'react';

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'planning' | 'active' | 'onhold' | 'completed';
  progress: number;
  dueDate: string;
  team: string[];
}

const mockProjects: Project[] = [
  { id: '1', name: 'Migracion Sistema Legacy', client: 'Grupo Soriano', status: 'active', progress: 65, dueDate: '2024-04-15', team: ['MG', 'CL', 'AM'] },
  { id: '2', name: 'Portal Cliente B2B', client: 'ABC Seguros', status: 'active', progress: 40, dueDate: '2024-05-01', team: ['PS', 'LD'] },
  { id: '3', name: 'Integracion API Aseguradoras', client: 'Interno', status: 'planning', progress: 10, dueDate: '2024-06-01', team: ['MG'] },
  { id: '4', name: 'App Movil Clientes', client: 'Interno', status: 'onhold', progress: 25, dueDate: '2024-07-01', team: ['CL', 'AM'] },
  { id: '5', name: 'Automatizacion Renovaciones', client: 'Interno', status: 'completed', progress: 100, dueDate: '2024-03-01', team: ['PS', 'MG', 'LD'] },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: 'PLANIFICACION', color: '#94a3b8' },
  active: { label: 'EN PROGRESO', color: '#00f5ff' },
  onhold: { label: 'EN ESPERA', color: '#ffd93d' },
  completed: { label: 'COMPLETADO', color: '#4ade80' },
};

export default function ProjectsPage(): React.ReactElement {
  const [projects] = useState<Project[]>(mockProjects);

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    onhold: projects.filter(p => p.status === 'onhold').length,
  };

  return (
    <>
      <style>{`
        .projects-fui { display: flex; flex-direction: column; gap: 24px; }
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

        .projects-grid-fui { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
        @media (max-width: 480px) { .projects-grid-fui { grid-template-columns: 1fr; } }

        .project-card-fui { padding: 24px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 16px; position: relative; overflow: hidden; transition: all 0.2s; }
        .project-card-fui:hover { border-color: rgba(0,245,255,0.4); box-shadow: 0 0 30px rgba(0,245,255,0.1); transform: translateY(-2px); }
        .project-card-fui::before, .project-card-fui::after { content: ''; position: absolute; width: 12px; height: 12px; border-color: var(--color-cyan); border-style: solid; opacity: 0.4; }
        .project-card-fui::before { top: 10px; left: 10px; border-width: 1px 0 0 1px; }
        .project-card-fui::after { bottom: 10px; right: 10px; border-width: 0 1px 1px 0; }

        .project-header-fui { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .project-name-fui { font-family: var(--font-ui); font-size: 1.1rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px; }
        .project-client-fui { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.05em; }

        .badge-fui { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui .led { width: 5px; height: 5px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }

        .project-progress-fui { margin-bottom: 24px; }
        .progress-header-fui { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .progress-label-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.1em; }
        .progress-value-fui { font-family: var(--font-display); font-size: 0.9rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.4); }
        .progress-bar-fui { height: 8px; background: var(--color-surface-3); border-radius: 4px; overflow: hidden; position: relative; }
        .progress-bar-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); }
        .progress-fill-fui { height: 100%; border-radius: 4px; transition: width 0.5s ease-out; position: relative; }
        .progress-fill-fui::after { content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 20px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3)); animation: shimmer 1.5s ease-in-out infinite; }
        @keyframes shimmer { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }

        .project-footer-fui { display: flex; justify-content: space-between; align-items: center; padding-top: 20px; border-top: 1px solid var(--color-border); }

        .team-avatars-fui { display: flex; }
        .team-avatar-fui { width: 36px; height: 36px; background: var(--color-surface-3); border: 2px solid var(--color-surface); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; color: var(--color-text-3); margin-left: -10px; transition: all 0.2s; }
        .team-avatar-fui:first-child { margin-left: 0; }
        .team-avatar-fui:hover { transform: scale(1.1); z-index: 1; border-color: var(--color-cyan); color: var(--color-cyan); }

        .due-date-fui { display: flex; align-items: center; gap: 8px; font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-4); padding: 6px 12px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 6px; }
        .due-date-fui svg { width: 14px; height: 14px; color: var(--color-cyan); }
        .due-date-fui.overdue { color: #f87171; border-color: rgba(248,113,113,0.3); }
        .due-date-fui.overdue svg { color: #f87171; }
      `}</style>

      <div className="projects-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">PROYECTOS</h1>
            <span className="page-subtitle">GESTION DE DESARROLLO // {projects.length} ACTIVOS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            NUEVO PROYECTO
          </button>
        </div>

        <div className="stats-grid-fui">
          <div className="stat-card-fui" style={{ borderBottomColor: 'var(--color-cyan)' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--color-cyan)' }} />
            <div className="stat-value-fui" style={{ color: 'var(--color-cyan)', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{stats.total}</div>
            <div className="stat-label-fui">TOTAL PROYECTOS</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#00f5ff' }} />
            <div className="stat-value-fui" style={{ color: '#00f5ff', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{stats.active}</div>
            <div className="stat-label-fui">EN PROGRESO</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#4ade80' }} />
            <div className="stat-value-fui" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{stats.completed}</div>
            <div className="stat-label-fui">COMPLETADOS</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#ffd93d' }} />
            <div className="stat-value-fui" style={{ color: '#ffd93d', textShadow: '0 0 15px rgba(255,217,61,0.4)' }}>{stats.onhold}</div>
            <div className="stat-label-fui">EN ESPERA</div>
          </div>
        </div>

        <div className="projects-grid-fui">
          {projects.map(project => (
            <div key={project.id} className="project-card-fui">
              <div className="project-header-fui">
                <div>
                  <div className="project-name-fui">{project.name}</div>
                  <div className="project-client-fui">{project.client}</div>
                </div>
                <span
                  className="badge-fui"
                  style={{
                    background: `${statusConfig[project.status].color}15`,
                    borderColor: `${statusConfig[project.status].color}40`,
                    color: statusConfig[project.status].color
                  }}
                >
                  <span className="led" style={{ background: statusConfig[project.status].color }} />
                  {statusConfig[project.status].label}
                </span>
              </div>

              <div className="project-progress-fui">
                <div className="progress-header-fui">
                  <span className="progress-label-fui">PROGRESO</span>
                  <span className="progress-value-fui">{project.progress}%</span>
                </div>
                <div className="progress-bar-fui">
                  <div
                    className="progress-fill-fui"
                    style={{
                      width: `${project.progress}%`,
                      background: project.progress === 100
                        ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                        : 'linear-gradient(90deg, var(--color-cyan), #06b6d4)',
                      boxShadow: project.progress === 100
                        ? '0 0 15px rgba(74,222,128,0.5)'
                        : '0 0 15px rgba(0,245,255,0.5)'
                    }}
                  />
                </div>
              </div>

              <div className="project-footer-fui">
                <div className="team-avatars-fui">
                  {project.team.map((member, idx) => (
                    <div key={idx} className="team-avatar-fui">{member}</div>
                  ))}
                </div>
                <div className="due-date-fui">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  {project.dueDate}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
