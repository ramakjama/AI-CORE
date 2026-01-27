'use client';

import { useState } from 'react';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'spreadsheet';
  category: 'contract' | 'invoice' | 'id' | 'report' | 'other';
  client: string;
  uploadedAt: string;
  size: string;
  status: 'verified' | 'pending' | 'rejected';
}

const mockDocuments: Document[] = [
  { id: '1', name: 'Poliza_Auto_2024.pdf', type: 'pdf', category: 'contract', client: 'Maria Garcia', uploadedAt: '2024-03-15', size: '2.4 MB', status: 'verified' },
  { id: '2', name: 'DNI_Anverso.jpg', type: 'image', category: 'id', client: 'Carlos Lopez', uploadedAt: '2024-03-14', size: '1.2 MB', status: 'pending' },
  { id: '3', name: 'Contrato_Hogar.pdf', type: 'pdf', category: 'contract', client: 'Ana Martinez', uploadedAt: '2024-03-14', size: '3.1 MB', status: 'verified' },
  { id: '4', name: 'Factura_Reparacion.pdf', type: 'pdf', category: 'invoice', client: 'Pedro Sanchez', uploadedAt: '2024-03-13', size: '856 KB', status: 'rejected' },
  { id: '5', name: 'Presupuesto_2024.xlsx', type: 'spreadsheet', category: 'report', client: 'Laura Diaz', uploadedAt: '2024-03-12', size: '1.8 MB', status: 'verified' },
  { id: '6', name: 'Informe_Siniestro.pdf', type: 'pdf', category: 'report', client: 'Tech Solutions', uploadedAt: '2024-03-11', size: '4.2 MB', status: 'verified' },
];

const typeConfig: Record<string, { color: string; icon: string }> = {
  pdf: { color: '#f87171', icon: '📄' },
  image: { color: '#4ade80', icon: '🖼️' },
  doc: { color: '#60a5fa', icon: '📝' },
  spreadsheet: { color: '#4ade80', icon: '📊' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  verified: { label: 'VERIFICADO', color: '#4ade80' },
  pending: { label: 'PENDIENTE', color: '#ffd93d' },
  rejected: { label: 'RECHAZADO', color: '#f87171' },
};

const categoryConfig: Record<string, { label: string; icon: string }> = {
  contract: { label: 'CONTRATO', icon: '📋' },
  invoice: { label: 'FACTURA', icon: '🧾' },
  id: { label: 'IDENTIDAD', icon: '🪪' },
  report: { label: 'INFORME', icon: '📊' },
  other: { label: 'OTRO', icon: '📁' },
};

export default function DocumentsPage(): React.ReactElement {
  const [documents] = useState<Document[]>(mockDocuments);
  const [search, setSearch] = useState('');

  const filtered = documents.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.client.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <style>{`
        .docs-fui { display: flex; flex-direction: column; gap: 24px; }
        .page-header-fui { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; display: flex; align-items: center; gap: 10px; box-shadow: 0 0 20px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 30px rgba(0,245,255,0.5); transform: translateY(-2px); }
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 1024px) { .stats-row { grid-template-columns: repeat(2, 1fr); } }
        .stat-card-fui { padding: 20px; background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 10px; position: relative; }
        .stat-card-fui::before, .stat-card-fui::after { content: ''; position: absolute; width: 8px; height: 8px; border-color: var(--color-cyan); border-style: solid; opacity: 0.6; }
        .stat-card-fui::before { top: 8px; left: 8px; border-width: 1px 0 0 1px; }
        .stat-card-fui::after { bottom: 8px; right: 8px; border-width: 0 1px 1px 0; }
        .stat-value { font-family: var(--font-display); font-size: 2rem; font-weight: 700; line-height: 1; }
        .stat-label { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.15em; margin-top: 8px; }
        .search-input-fui { flex: 1; max-width: 400px; padding: 12px 16px 12px 44px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text); font-family: var(--font-mono); font-size: 0.85rem; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2300f5ff'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; background-size: 20px; }
        .search-input-fui:focus { outline: none; border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.2); }
        .table-container-fui { background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; position: relative; }
        .table-container-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); opacity: 0.5; }
        .table-fui { width: 100%; border-collapse: collapse; }
        .table-fui th { text-align: left; padding: 16px 20px; font-family: var(--font-mono); font-size: 0.65rem; font-weight: 600; color: var(--color-cyan); text-transform: uppercase; letter-spacing: 0.15em; border-bottom: 1px solid var(--color-border); background: rgba(0,245,255,0.03); }
        .table-fui th::before { content: '▸ '; opacity: 0.5; }
        .table-fui td { padding: 16px 20px; font-size: 0.875rem; color: var(--color-text); border-bottom: 1px solid var(--color-border); }
        .table-fui tbody tr:hover { background: rgba(0,245,255,0.03); }
        .doc-info { display: flex; align-items: center; gap: 14px; }
        .doc-icon { width: 44px; height: 44px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
        .doc-name { font-family: var(--font-ui); font-weight: 500; margin-bottom: 2px; }
        .doc-meta { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); letter-spacing: 0.05em; }
        .badge-fui { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 4px; font-family: var(--font-mono); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.05em; border: 1px solid; }
        .badge-fui.verified::before { content: ''; width: 5px; height: 5px; background: currentColor; border-radius: 50%; box-shadow: 0 0 6px currentColor; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .actions-fui { display: flex; gap: 8px; }
        .btn-icon-fui { width: 34px; height: 34px; background: transparent; border: 1px solid var(--color-border); border-radius: 6px; color: var(--color-text-3); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .btn-icon-fui:hover { background: rgba(0,245,255,0.1); border-color: var(--color-cyan); color: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.2); }
        .btn-icon-fui svg { width: 14px; height: 14px; }
        .upload-zone { border: 2px dashed var(--color-border); border-radius: 12px; padding: 40px; text-align: center; background: rgba(0,245,255,0.02); transition: all 0.2s; cursor: pointer; }
        .upload-zone:hover { border-color: var(--color-cyan); background: rgba(0,245,255,0.05); }
        .upload-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .upload-text { font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-text-3); letter-spacing: 0.1em; }
        .upload-hint { font-family: var(--font-mono); font-size: 0.65rem; color: var(--color-text-4); margin-top: 8px; }
      `}</style>

      <div className="docs-fui">
        <div className="page-header-fui">
          <div>
            <h1 className="page-title-fui">DOCUMENTOS</h1>
            <span className="page-subtitle">GESTOR DE ARCHIVOS // {documents.length} REGISTROS</span>
          </div>
          <button type="button" className="btn-primary-fui">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
            SUBIR DOCUMENTO
          </button>
        </div>

        <div className="stats-row">
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#00f5ff', textShadow: '0 0 15px rgba(0,245,255,0.4)' }}>{documents.length}</div>
            <div className="stat-label">TOTAL DOCUMENTOS</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#4ade80', textShadow: '0 0 15px rgba(74,222,128,0.4)' }}>{documents.filter(d => d.status === 'verified').length}</div>
            <div className="stat-label">VERIFICADOS</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#ffd93d', textShadow: '0 0 15px rgba(255,217,61,0.4)' }}>{documents.filter(d => d.status === 'pending').length}</div>
            <div className="stat-label">PENDIENTES</div>
          </div>
          <div className="stat-card-fui">
            <div className="stat-value" style={{ color: '#f87171', textShadow: '0 0 15px rgba(248,113,113,0.4)' }}>{documents.filter(d => d.status === 'rejected').length}</div>
            <div className="stat-label">RECHAZADOS</div>
          </div>
        </div>

        <div className="upload-zone">
          <div className="upload-icon">📤</div>
          <div className="upload-text">ARRASTRA ARCHIVOS AQUÍ O HAZ CLIC PARA SELECCIONAR</div>
          <div className="upload-hint">PDF, JPG, PNG, XLSX hasta 10MB</div>
        </div>

        <input type="text" className="search-input-fui" placeholder="BUSCAR DOCUMENTOS..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '100%' }} />

        <div className="table-container-fui">
          <table className="table-fui">
            <thead>
              <tr><th>Documento</th><th>Categoría</th><th>Cliente</th><th>Fecha</th><th>Tamaño</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id}>
                  <td>
                    <div className="doc-info">
                      <div className="doc-icon" style={{ borderColor: `${typeConfig[doc.type].color}40` }}>{typeConfig[doc.type].icon}</div>
                      <div>
                        <div className="doc-name">{doc.name}</div>
                        <div className="doc-meta">{doc.type.toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge-fui" style={{ background: 'var(--color-surface-2)', borderColor: 'var(--color-border)', color: 'var(--color-text-3)' }}>{categoryConfig[doc.category].icon} {categoryConfig[doc.category].label}</span></td>
                  <td style={{ fontFamily: 'var(--font-ui)' }}>{doc.client}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{doc.uploadedAt}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--color-text-3)' }}>{doc.size}</td>
                  <td><span className={`badge-fui ${doc.status}`} style={{ background: `${statusConfig[doc.status].color}15`, borderColor: `${statusConfig[doc.status].color}40`, color: statusConfig[doc.status].color }}>{statusConfig[doc.status].label}</span></td>
                  <td>
                    <div className="actions-fui">
                      <button type="button" className="btn-icon-fui" title="Ver"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                      <button type="button" className="btn-icon-fui" title="Descargar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg></button>
                      <button type="button" className="btn-icon-fui" title="Eliminar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg></button>
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
