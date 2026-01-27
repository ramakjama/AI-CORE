'use client';

import { useState } from 'react';

interface Message {
  id: string;
  to: string;
  subject: string;
  channel: 'email' | 'sms' | 'whatsapp';
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  sentAt: string;
}

const mockMessages: Message[] = [
  { id: '1', to: 'maria@ejemplo.es', subject: 'Recordatorio renovacion poliza', channel: 'email', status: 'delivered', sentAt: '2024-03-15 10:30' },
  { id: '2', to: '+34 612 345 678', subject: 'Confirmacion de pago recibido', channel: 'sms', status: 'delivered', sentAt: '2024-03-15 09:45' },
  { id: '3', to: '+34 623 456 789', subject: 'Documentacion pendiente', channel: 'whatsapp', status: 'sent', sentAt: '2024-03-15 09:15' },
  { id: '4', to: 'info@abc.es', subject: 'Propuesta comercial', channel: 'email', status: 'pending', sentAt: '2024-03-15 08:00' },
  { id: '5', to: 'ana@ejemplo.es', subject: 'Bienvenida nuevo cliente', channel: 'email', status: 'failed', sentAt: '2024-03-14 16:30' },
  { id: '6', to: '+34 634 567 890', subject: 'Cita confirmada', channel: 'whatsapp', status: 'delivered', sentAt: '2024-03-14 14:20' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  sent: { label: 'ENVIADO', color: '#00f5ff' },
  delivered: { label: 'ENTREGADO', color: '#4ade80' },
  failed: { label: 'FALLIDO', color: '#f87171' },
  pending: { label: 'PENDIENTE', color: '#ffd93d' },
};

const channelConfig: Record<string, { label: string; color: string }> = {
  email: { label: 'EMAIL', color: '#00f5ff' },
  sms: { label: 'SMS', color: '#a78bfa' },
  whatsapp: { label: 'WHATSAPP', color: '#25d366' },
};

export default function MessagesPage(): React.ReactElement {
  const [messages] = useState<Message[]>(mockMessages);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');

  const filtered = messages.filter(m => {
    const matchSearch = m.to.toLowerCase().includes(search.toLowerCase()) ||
                       m.subject.toLowerCase().includes(search.toLowerCase());
    const matchChannel = channelFilter === 'all' || m.channel === channelFilter;
    return matchSearch && matchChannel;
  });

  const stats = {
    total: messages.length,
    delivered: messages.filter(m => m.status === 'delivered').length,
    pending: messages.filter(m => m.status === 'pending').length,
    failed: messages.filter(m => m.status === 'failed').length,
  };

  return (
    <>
      <style>{`
        .messages-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 30px rgba(0,245,255,0.5); transform: translateY(-2px); }

        .stats-row-fui { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .stats-row-fui { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .stats-row-fui { grid-template-columns: 1fr; } }
        .stat-mini-fui { padding: 16px 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 10px; display: flex; align-items: center; gap: 16px; position: relative; overflow: hidden; }
        .stat-mini-fui::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
        .stat-mini-fui.cyan::before { background: var(--color-cyan); box-shadow: 0 0 10px var(--color-cyan); }
        .stat-mini-fui.green::before { background: #4ade80; box-shadow: 0 0 10px #4ade80; }
        .stat-mini-fui.yellow::before { background: #ffd93d; box-shadow: 0 0 10px #ffd93d; }
        .stat-mini-fui.red::before { background: #f87171; box-shadow: 0 0 10px #f87171; }
        .stat-icon-fui { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .stat-icon-fui svg { width: 20px; height: 20px; }
        .stat-info-fui { flex: 1; }
        .stat-label-fui { font-family: var(--font-mono); font-size: 0.6rem; color: var(--color-text-4); letter-spacing: 0.1em; margin-bottom: 4px; }
        .stat-value-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; }

        .channel-tabs-fui { display: flex; gap: 8px; flex-wrap: wrap; }
        .channel-tab-fui { padding: 10px 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
        .channel-tab-fui:hover { border-color: rgba(0,245,255,0.4); color: var(--color-text); }
        .channel-tab-fui.active { background: rgba(0,245,255,0.1); border-color: var(--color-cyan); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }
        .channel-tab-fui svg { width: 14px; height: 14px; }

        .filters-fui { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .search-input-fui { flex: 1; max-width: 400px; padding: 12px 16px 12px 44px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text); font-family: var(--font-mono); font-size: 0.85rem; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300f5ff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; background-size: 20px; }
        .search-input-fui:focus { outline: none; border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.2); }

        .messages-list-fui { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; position: relative; }
        .messages-list-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent); }

        .message-item-fui { display: flex; align-items: center; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--color-border); transition: all 0.2s; cursor: pointer; }
        .message-item-fui:last-child { border-bottom: none; }
        .message-item-fui:hover { background: rgba(0,245,255,0.03); }

        .channel-icon-fui { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid; }
        .channel-icon-fui svg { width: 20px; height: 20px; }

        .message-content-fui { flex: 1; min-width: 0; }
        .message-to-fui { font-family: var(--font-ui); font-size: 0.9rem; font-weight: 500; color: var(--color-text); margin-bottom: 4px; }
        .message-subject-fui { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .message-meta-fui { text-align: right; flex-shrink: 0; }
        .message-time-fui { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-4); margin-bottom: 6px; }

        .badge-fui { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui .led { width: 5px; height: 5px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }
      `}</style>

      <div className="messages-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">MENSAJES</h1>
            <span className="page-subtitle">COMUNICACIONES // {messages.length} ENVIADOS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            NUEVO MENSAJE
          </button>
        </div>

        <div className="stats-row-fui">
          <div className="stat-mini-fui cyan">
            <div className="stat-icon-fui" style={{ background: 'rgba(0,245,255,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#00f5ff" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </div>
            <div className="stat-info-fui">
              <div className="stat-label-fui">TOTAL ENVIADOS</div>
              <div className="stat-value-fui" style={{ color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.4)' }}>{stats.total}</div>
            </div>
          </div>
          <div className="stat-mini-fui green">
            <div className="stat-icon-fui" style={{ background: 'rgba(74,222,128,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
            </div>
            <div className="stat-info-fui">
              <div className="stat-label-fui">ENTREGADOS</div>
              <div className="stat-value-fui" style={{ color: '#4ade80', textShadow: '0 0 10px rgba(74,222,128,0.4)' }}>{stats.delivered}</div>
            </div>
          </div>
          <div className="stat-mini-fui yellow">
            <div className="stat-icon-fui" style={{ background: 'rgba(255,217,61,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#ffd93d" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            </div>
            <div className="stat-info-fui">
              <div className="stat-label-fui">PENDIENTES</div>
              <div className="stat-value-fui" style={{ color: '#ffd93d', textShadow: '0 0 10px rgba(255,217,61,0.4)' }}>{stats.pending}</div>
            </div>
          </div>
          <div className="stat-mini-fui red">
            <div className="stat-icon-fui" style={{ background: 'rgba(248,113,113,0.1)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            </div>
            <div className="stat-info-fui">
              <div className="stat-label-fui">FALLIDOS</div>
              <div className="stat-value-fui" style={{ color: '#f87171', textShadow: '0 0 10px rgba(248,113,113,0.4)' }}>{stats.failed}</div>
            </div>
          </div>
        </div>

        <div className="channel-tabs-fui">
          <button type="button" className={`channel-tab-fui ${channelFilter === 'all' ? 'active' : ''}`} onClick={() => setChannelFilter('all')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            TODOS
          </button>
          <button type="button" className={`channel-tab-fui ${channelFilter === 'email' ? 'active' : ''}`} onClick={() => setChannelFilter('email')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/></svg>
            EMAIL
          </button>
          <button type="button" className={`channel-tab-fui ${channelFilter === 'sms' ? 'active' : ''}`} onClick={() => setChannelFilter('sms')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg>
            SMS
          </button>
          <button type="button" className={`channel-tab-fui ${channelFilter === 'whatsapp' ? 'active' : ''}`} onClick={() => setChannelFilter('whatsapp')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            WHATSAPP
          </button>
        </div>

        <div className="filters-fui">
          <input
            type="text"
            className="search-input-fui"
            placeholder="BUSCAR MENSAJES..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="messages-list-fui">
          {filtered.map(msg => (
            <div key={msg.id} className="message-item-fui">
              <div
                className="channel-icon-fui"
                style={{
                  background: `${channelConfig[msg.channel].color}10`,
                  borderColor: `${channelConfig[msg.channel].color}40`,
                  color: channelConfig[msg.channel].color
                }}
              >
                {msg.channel === 'email' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M22 6l-10 7L2 6"/>
                  </svg>
                )}
                {msg.channel === 'sms' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
                  </svg>
                )}
                {msg.channel === 'whatsapp' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                  </svg>
                )}
              </div>
              <div className="message-content-fui">
                <div className="message-to-fui">{msg.to}</div>
                <div className="message-subject-fui">{msg.subject}</div>
              </div>
              <div className="message-meta-fui">
                <div className="message-time-fui">{msg.sentAt}</div>
                <span
                  className="badge-fui"
                  style={{
                    background: `${statusConfig[msg.status].color}15`,
                    borderColor: `${statusConfig[msg.status].color}40`,
                    color: statusConfig[msg.status].color
                  }}
                >
                  <span className="led" style={{ background: statusConfig[msg.status].color }} />
                  {statusConfig[msg.status].label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
