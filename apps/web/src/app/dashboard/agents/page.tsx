'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'assistant' | 'automation' | 'analysis' | 'integration';
  status: 'active' | 'idle' | 'error';
  runs: number;
  lastRun: string;
  successRate: number;
  avgResponseTime: string;
  capabilities: string[];
}

const initialAgents: Agent[] = [
  {
    id: 'agent-1',
    code: 'AGT-001',
    name: 'Renewal Assistant',
    description: 'Gestiona automaticamente los recordatorios de renovacion de polizas. Analiza fechas de vencimiento, envia notificaciones y prepara propuestas.',
    type: 'automation',
    status: 'active',
    runs: 1247,
    lastRun: '2m ago',
    successRate: 98.5,
    avgResponseTime: '1.2s',
    capabilities: ['Policy Analysis', 'Email Automation', 'Proposal Generation', 'Auto Tracking']
  },
  {
    id: 'agent-2',
    code: 'AGT-002',
    name: 'Document Classifier',
    description: 'Analiza y clasifica documentos entrantes usando vision por computador e IA. Detecta tipo de documento y extrae datos clave.',
    type: 'analysis',
    status: 'active',
    runs: 3892,
    lastRun: '30s ago',
    successRate: 96.8,
    avgResponseTime: '2.5s',
    capabilities: ['Advanced OCR', 'Auto Classification', 'Data Extraction', 'Validation']
  },
  {
    id: 'agent-3',
    code: 'AGT-003',
    name: 'Support Assistant',
    description: 'Responde consultas frecuentes de clientes via chat, email y WhatsApp. Deriva casos complejos a agentes humanos.',
    type: 'assistant',
    status: 'active',
    runs: 892,
    lastRun: '5m ago',
    successRate: 94.2,
    avgResponseTime: '0.8s',
    capabilities: ['Multichannel', 'Auto FAQ', 'Smart Routing', 'Sentiment Analysis']
  },
  {
    id: 'agent-4',
    code: 'AGT-004',
    name: 'Claims Analyzer',
    description: 'Analiza reclamaciones entrantes, detecta patrones sospechosos de fraude y prioriza casos segun urgencia.',
    type: 'analysis',
    status: 'idle',
    runs: 456,
    lastRun: '1h ago',
    successRate: 99.1,
    avgResponseTime: '3.8s',
    capabilities: ['Fraud Detection', 'Risk Analysis', 'Auto Priority', 'Detailed Reports']
  }
];

const typeConfig: Record<string, { label: string; color: string }> = {
  assistant: { label: 'ASSISTANT', color: '#4ade80' },
  automation: { label: 'AUTOMATION', color: '#ffd93d' },
  analysis: { label: 'ANALYSIS', color: '#00f5ff' },
  integration: { label: 'INTEGRATION', color: '#a78bfa' }
};

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: 'ONLINE', color: '#4ade80' },
  idle: { label: 'STANDBY', color: '#ffd93d' },
  error: { label: 'ERROR', color: '#f87171' }
};

export default function AgentsPage(): React.ReactElement {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);

  const handleToggleStatus = (agentId: string) => {
    setAgents(prev => prev.map(agent => {
      if (agent.id === agentId) {
        return { ...agent, status: agent.status === 'active' ? 'idle' : 'active' };
      }
      return agent;
    }));
  };

  const totalRuns = agents.reduce((acc, a) => acc + a.runs, 0);
  const activeCount = agents.filter(a => a.status === 'active').length;
  const avgSuccessRate = agents.reduce((acc, a) => acc + a.successRate, 0) / agents.length;

  return (
    <>
      <style>{`
        .agents-fui { display: flex; flex-direction: column; gap: 24px; }
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
        .stat-card-fui::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
        .stat-label-fui { font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-text-4); letter-spacing: 0.15em; margin-bottom: 8px; }
        .stat-value-fui { font-family: var(--font-display); font-size: 2rem; font-weight: 700; }

        .agents-grid-fui { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 1100px) { .agents-grid-fui { grid-template-columns: 1fr; } }

        .agent-card-fui { padding: 24px; background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 16px; position: relative; overflow: hidden; transition: all 0.25s; }
        .agent-card-fui::before, .agent-card-fui::after { content: ''; position: absolute; width: 16px; height: 16px; border-color: var(--color-cyan); border-style: solid; opacity: 0.4; transition: opacity 0.25s; }
        .agent-card-fui::before { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
        .agent-card-fui::after { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }
        .agent-card-fui:hover { border-color: rgba(0,245,255,0.5); box-shadow: 0 0 40px rgba(0,245,255,0.15); }
        .agent-card-fui:hover::before, .agent-card-fui:hover::after { opacity: 1; }
        .agent-card-fui.active { border-color: rgba(0,245,255,0.3); }

        .agent-header-fui { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
        .agent-icon-wrap-fui { position: relative; }
        .agent-icon-fui { width: 56px; height: 56px; background: linear-gradient(135deg, var(--color-surface-2) 0%, var(--color-surface-3) 100%); border: 1px solid rgba(0,245,255,0.3); border-radius: 14px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(0,245,255,0.1); }
        .agent-icon-fui svg { width: 28px; height: 28px; color: var(--color-cyan); filter: drop-shadow(0 0 6px rgba(0,245,255,0.5)); }
        .status-led-fui { position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; border-radius: 50%; border: 3px solid var(--color-surface); animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }

        .agent-meta-fui { text-align: right; }
        .agent-code-fui { font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-text-4); letter-spacing: 0.1em; margin-bottom: 6px; }
        .agent-type-fui { display: inline-block; padding: 4px 12px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.1em; border: 1px solid; }

        .agent-name-fui { font-family: var(--font-display); font-size: 1.2rem; font-weight: 700; color: var(--color-text); letter-spacing: 0.05em; margin-bottom: 8px; }
        .agent-description-fui { font-family: var(--font-ui); font-size: 0.8rem; color: var(--color-text-3); line-height: 1.6; margin-bottom: 16px; min-height: 50px; }

        .capabilities-section-fui { margin-bottom: 20px; }
        .capabilities-label-fui { font-family: var(--font-mono); font-size: 0.55rem; color: var(--color-text-4); letter-spacing: 0.15em; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
        .capabilities-label-fui::before { content: '//'; color: var(--color-cyan); }
        .capabilities-list-fui { display: flex; flex-wrap: wrap; gap: 6px; }
        .capability-tag-fui { padding: 5px 12px; background: rgba(0,245,255,0.05); border: 1px solid rgba(0,245,255,0.2); border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-cyan); letter-spacing: 0.05em; transition: all 0.15s; }
        .capability-tag-fui:hover { background: rgba(0,245,255,0.1); border-color: rgba(0,245,255,0.4); }

        .metrics-bar-fui { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 16px 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); margin-bottom: 16px; }
        .metric-fui { text-align: center; }
        .metric-value-fui { font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.3); margin-bottom: 4px; }
        .metric-label-fui { font-family: var(--font-mono); font-size: 0.55rem; color: var(--color-text-4); letter-spacing: 0.1em; }

        .agent-actions-fui { display: flex; gap: 10px; }
        .btn-toggle-fui { flex: 1; padding: 10px 16px; background: transparent; border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; transition: all 0.15s; }
        .btn-toggle-fui.pause { color: #ffd93d; border-color: rgba(255,217,61,0.3); }
        .btn-toggle-fui.pause:hover { background: rgba(255,217,61,0.1); border-color: #ffd93d; }
        .btn-toggle-fui.activate { color: #4ade80; border-color: rgba(74,222,128,0.3); }
        .btn-toggle-fui.activate:hover { background: rgba(74,222,128,0.1); border-color: #4ade80; }
        .btn-config-fui { flex: 1; padding: 10px 16px; background: transparent; border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.1em; color: var(--color-text-3); cursor: pointer; transition: all 0.15s; }
        .btn-config-fui:hover { background: var(--color-surface-2); border-color: rgba(0,245,255,0.4); color: var(--color-text); }
        .btn-execute-fui { flex: 1; padding: 10px 16px; background: var(--color-cyan); border: none; border-radius: 6px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; color: var(--color-void); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 0 15px rgba(0,245,255,0.3); }
        .btn-execute-fui:hover:not(:disabled) { box-shadow: 0 0 25px rgba(0,245,255,0.5); transform: translateY(-1px); }
        .btn-execute-fui:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-execute-fui svg { width: 12px; height: 12px; }
      `}</style>

      <div className="agents-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">NEURAL NETWORK</h1>
            <span className="page-subtitle">AI AGENT CONTROL // {agents.length} UNIDADES</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            DEPLOY AGENT
          </button>
        </div>

        <div className="stats-grid-fui">
          <div className="stat-card-fui" style={{ borderLeftColor: 'var(--color-cyan)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: 'var(--color-cyan)' }} />
            <div className="stat-label-fui">TOTAL UNITS</div>
            <div className="stat-value-fui" style={{ color: 'var(--color-cyan)', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{agents.length}</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#4ade80' }} />
            <div className="stat-label-fui">ACTIVE</div>
            <div className="stat-value-fui" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{activeCount}</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#a78bfa' }} />
            <div className="stat-label-fui">EXECUTIONS</div>
            <div className="stat-value-fui" style={{ color: '#a78bfa', textShadow: '0 0 15px rgba(167,139,250,0.4)' }}>{totalRuns.toLocaleString()}</div>
          </div>
          <div className="stat-card-fui">
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: '#ffd93d' }} />
            <div className="stat-label-fui">SUCCESS RATE</div>
            <div className="stat-value-fui" style={{ color: '#ffd93d', textShadow: '0 0 15px rgba(255,217,61,0.4)' }}>{avgSuccessRate.toFixed(1)}%</div>
          </div>
        </div>

        <div className="agents-grid-fui">
          {agents.map(agent => (
            <div key={agent.id} className={`agent-card-fui ${agent.status === 'active' ? 'active' : ''}`}>
              <div className="agent-header-fui">
                <div className="agent-icon-wrap-fui">
                  <div className="agent-icon-fui">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {agent.type === 'assistant' && (
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
                      )}
                      {agent.type === 'automation' && (
                        <>
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
                        </>
                      )}
                      {agent.type === 'analysis' && (
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      )}
                      {agent.type === 'integration' && (
                        <>
                          <rect x="2" y="2" width="8" height="8" rx="2"/>
                          <rect x="14" y="2" width="8" height="8" rx="2"/>
                          <rect x="2" y="14" width="8" height="8" rx="2"/>
                          <rect x="14" y="14" width="8" height="8" rx="2"/>
                        </>
                      )}
                    </svg>
                  </div>
                  <span
                    className="status-led-fui"
                    style={{
                      background: statusConfig[agent.status].color,
                      boxShadow: `0 0 10px ${statusConfig[agent.status].color}`
                    }}
                  />
                </div>
                <div className="agent-meta-fui">
                  <div className="agent-code-fui">UNIT_ID: {agent.code}</div>
                  <span
                    className="agent-type-fui"
                    style={{
                      color: typeConfig[agent.type].color,
                      borderColor: `${typeConfig[agent.type].color}60`,
                      background: `${typeConfig[agent.type].color}15`
                    }}
                  >
                    {typeConfig[agent.type].label}
                  </span>
                </div>
              </div>

              <h3 className="agent-name-fui">{agent.name}</h3>
              <p className="agent-description-fui">{agent.description}</p>

              <div className="capabilities-section-fui">
                <div className="capabilities-label-fui">CAPABILITIES</div>
                <div className="capabilities-list-fui">
                  {agent.capabilities.map((cap, idx) => (
                    <span key={idx} className="capability-tag-fui">{cap}</span>
                  ))}
                </div>
              </div>

              <div className="metrics-bar-fui">
                <div className="metric-fui">
                  <div className="metric-value-fui">{agent.runs.toLocaleString()}</div>
                  <div className="metric-label-fui">EXECUTIONS</div>
                </div>
                <div className="metric-fui">
                  <div className="metric-value-fui" style={{ color: '#4ade80' }}>{agent.successRate}%</div>
                  <div className="metric-label-fui">SUCCESS</div>
                </div>
                <div className="metric-fui">
                  <div className="metric-value-fui" style={{ color: 'var(--color-text-3)' }}>{agent.avgResponseTime}</div>
                  <div className="metric-label-fui">AVG TIME</div>
                </div>
              </div>

              <div className="agent-actions-fui">
                <button
                  type="button"
                  className={`btn-toggle-fui ${agent.status === 'active' ? 'pause' : 'activate'}`}
                  onClick={() => handleToggleStatus(agent.id)}
                >
                  {agent.status === 'active' ? 'PAUSE' : 'ACTIVATE'}
                </button>
                <button type="button" className="btn-config-fui">CONFIG</button>
                <button
                  type="button"
                  className="btn-execute-fui"
                  disabled={agent.status !== 'active'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  EXECUTE
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
