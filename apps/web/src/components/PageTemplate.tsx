'use client';

import { type ReactNode } from 'react';

interface PageTemplateProps {
  title: string;
  subtitle?: string;
  icon: string;
  module: string;
  breadcrumb?: { label: string; path?: string }[];
  actions?: ReactNode;
  children?: ReactNode;
  stats?: { label: string; value: string | number; change?: string; changeType?: 'positive' | 'negative' | 'neutral' }[];
}

export function PageTemplate({
  title,
  subtitle,
  icon,
  module,
  breadcrumb = [],
  actions,
  children,
  stats,
}: PageTemplateProps): React.ReactElement {
  return (
    <>
      <style>{`
        .page-template {
          min-height: 100%;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--color-border);
        }

        .page-header-left {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .page-icon {
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--soriano-red-soft);
          border: 1px solid var(--soriano-red);
          border-radius: 14px;
          font-size: 1.75rem;
          box-shadow: 0 0 20px var(--soriano-red-glow);
        }

        .page-title-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .page-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--color-text-4);
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-item a {
          color: var(--color-text-3);
          text-decoration: none;
          transition: color 0.15s;
        }

        .breadcrumb-item a:hover {
          color: var(--soriano-red);
        }

        .breadcrumb-separator {
          color: var(--color-text-4);
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .page-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-3);
          margin: 0;
        }

        .page-module-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          font-size: 0.6875rem;
          font-weight: 600;
          color: var(--color-text-3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 8px;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          padding: 20px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          border-color: var(--color-border-strong);
          transform: translateY(-2px);
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-text-3);
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .stat-change {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 4px;
        }

        .stat-change.positive { color: var(--color-success); }
        .stat-change.negative { color: var(--color-error); }
        .stat-change.neutral { color: var(--color-text-3); }

        .page-content {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 24px;
          min-height: 400px;
        }

        .page-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .page-empty-icon {
          font-size: 4rem;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .page-empty-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 8px;
        }

        .page-empty-text {
          font-size: 0.875rem;
          color: var(--color-text-3);
          max-width: 400px;
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, var(--soriano-red) 0%, var(--soriano-red-dark) 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--soriano-red-glow);
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          color: var(--color-text);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: var(--color-surface-hover);
          border-color: var(--color-border-strong);
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 16px;
          }

          .page-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .page-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="page-template">
        <header className="page-header">
          <div className="page-header-left">
            <div className="page-icon">{icon}</div>
            <div className="page-title-group">
              {breadcrumb.length > 0 && (
                <nav className="page-breadcrumb">
                  {breadcrumb.map((item, index) => (
                    <span key={item.label} className="breadcrumb-item">
                      {item.path ? (
                        <a href={item.path}>{item.label}</a>
                      ) : (
                        <span>{item.label}</span>
                      )}
                      {index < breadcrumb.length - 1 && (
                        <span className="breadcrumb-separator">›</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
              <span className="page-module-badge">
                <span>📂</span>
                {module}
              </span>
            </div>
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </header>

        {stats && stats.length > 0 && (
          <div className="page-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="stat-label">{stat.label}</p>
                <p className="stat-value">{stat.value}</p>
                {stat.change && (
                  <p className={`stat-change ${stat.changeType || 'neutral'}`}>
                    {stat.changeType === 'positive' ? '▲' : stat.changeType === 'negative' ? '▼' : '●'} {stat.change}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="page-content">
          {children || (
            <div className="page-empty">
              <span className="page-empty-icon">{icon}</span>
              <h3 className="page-empty-title">{title}</h3>
              <p className="page-empty-text">
                Este módulo está en desarrollo. Pronto estará disponible con todas sus funcionalidades.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PageTemplate;
