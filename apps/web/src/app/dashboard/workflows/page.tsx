'use client';

import { useState } from 'react';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: 'active' | 'inactive' | 'draft';
  executions: number;
  lastRun: string;
  steps: number;
}

const mockWorkflows: Workflow[] = [
  { id: '1', name: 'Renovacion Automatica', description: 'Envia recordatorios 30 dias antes del vencimiento', trigger: 'Fecha vencimiento', status: 'active', executions: 1247, lastRun: 'Hace 2 min', steps: 5 },
  { id: '2', name: 'Bienvenida Cliente', description: 'Email de bienvenida con documentacion inicial', trigger: 'Nuevo cliente', status: 'active', executions: 892, lastRun: 'Hace 15 min', steps: 3 },
  { id: '3', name: 'Alerta Siniestro', description: 'Notifica al equipo cuando se registra un siniestro', trigger: 'Nuevo siniestro', status: 'active', executions: 156, lastRun: 'Hace 1 hora', steps: 4 },
  { id: '4', name: 'Reporte Semanal', description: 'Genera y envia informe de actividad semanal', trigger: 'Programado (Lunes)', status: 'active', executions: 52, lastRun: 'Hace 2 dias', steps: 6 },
  { id: '5', name: 'Validacion Documentos', description: 'Verifica documentos subidos automaticamente', trigger: 'Nuevo documento', status: 'inactive', executions: 3241, lastRun: 'Hace 1 semana', steps: 4 },
  { id: '6', name: 'Lead Scoring', description: 'Calcula puntuacion de leads automaticamente', trigger: 'Actualizacion lead', status: 'draft', executions: 0, lastRun: '-', steps: 7 },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'ACTIVO', color: '#4ade80' },
  inactive: { label: 'INACTIVO', color: '#94a3b8' },
  draft: { label: 'BORRADOR', color: '#ffd93d' },
};

export default function WorkflowsPage(): React.ReactElement {
  const [workflows] = useState<Workflow[]>(mockWorkflows);

  const totalExecutions = workflows.reduce((acc, w) => acc + w.executions, 0);
  const activeCount = workflows.filter(w => w.status === 'active').length;

  return (
    <>
      <style>{`
        .workflows-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 30px rgba(0,245,255,0.5); transform: translateY(-2px); }

        .stats-grid-fui { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 768px) { .stats-grid-fui { grid-template-columns: 1fr; } }
        .stat-card-fui { padding: 20px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; position: relative; overflow: hidden; text-align: center; }
        .stat-card-fui::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; }
        .stat-value-fui { font-family: var(--font-display); font-size: 2.5rem; font-weight: 700; margin-bottom: 8px; }
        .stat-label-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.1em; }

        .workflows-list-fui { display: flex; flex-direction: column; gap: 12px; }

        .workflow-card-fui { padding: 20px 24px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; display: flex; align-items: center; gap: 20px; position: relative; overflow: hidden; transition: all 0.2s; }
        .workflow-card-fui:hover { border-color: rgba(0,245,255,0.4); box-shadow: 0 0 20px rgba(0,245,255,0.1); }
        .workflow-card-fui::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; transition: all 0.2s; }
        .workflow-card-fui.active::before { background: #4ade80; box-shadow: 0 0 10px #4ade80; }
        .workflow-card-fui.inactive::before { background: #94a3b8; }
        .workflow-card-fui.draft::before { background: #ffd93d; box-shadow: 0 0 10px #ffd93d; }

        .workflow-icon-fui { width: 52px; height: 52px; background: linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-surface-3) 100%); border: 1px solid var(--color-border); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .workflow-icon-fui svg { width: 26px; height: 26px; color: var(--color-cyan); filter: drop-shadow(0 0 6px rgba(0,245,255,0.5)); }
        .workflow-card-fui.active .workflow-icon-fui svg { color: #4ade80; filter: drop-shadow(0 0 6px rgba(74,222,128,0.5)); }

        .workflow-info-fui { flex: 1; min-width: 0; }
        .workflow-name-fui { font-family: var(--font-ui); font-size: 1rem; font-weight: 600; color: var(--color-text); margin-bottom: 4px; }
        .workflow-description-fui { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); margin-bottom: 10px; }
        .workflow-meta-fui { display: flex; gap: 20px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-4); }
        .workflow-meta-fui span { display: flex; align-items: center; gap: 6px; }
        .workflow-meta-fui svg { width: 12px; height: 12px; color: var(--color-cyan); }

        .workflow-stats-fui { display: flex; gap: 32px; flex-shrink: 0; }
        .workflow-stat-fui { text-align: center; }
        .workflow-stat-value-fui { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.3); margin-bottom: 4px; }
        .workflow-stat-label-fui { font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-text-4); letter-spacing: 0.05em; }

        .workflow-actions-fui { display: flex; gap: 10px; flex-shrink: 0; align-items: center; }
        .badge-fui { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui .led { width: 5px; height: 5px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }

        .btn-action-fui { padding: 8px 16px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .btn-action-fui:hover { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.4); color: var(--color-cyan); }

        @media (max-width: 900px) {
          .workflow-card-fui { flex-wrap: wrap; }
          .workflow-stats-fui { width: 100%; justify-content: flex-start; gap: 24px; padding-top: 16px; margin-top: 16px; border-top: 1px solid var(--color-border); }
        }
      `}</style>

      <div className="workflows-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">WORKFLOWS</h1>
            <span className="page-subtitle">AUTOMATIZACIONES // {workflows.length} FLUJOS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            NUEVO WORKFLOW
          </button>
        </div>

        <div className="stats-grid-fui">
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--color-cyan)' }} />
            <div className="stat-value-fui" style={{ color: 'var(--color-cyan)', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{workflows.length}</div>
            <div className="stat-label-fui">TOTAL WORKFLOWS</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#4ade80' }} />
            <div className="stat-value-fui" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{activeCount}</div>
            <div className="stat-label-fui">ACTIVOS</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#a78bfa' }} />
            <div className="stat-value-fui" style={{ color: '#a78bfa', textShadow: '0 0 15px rgba(167,139,250,0.4)' }}>{totalExecutions.toLocaleString()}</div>
            <div className="stat-label-fui">EJECUCIONES TOTALES</div>
          </div>
        </div>

        <div className="workflows-list-fui">
          {workflows.map(workflow => (
            <div key={workflow.id} className={`workflow-card-fui ${workflow.status}`}>
              <div className="workflow-icon-fui">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l4 4-4 4M17 3H7M11 21l4-4-4-4M21 17H11"/>
                </svg>
              </div>

              <div className="workflow-info-fui">
                <div className="workflow-name-fui">{workflow.name}</div>
                <div className="workflow-description-fui">{workflow.description}</div>
                <div className="workflow-meta-fui">
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    {workflow.trigger}
                  </span>
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
                    </svg>
                    {workflow.steps} PASOS
                  </span>
                </div>
              </div>

              <div className="workflow-stats-fui">
                <div className="workflow-stat-fui">
                  <div className="workflow-stat-value-fui">{workflow.executions.toLocaleString()}</div>
                  <div className="workflow-stat-label-fui">EJECUCIONES</div>
                </div>
                <div className="workflow-stat-fui">
                  <div className="workflow-stat-value-fui" style={{ color: 'var(--color-text-3)', textShadow: 'none', fontSize: '0.9rem' }}>{workflow.lastRun}</div>
                  <div className="workflow-stat-label-fui">ULTIMA</div>
                </div>
              </div>

              <div className="workflow-actions-fui">
                <span
                  className="badge-fui"
                  style={{
                    background: `${statusConfig[workflow.status].color}15`,
                    borderColor: `${statusConfig[workflow.status].color}40`,
                    color: statusConfig[workflow.status].color
                  }}
                >
                  <span className="led" style={{ background: statusConfig[workflow.status].color }} />
                  {statusConfig[workflow.status].label}
                </span>
                <button type="button" className="btn-action-fui">EDITAR</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
