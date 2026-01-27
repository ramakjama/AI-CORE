'use client';

import { useState } from 'react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  concept: string;
  client: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const mockTransactions: Transaction[] = [
  { id: '1', type: 'income', concept: 'Prima Seguro Auto', client: 'Maria Garcia', amount: 450.00, date: '2024-03-15', status: 'completed' },
  { id: '2', type: 'income', concept: 'Prima Seguro Hogar', client: 'Carlos Lopez', amount: 280.00, date: '2024-03-14', status: 'completed' },
  { id: '3', type: 'expense', concept: 'Comision Agente', client: '-', amount: 120.00, date: '2024-03-14', status: 'completed' },
  { id: '4', type: 'income', concept: 'Prima Seguro Vida', client: 'Ana Martinez', amount: 680.00, date: '2024-03-13', status: 'pending' },
  { id: '5', type: 'expense', concept: 'Gasto Operativo', client: '-', amount: 85.00, date: '2024-03-12', status: 'completed' },
  { id: '6', type: 'income', concept: 'Prima Seguro Empresa', client: 'Tech Solutions', amount: 2400.00, date: '2024-03-11', status: 'completed' },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  completed: { label: 'COMPLETADO', color: '#4ade80' },
  pending: { label: 'PENDIENTE', color: '#ffd93d' },
  cancelled: { label: 'CANCELADO', color: '#f87171' },
};

export default function FinancePage(): React.ReactElement {
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [filter, setFilter] = useState('all');

  const totalIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const pendingAmount = transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  return (
    <>
      <style>{`
        .finance-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }
        .header-actions-fui { display: flex; gap: 12px; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 30px rgba(0,245,255,0.5); transform: translateY(-2px); }
        .btn-secondary-fui { padding: 12px 24px; background: var(--color-surface); color: var(--color-text-3); border: 1px solid var(--color-border); border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 500; letter-spacing: 0.05em; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
        .btn-secondary-fui:hover { border-color: rgba(0,245,255,0.4); color: var(--color-cyan); }

        .summary-grid-fui { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1200px) { .summary-grid-fui { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 640px) { .summary-grid-fui { grid-template-columns: 1fr; } }
        .summary-card-fui { padding: 24px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; position: relative; overflow: hidden; }
        .summary-card-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
        .summary-card-fui::after { content: ''; position: absolute; bottom: 0; right: 0; width: 60px; height: 60px; opacity: 0.03; background-size: contain; background-repeat: no-repeat; }
        .summary-card-fui.income::before { background: linear-gradient(90deg, transparent, #4ade80, transparent); }
        .summary-card-fui.expense::before { background: linear-gradient(90deg, transparent, #f87171, transparent); }
        .summary-card-fui.balance::before { background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); }
        .summary-card-fui.pending::before { background: linear-gradient(90deg, transparent, #ffd93d, transparent); }
        .summary-label-fui { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.15em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .summary-label-fui svg { width: 14px; height: 14px; opacity: 0.6; }
        .summary-value-fui { font-family: var(--font-display); font-size: 2rem; font-weight: 700; margin-bottom: 8px; }
        .summary-value-fui.income { color: #4ade80; text-shadow: 0 0 20px rgba(74,222,128,0.4); }
        .summary-value-fui.expense { color: #f87171; text-shadow: 0 0 20px rgba(248,113,113,0.4); }
        .summary-value-fui.balance { color: var(--color-cyan); text-shadow: 0 0 20px rgba(0,245,255,0.4); }
        .summary-value-fui.pending { color: #ffd93d; text-shadow: 0 0 20px rgba(255,217,61,0.4); }
        .summary-change { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-4); }
        .summary-change.positive { color: #4ade80; }
        .summary-change.negative { color: #f87171; }

        .filter-tabs-fui { display: flex; gap: 8px; }
        .filter-tab-fui { padding: 10px 20px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 6px; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); cursor: pointer; letter-spacing: 0.05em; transition: all 0.2s; }
        .filter-tab-fui:hover { border-color: rgba(0,245,255,0.4); color: var(--color-text); }
        .filter-tab-fui.active { background: rgba(0,245,255,0.1); border-color: var(--color-cyan); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }

        .transactions-container-fui { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; position: relative; }
        .transactions-container-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,245,255,0.5), transparent); }
        .card-header-fui { padding: 16px 24px; border-bottom: 1px solid var(--color-border); display: flex; justify-content: space-between; align-items: center; background: linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%); }
        .card-title-fui { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; color: var(--color-cyan); letter-spacing: 0.1em; }

        .table-fui { width: 100%; border-collapse: collapse; }
        .table-fui th { text-align: left; padding: 14px 24px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; color: var(--color-cyan); text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid var(--color-border); background: var(--color-surface-2); }
        .table-fui td { padding: 16px 24px; font-family: var(--font-ui); font-size: 0.85rem; color: var(--color-text); border-bottom: 1px solid var(--color-border); }
        .table-fui tbody tr { transition: all 0.2s; }
        .table-fui tbody tr:hover { background: rgba(0,245,255,0.03); }
        .table-fui tbody tr:last-child td { border-bottom: none; }

        .type-indicator-fui { display: flex; align-items: center; gap: 10px; }
        .type-led { width: 8px; height: 8px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; box-shadow: 0 0 10px currentColor; } }
        .type-led.income { background: #4ade80; color: #4ade80; }
        .type-led.expense { background: #f87171; color: #f87171; }
        .type-label { font-family: var(--font-mono); font-size: 0.7rem; letter-spacing: 0.05em; }
        .type-label.income { color: #4ade80; }
        .type-label.expense { color: #f87171; }

        .amount-fui { font-family: var(--font-display); font-weight: 700; font-size: 1rem; }
        .amount-fui.income { color: #4ade80; text-shadow: 0 0 10px rgba(74,222,128,0.3); }
        .amount-fui.expense { color: #f87171; text-shadow: 0 0 10px rgba(248,113,113,0.3); }

        .badge-fui { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui .led { width: 5px; height: 5px; border-radius: 50%; animation: pulse 2s ease-in-out infinite; }

        .date-fui { font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-3); }
      `}</style>

      <div className="finance-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">FINANZAS</h1>
            <span className="page-subtitle">CONTROL FINANCIERO // {transactions.length} TRANSACCIONES</span>
          </div>
          <div className="header-actions-fui">
            <button type="button" className="btn-secondary-fui">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
              </svg>
              EXPORTAR
            </button>
            <button type="button" className="btn-primary-fui">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
              NUEVA TRANSACCION
            </button>
          </div>
        </div>

        <div className="summary-grid-fui">
          <div className="summary-card-fui income">
            <div className="summary-label-fui">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              INGRESOS MES
            </div>
            <div className="summary-value-fui income">€{totalIncome.toLocaleString()}</div>
            <div className="summary-change positive">▲ +12% VS MES ANTERIOR</div>
          </div>
          <div className="summary-card-fui expense">
            <div className="summary-label-fui">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              GASTOS MES
            </div>
            <div className="summary-value-fui expense">€{totalExpense.toLocaleString()}</div>
            <div className="summary-change negative">▼ -5% VS MES ANTERIOR</div>
          </div>
          <div className="summary-card-fui balance">
            <div className="summary-label-fui">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
              BALANCE NETO
            </div>
            <div className="summary-value-fui balance">€{balance.toLocaleString()}</div>
            <div className="summary-change">MARGEN: {((balance / totalIncome) * 100).toFixed(1)}%</div>
          </div>
          <div className="summary-card-fui pending">
            <div className="summary-label-fui">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              PENDIENTE COBRO
            </div>
            <div className="summary-value-fui pending">€{pendingAmount.toLocaleString()}</div>
            <div className="summary-change">{transactions.filter(t => t.status === 'pending').length} TRANSACCIONES</div>
          </div>
        </div>

        <div className="filter-tabs-fui">
          <button type="button" className={`filter-tab-fui ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>TODAS</button>
          <button type="button" className={`filter-tab-fui ${filter === 'income' ? 'active' : ''}`} onClick={() => setFilter('income')}>INGRESOS</button>
          <button type="button" className={`filter-tab-fui ${filter === 'expense' ? 'active' : ''}`} onClick={() => setFilter('expense')}>GASTOS</button>
        </div>

        <div className="transactions-container-fui">
          <div className="card-header-fui">
            <span className="card-title-fui">◇ ULTIMAS TRANSACCIONES</span>
          </div>
          <table className="table-fui">
            <thead>
              <tr>
                <th>TIPO</th>
                <th>CONCEPTO</th>
                <th>CLIENTE</th>
                <th>FECHA</th>
                <th>IMPORTE</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td>
                    <div className="type-indicator-fui">
                      <span className={`type-led ${tx.type}`} />
                      <span className={`type-label ${tx.type}`}>{tx.type === 'income' ? 'INGRESO' : 'GASTO'}</span>
                    </div>
                  </td>
                  <td>{tx.concept}</td>
                  <td>{tx.client}</td>
                  <td><span className="date-fui">{tx.date}</span></td>
                  <td>
                    <span className={`amount-fui ${tx.type}`}>
                      {tx.type === 'expense' ? '-' : '+'}€{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge-fui"
                      style={{
                        background: `${statusConfig[tx.status].color}15`,
                        borderColor: `${statusConfig[tx.status].color}40`,
                        color: statusConfig[tx.status].color
                      }}
                    >
                      <span className="led" style={{ background: statusConfig[tx.status].color }} />
                      {statusConfig[tx.status].label}
                    </span>
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
