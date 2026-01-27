'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AITIcon } from '@/components/Logo';
// import { ThemeToggle } from '@/components/ThemeProvider'; // Disabled - causes error without provider

interface NavItem {
  name: string;
  code: string;
  href: string;
  icon: ReactNode;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', code: 'DASH', href: '/dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M9 22V12h6v10"/></svg> },
  { name: 'Clientes', code: 'CLNT', href: '/dashboard/clients', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { name: 'Polizas', code: 'PLCY', href: '/dashboard/policies', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg> },
  { name: 'Leads', code: 'LEAD', href: '/dashboard/leads', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg> },
  { name: 'Documentos', code: 'DOCS', href: '/dashboard/documents', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z"/></svg> },
  { name: 'Finanzas', code: 'FINC', href: '/dashboard/finance', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
  { name: 'Mensajes', code: 'COMM', href: '/dashboard/messages', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/></svg> },
  { name: 'Proyectos', code: 'PROJ', href: '/dashboard/projects', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
  { name: 'Workflows', code: 'FLOW', href: '/dashboard/workflows', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l4 4-4 4M17 3H7M11 21l4-4-4-4M21 17H11"/></svg> },
  { name: 'RRHH', code: 'HR', href: '/dashboard/hr', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { name: 'Agentes IA', code: 'AI', href: '/dashboard/agents', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> },
  { name: 'Integraciones', code: 'INTG', href: '/dashboard/integrations', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="8" height="8" rx="2"/><rect x="14" y="2" width="8" height="8" rx="2"/><rect x="2" y="14" width="8" height="8" rx="2"/><rect x="14" y="14" width="8" height="8" rx="2"/><path d="M6 10v4M10 6h4M18 10v4M10 18h4"/></svg> },
  { name: 'Analytics', code: 'ANLY', href: '/dashboard/analytics', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  { name: 'Config', code: 'CONF', href: '/dashboard/settings', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
];

export default function DashboardLayout({ children }: { children: ReactNode }): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser({ name: 'ADMIN', email: 'admin@ain-tech.cloud' });
      }
    }

    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const sidebarWidth = collapsed ? '72px' : '240px';
  const currentPage = navigation.find(n => n.href === pathname);

  return (
    <>
      <style>{`
        /* ═══ FUI COMMAND CENTER LAYOUT ═══ */
        .fui-layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-bg);
          position: relative;
        }

        /* ═══ SIDEBAR - COMMAND MODULE ═══ */
        .fui-sidebar {
          width: ${sidebarWidth};
          background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-surface-2) 100%);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          transition: width 0.25s ease;
          box-shadow: 0 0 30px rgba(0, 245, 255, 0.05);
        }

        .fui-sidebar::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, var(--color-cyan) 0%, transparent 30%, transparent 70%, var(--color-cyan) 100%);
          opacity: 0.5;
        }

        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          gap: 14px;
          position: relative;
        }

        .sidebar-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 20px;
          right: 20px;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--color-cyan), transparent);
          opacity: 0.5;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          opacity: ${collapsed ? '0' : '1'};
          transition: opacity 0.2s;
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.2em;
          color: var(--color-cyan);
          text-shadow: 0 0 10px var(--color-cyan-glow);
        }

        .brand-version {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-4);
          letter-spacing: 0.1em;
        }

        .collapse-btn {
          position: absolute;
          right: -14px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border-glow);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-cyan);
          transition: all 0.2s;
          z-index: 10;
        }

        .collapse-btn:hover {
          background: var(--color-cyan-soft);
          box-shadow: var(--glow-sm);
        }

        /* ═══ NAVIGATION ═══ */
        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
        }

        .nav-section {
          margin-bottom: 8px;
        }

        .nav-section-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-4);
          letter-spacing: 0.15em;
          padding: 8px 12px 4px;
          text-transform: uppercase;
          opacity: ${collapsed ? '0' : '1'};
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin-bottom: 2px;
          border-radius: 6px;
          color: var(--color-text-3);
          text-decoration: none;
          transition: all 0.15s;
          position: relative;
          border: 1px solid transparent;
        }

        .nav-link:hover {
          background: var(--color-cyan-subtle);
          color: var(--color-cyan);
          border-color: var(--color-border);
        }

        .nav-link.active {
          background: var(--color-cyan-soft);
          color: var(--color-cyan);
          border-color: var(--color-cyan);
          box-shadow: 0 0 15px var(--color-cyan-glow), inset 0 0 20px var(--color-cyan-faint);
        }

        .nav-link.active::before {
          content: '▶';
          position: absolute;
          left: -8px;
          font-size: 8px;
          color: var(--color-cyan);
          animation: pulse-arrow 1.5s infinite;
        }

        @keyframes pulse-arrow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .nav-link svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          transition: filter 0.2s;
        }

        .nav-link.active svg,
        .nav-link:hover svg {
          filter: drop-shadow(0 0 4px var(--color-cyan));
        }

        .nav-text {
          display: flex;
          flex-direction: column;
          opacity: ${collapsed ? '0' : '1'};
          transition: opacity 0.2s;
        }

        .nav-name {
          font-size: 13px;
          font-weight: 500;
        }

        .nav-code {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-text-4);
          letter-spacing: 0.1em;
        }

        /* ═══ SIDEBAR FOOTER ═══ */
        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--color-border);
          background: var(--color-surface-2);
        }

        .user-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          margin-bottom: 12px;
        }

        .user-avatar {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, var(--color-cyan-soft), var(--color-surface-3));
          border: 1px solid var(--color-cyan);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 14px;
          color: var(--color-cyan);
          flex-shrink: 0;
          box-shadow: 0 0 10px var(--color-cyan-glow);
        }

        .user-info {
          overflow: hidden;
          opacity: ${collapsed ? '0' : '1'};
          transition: opacity 0.2s;
        }

        .user-name {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .user-role {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--color-success);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-role::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--color-success);
          border-radius: 50%;
          box-shadow: 0 0 6px var(--color-success-glow);
          animation: pulse-green 2s infinite;
        }

        .logout-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text-3);
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          display: ${collapsed ? 'none' : 'flex'};
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .logout-btn:hover {
          background: var(--color-error-soft);
          border-color: var(--color-error);
          color: var(--color-error);
        }

        /* ═══ MAIN CONTENT ═══ */
        .fui-main {
          flex: 1;
          margin-left: ${sidebarWidth};
          transition: margin-left 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        /* ═══ TOPBAR - STATUS BAR ═══ */
        .fui-topbar {
          height: 52px;
          background: linear-gradient(90deg, var(--color-surface) 0%, var(--color-surface-2) 50%, var(--color-surface) 100%);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .fui-topbar::before,
        .fui-topbar::after {
          content: '◢◤';
          font-size: 10px;
          color: var(--color-cyan);
          opacity: 0.6;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .page-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-code {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-cyan);
          background: var(--color-cyan-soft);
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid var(--color-cyan);
          letter-spacing: 0.1em;
        }

        .page-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .page-divider {
          width: 1px;
          height: 20px;
          background: var(--color-border);
        }

        .system-time {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--color-text-3);
          letter-spacing: 0.1em;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: var(--color-cyan);
          box-shadow: var(--glow-sm);
        }

        .search-box svg {
          width: 14px;
          height: 14px;
          color: var(--color-text-4);
        }

        .search-box input {
          background: none;
          border: none;
          outline: none;
          color: var(--color-text);
          font-family: var(--font-mono);
          font-size: 12px;
          width: 160px;
          padding: 0;
        }

        .search-box input::placeholder {
          color: var(--color-text-4);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--color-success-soft);
          border: 1px solid var(--color-success);
          border-radius: 4px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: var(--color-success);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--color-success-glow);
          animation: pulse-green 2s infinite;
        }

        .status-text {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-success);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ═══ CONTENT AREA ═══ */
        .fui-content {
          flex: 1;
          padding: 24px;
          position: relative;
        }

        /* Corner decorations */
        .fui-content::before,
        .fui-content::after {
          content: '';
          position: fixed;
          width: 40px;
          height: 40px;
          border-color: var(--color-cyan);
          border-style: solid;
          opacity: 0.3;
          pointer-events: none;
        }

        .fui-content::before {
          bottom: 20px;
          left: ${sidebarWidth};
          margin-left: 20px;
          border-width: 0 0 2px 2px;
        }

        .fui-content::after {
          bottom: 20px;
          right: 20px;
          border-width: 0 2px 2px 0;
        }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 1024px) {
          .fui-sidebar { width: 72px; }
          .brand-text, .nav-text, .user-info, .logout-btn, .nav-section-label {
            display: none !important;
            opacity: 0 !important;
          }
          .fui-main { margin-left: 72px; }
          .search-box { display: none; }
          .fui-content::before { left: 92px; }
        }

        @media (max-width: 768px) {
          .status-indicator { display: none; }
          .system-time { display: none; }
        }
      `}</style>

      <div className="fui-layout">
        <aside className="fui-sidebar">
          <div className="sidebar-header">
            <AITIcon size={32} glow animated />
            <div className="brand-text">
              <span className="brand-name">AIT-CORE</span>
              <span className="brand-version">v2.1.0 // COMMAND CENTER</span>
            </div>
          </div>

          <button
            type="button"
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir' : 'Colapsar'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>

          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="nav-section-label">// MODULES</div>
              {navigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                >
                  {item.icon}
                  <div className="nav-text">
                    <span className="nav-name">{item.name}</span>
                    <span className="nav-code">{item.code}</span>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          <div className="sidebar-footer">
            <div className="user-card">
              <div className="user-avatar">{user?.name?.charAt(0) || 'A'}</div>
              <div className="user-info">
                <div className="user-name">{user?.name || 'ADMIN'}</div>
                <div className="user-role">LEVEL_5 // ONLINE</div>
              </div>
            </div>
            <button type="button" className="logout-btn" onClick={handleLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              DISCONNECT
            </button>
          </div>
        </aside>

        <main className="fui-main">
          <header className="fui-topbar">
            <div className="topbar-left">
              <div className="page-indicator">
                <span className="page-code">{currentPage?.code || 'SYS'}</span>
                <span className="page-title">{currentPage?.name || 'System'}</span>
              </div>
              <div className="page-divider" />
              <span className="system-time">{currentTime}</span>
            </div>

            <div className="topbar-right">
              <div className="search-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                <input type="text" placeholder="SEARCH QUERY..." />
              </div>
              <div className="status-indicator">
                <div className="status-dot" />
                <span className="status-text">SYSTEM ONLINE</span>
              </div>
              {/* Theme toggle removed */}
            </div>
          </header>

          <div className="fui-content">{children}</div>
        </main>
      </div>
    </>
  );
}
