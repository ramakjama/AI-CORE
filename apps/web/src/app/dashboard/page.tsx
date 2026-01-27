'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { navigationConfig, quickActions, userMenuItems, systemStats, type NavItem, type NavSection } from '@/config/navigation';

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATED HOOKS
// ═══════════════════════════════════════════════════════════════════════════

function useAnimatedValue(target: number, duration: number = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [target, duration]);

  return value;
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function NavItemComponent({
  item,
  level = 1,
  expandedItems,
  toggleExpand,
  activePath,
  onNavigate,
}: {
  item: NavItem;
  level?: number;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
  activePath: string;
  onNavigate: (path: string) => void;
}) {
  const isExpanded = expandedItems.has(item.id);
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === activePath;

  return (
    <div className={`nav-item-wrapper level-${level}`}>
      <button
        type="button"
        className={`nav-item-multi ${isActive ? 'active' : ''} ${hasChildren && isExpanded ? 'expanded' : ''}`}
        onClick={() => {
          if (hasChildren) {
            toggleExpand(item.id);
          } else if (item.path) {
            onNavigate(item.path);
          }
        }}
      >
        <span className="nav-item-icon">{item.icon}</span>
        <span className="nav-item-label">{item.label}</span>
        {item.badge && (
          <span className={`nav-badge ${item.badgeType || 'info'}`}>{item.badge}</span>
        )}
        {hasChildren && (
          <span className={`nav-expand-icon ${isExpanded ? 'rotated' : ''}`}>
            ›
          </span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div className="nav-children">
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              activePath={activePath}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MultilevelSidebar({
  sections,
  expandedItems,
  toggleExpand,
  activePath,
  onNavigate,
  collapsed,
  toggleCollapse,
}: {
  sections: NavSection[];
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
  activePath: string;
  onNavigate: (path: string) => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}) {
  return (
    <aside className={`sidebar-ultra ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-ultra">
        <div className="brand-logo-container">
          <div className="brand-shield">
            <svg viewBox="0 0 40 44" fill="none">
              <path d="M20 0L40 8v16c0 11-8.5 18-20 20C8.5 42 0 35 0 24V8l20-8z" fill="url(#shieldGrad)"/>
              <path d="M20 4L36 10.5v13c0 9-7 15-16 16.5-9-1.5-16-7.5-16-16.5v-13L20 4z" fill="#0a0a0a"/>
              <text x="20" y="28" textAnchor="middle" fill="#E30613" fontSize="16" fontWeight="bold" fontFamily="Inter">S</text>
              <defs>
                <linearGradient id="shieldGrad" x1="0" y1="0" x2="40" y2="44">
                  <stop stopColor="#E30613"/>
                  <stop offset="1" stopColor="#8B0309"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          {!collapsed && (
            <div className="brand-text-ultra">
              <span className="brand-name-ultra">SORIANO</span>
              <span className="brand-sub-ultra">MEDIADORES</span>
            </div>
          )}
        </div>
        <button type="button" className="collapse-btn" onClick={toggleCollapse} title={collapsed ? 'Expandir' : 'Contraer'}>
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav-ultra">
        {sections.map((section) => (
          <div key={section.id} className="nav-section-ultra">
            {!collapsed && <p className="nav-section-title-ultra">{section.title}</p>}
            <div className="nav-section-items">
              {section.items.map((item) => (
                <NavItemComponent
                  key={item.id}
                  item={item}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                  activePath={activePath}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Stats */}
      {!collapsed && (
        <div className="sidebar-footer-ultra">
          <div className="system-stats-ultra">
            <div className="stat-mini">
              <span className="stat-mini-value">{systemStats.databases}</span>
              <span className="stat-mini-label">DBs</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">{systemStats.aiAgents}</span>
              <span className="stat-mini-label">AI Agents</span>
            </div>
            <div className="stat-mini">
              <span className="stat-mini-value">{systemStats.uptime}</span>
              <span className="stat-mini-label">Uptime</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI & CHART COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function KPICardUltra({ title, value, change, changeType, icon, gradient }: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  gradient: string;
}) {
  const animatedValue = typeof value === 'number' ? useAnimatedValue(value) : value;

  return (
    <div className="kpi-card-ultra">
      <div className="kpi-glow" style={{ background: gradient }} />
      <div className="kpi-content-ultra">
        <div className="kpi-icon-ultra" style={{ background: gradient }}>
          <span>{icon}</span>
        </div>
        <div className="kpi-info-ultra">
          <p className="kpi-title-ultra">{title}</p>
          <p className="kpi-value-ultra">{typeof value === 'number' ? animatedValue.toLocaleString() : value}</p>
          {change && (
            <p className={`kpi-change-ultra ${changeType}`}>
              {changeType === 'positive' ? '▲' : changeType === 'negative' ? '▼' : '●'} {change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniChartUltra({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <svg viewBox="0 0 120 50" className="mini-chart-ultra">
      <defs>
        <linearGradient id={`chartGrad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M 0 50 ${data.map((v, i) => `L ${(i / (data.length - 1)) * 120} ${50 - ((v - min) / range) * 40}`).join(' ')} L 120 50 Z`}
        fill={`url(#chartGrad-${color.replace('#', '')})`}
      />
      <path
        d={`M 0 ${50 - ((data[0] - min) / range) * 40} ${data.map((v, i) => `L ${(i / (data.length - 1)) * 120} ${50 - ((v - min) / range) * 40}`).join(' ')}`}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
      />
    </svg>
  );
}

function QuickActionUltra({ action, onNavigate }: {
  action: typeof quickActions[0];
  onNavigate: (path: string) => void;
}) {
  return (
    <button
      type="button"
      className="quick-action-ultra"
      onClick={() => onNavigate(action.path)}
      style={{ '--action-color': action.color } as React.CSSProperties}
    >
      <span className="qa-icon-ultra">{action.icon}</span>
      <span className="qa-label-ultra">{action.label}</span>
    </button>
  );
}

function ActivityItemUltra({ type, title, subtitle, time, status }: {
  type: 'policy' | 'client' | 'message' | 'task' | 'ai';
  title: string;
  subtitle: string;
  time: string;
  status?: 'success' | 'warning' | 'info' | 'error';
}) {
  const icons = { policy: '📋', client: '👤', message: '✉️', task: '✓', ai: '🤖' };

  return (
    <div className="activity-item-ultra">
      <div className={`activity-icon-ultra ${type}`}>{icons[type]}</div>
      <div className="activity-content-ultra">
        <p className="activity-title-ultra">{title}</p>
        <p className="activity-subtitle-ultra">{subtitle}</p>
      </div>
      <div className="activity-meta-ultra">
        {status && <span className={`activity-dot ${status}`} />}
        <span className="activity-time-ultra">{time}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function DashboardPage(): React.ReactElement | null {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['dashboard', 'core']));
  const [activePath, setActivePath] = useState('/dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) return null;

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleNavigate = (path: string) => {
    setActivePath(path);
    // router.push(path); // Uncomment when routes are ready
  };

  const revenueData = [45, 52, 48, 55, 60, 58, 65, 70, 68, 75, 80, 85];
  const clientsData = [120, 125, 130, 128, 135, 140, 138, 145, 150, 155, 160, 165];
  const claimsData = [8, 12, 10, 15, 11, 9, 13, 10, 8, 7, 9, 6];

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════════════════════════════
           SORIANO MEDIADORES - ULTRA PREMIUM CORPORATE ERP DASHBOARD
           Enterprise-Grade UI with 3-Level Navigation
           ═══════════════════════════════════════════════════════════════════════════ */

        * { margin: 0; padding: 0; box-sizing: border-box; }

        :root {
          --soriano-red: #E30613;
          --soriano-red-dark: #8B0309;
          --soriano-red-light: #FF4D4D;
          --soriano-red-glow: rgba(227, 6, 19, 0.5);
          --soriano-red-soft: rgba(227, 6, 19, 0.12);
          --soriano-red-subtle: rgba(227, 6, 19, 0.06);
          --color-bg: #0a0a0a;
          --color-surface: #111111;
          --color-surface-2: #1a1a1a;
          --color-surface-3: #222222;
          --color-surface-hover: #2a2a2a;
          --color-text: #f5f5f7;
          --color-text-2: #a1a1a6;
          --color-text-3: #6e6e73;
          --color-text-4: #48484a;
          --color-border: rgba(255, 255, 255, 0.08);
          --color-border-strong: rgba(255, 255, 255, 0.15);
          --color-divider: rgba(255, 255, 255, 0.04);
          --color-success: #34C759;
          --color-success-soft: rgba(52, 199, 89, 0.12);
          --color-warning: #FF9500;
          --color-warning-soft: rgba(255, 149, 0, 0.12);
          --color-error: #FF3B30;
          --color-error-soft: rgba(255, 59, 48, 0.12);
          --color-info: #007AFF;
          --color-info-soft: rgba(0, 122, 255, 0.12);
          --sidebar-width: 280px;
          --sidebar-collapsed: 72px;
          --topbar-height: 64px;
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.5);
          --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.6);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.7);
          --shadow-glow: 0 0 40px rgba(227, 6, 19, 0.15);
        }

        body {
          font-family: var(--font-sans);
          background: var(--color-bg);
          color: var(--color-text);
          min-height: 100vh;
          line-height: 1.5;
          -webkit-font-smoothing: antialiased;
        }

        /* ═══════════════════════════════════════════════════════════════════════════
           ULTRA PREMIUM SIDEBAR - 3 LEVEL NAVIGATION
           ═══════════════════════════════════════════════════════════════════════════ */

        .sidebar-ultra {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--sidebar-width);
          background: linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%);
          border-right: 1px solid var(--color-border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-ultra.collapsed {
          width: var(--sidebar-collapsed);
        }

        .sidebar-ultra::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(180deg, var(--soriano-red) 0%, transparent 50%, var(--soriano-red) 100%);
          opacity: 0.3;
        }

        /* Brand Header */
        .sidebar-brand-ultra {
          padding: 20px;
          border-bottom: 1px solid var(--color-divider);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 72px;
        }

        .brand-logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .brand-shield {
          width: 40px;
          height: 44px;
          flex-shrink: 0;
        }

        .brand-shield svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 2px 8px rgba(227, 6, 19, 0.3));
        }

        .brand-text-ultra {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .brand-name-ultra {
          font-size: 1.125rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #fff 0%, #ccc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-sub-ultra {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: var(--soriano-red);
          text-transform: uppercase;
        }

        .collapse-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 6px;
          color: var(--color-text-3);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .collapse-btn:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
          border-color: var(--color-border-strong);
        }

        /* Navigation Sections */
        .sidebar-nav-ultra {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-nav-ultra::-webkit-scrollbar {
          width: 4px;
        }

        .sidebar-nav-ultra::-webkit-scrollbar-thumb {
          background: var(--color-border-strong);
          border-radius: 2px;
        }

        .nav-section-ultra {
          margin-bottom: 24px;
        }

        .nav-section-title-ultra {
          font-size: 0.625rem;
          font-weight: 700;
          color: var(--color-text-4);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          padding: 8px 12px;
          margin-bottom: 4px;
        }

        /* Multi-level Navigation Items */
        .nav-item-wrapper {
          margin-bottom: 2px;
        }

        .nav-item-wrapper.level-2 {
          padding-left: 12px;
        }

        .nav-item-wrapper.level-3 {
          padding-left: 24px;
        }

        .nav-item-multi {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--color-text-2);
          font-size: 0.875rem;
          font-weight: 500;
          font-family: var(--font-sans);
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          position: relative;
        }

        .nav-item-multi:hover {
          background: var(--color-surface-2);
          color: var(--color-text);
        }

        .nav-item-multi.active {
          background: var(--soriano-red-soft);
          color: var(--soriano-red);
        }

        .nav-item-multi.active::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 60%;
          background: var(--soriano-red);
          border-radius: 0 3px 3px 0;
        }

        .nav-item-multi.expanded {
          background: var(--color-surface-2);
        }

        .nav-item-icon {
          font-size: 1.125rem;
          width: 24px;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-item-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .nav-badge {
          padding: 2px 6px;
          font-size: 0.625rem;
          font-weight: 700;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .nav-badge.info { background: var(--color-info-soft); color: var(--color-info); }
        .nav-badge.warning { background: var(--color-warning-soft); color: var(--color-warning); }
        .nav-badge.success { background: var(--color-success-soft); color: var(--color-success); }
        .nav-badge.error { background: var(--color-error-soft); color: var(--color-error); }

        .nav-expand-icon {
          color: var(--color-text-4);
          font-size: 1rem;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .nav-expand-icon.rotated {
          transform: rotate(90deg);
        }

        .nav-children {
          margin-top: 2px;
          padding-top: 2px;
          border-left: 1px solid var(--color-divider);
          margin-left: 22px;
        }

        /* Level 2 & 3 items */
        .level-2 .nav-item-multi,
        .level-3 .nav-item-multi {
          padding: 8px 10px;
          font-size: 0.8125rem;
        }

        .level-2 .nav-item-icon,
        .level-3 .nav-item-icon {
          font-size: 0.9375rem;
          width: 20px;
        }

        /* Footer Stats */
        .sidebar-footer-ultra {
          padding: 16px;
          border-top: 1px solid var(--color-divider);
          background: var(--color-surface);
        }

        .system-stats-ultra {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }

        .stat-mini {
          flex: 1;
          text-align: center;
          padding: 8px;
          background: var(--color-surface-2);
          border-radius: 8px;
        }

        .stat-mini-value {
          display: block;
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .stat-mini-label {
          display: block;
          font-size: 0.5625rem;
          color: var(--color-text-4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ═══════════════════════════════════════════════════════════════════════════
           MAIN CONTENT AREA
           ═══════════════════════════════════════════════════════════════════════════ */

        .main-ultra {
          margin-left: var(--sidebar-width);
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--color-bg);
        }

        .sidebar-ultra.collapsed ~ .main-ultra {
          margin-left: var(--sidebar-collapsed);
        }

        /* Top Bar */
        .topbar-ultra {
          position: sticky;
          top: 0;
          height: var(--topbar-height);
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          z-index: 50;
        }

        .topbar-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .topbar-title-group h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
        }

        .topbar-title-group p {
          font-size: 0.75rem;
          color: var(--color-text-3);
          margin: 0;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .search-box-ultra {
          position: relative;
        }

        .search-box-ultra input {
          width: 280px;
          padding: 10px 16px 10px 42px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          font-size: 0.875rem;
          color: var(--color-text);
          font-family: var(--font-sans);
          transition: all 0.2s ease;
        }

        .search-box-ultra input:focus {
          outline: none;
          border-color: var(--soriano-red);
          background: var(--color-surface-2);
          box-shadow: 0 0 0 3px var(--soriano-red-subtle);
        }

        .search-box-ultra::before {
          content: '🔍';
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.875rem;
        }

        .topbar-btn-ultra {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          color: var(--color-text-2);
          cursor: pointer;
          font-size: 1.125rem;
          transition: all 0.15s ease;
          position: relative;
        }

        .topbar-btn-ultra:hover {
          background: var(--color-surface-2);
          color: var(--color-text);
          border-color: var(--color-border-strong);
        }

        .topbar-btn-ultra.has-notification::after {
          content: '';
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: var(--soriano-red);
          border-radius: 50%;
          border: 2px solid var(--color-bg);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }

        .topbar-time-ultra {
          text-align: right;
          padding-left: 16px;
          border-left: 1px solid var(--color-border);
        }

        .topbar-clock {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
        }

        .topbar-date {
          font-size: 0.6875rem;
          color: var(--color-text-4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* User Menu */
        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px 6px 6px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 30px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .user-menu-trigger:hover {
          background: var(--color-surface-2);
          border-color: var(--color-border-strong);
        }

        .user-avatar-ultra {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--soriano-red) 0%, var(--soriano-red-dark) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .user-name-trigger {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text);
        }

        /* ═══════════════════════════════════════════════════════════════════════════
           DASHBOARD CONTENT
           ═══════════════════════════════════════════════════════════════════════════ */

        .dashboard-content-ultra {
          padding: 28px 32px;
        }

        .dashboard-grid-ultra {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* KPI Cards */
        .kpi-grid-ultra {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 1400px) {
          .kpi-grid-ultra { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
          .kpi-grid-ultra { grid-template-columns: 1fr; }
        }

        .kpi-card-ultra {
          position: relative;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          padding: 24px;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .kpi-card-ultra:hover {
          transform: translateY(-4px);
          border-color: var(--color-border-strong);
          box-shadow: var(--shadow-lg), var(--shadow-glow);
        }

        .kpi-glow {
          position: absolute;
          top: 0;
          right: 0;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.15;
          pointer-events: none;
        }

        .kpi-content-ultra {
          position: relative;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .kpi-icon-ultra {
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .kpi-info-ultra {
          flex: 1;
          min-width: 0;
        }

        .kpi-title-ultra {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--color-text-3);
          margin-bottom: 4px;
        }

        .kpi-value-ultra {
          font-size: 1.875rem;
          font-weight: 800;
          color: var(--color-text);
          line-height: 1.1;
        }

        .kpi-change-ultra {
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 6px;
        }

        .kpi-change-ultra.positive { color: var(--color-success); }
        .kpi-change-ultra.negative { color: var(--color-error); }
        .kpi-change-ultra.neutral { color: var(--color-text-3); }

        /* Content Grid */
        .content-grid-ultra {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
        }

        @media (max-width: 1200px) {
          .content-grid-ultra { grid-template-columns: 1fr; }
        }

        /* Cards */
        .card-ultra {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 16px;
          overflow: hidden;
        }

        .card-header-ultra {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-divider);
        }

        .card-title-ultra {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text);
        }

        .card-action-ultra {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--soriano-red);
          background: none;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .card-action-ultra:hover {
          opacity: 0.7;
        }

        .card-content-ultra {
          padding: 24px;
        }

        /* Quick Actions */
        .quick-actions-ultra {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        @media (max-width: 600px) {
          .quick-actions-ultra { grid-template-columns: repeat(2, 1fr); }
        }

        .quick-action-ultra {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 12px;
          background: var(--color-surface-2);
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-sans);
        }

        .quick-action-ultra:hover {
          background: var(--color-surface);
          border-color: var(--action-color);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .qa-icon-ultra {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: color-mix(in srgb, var(--action-color) 15%, transparent);
          border-radius: 12px;
          font-size: 1.25rem;
        }

        .qa-label-ultra {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-text);
          text-align: center;
        }

        /* Activity List */
        .activity-list-ultra {
          display: flex;
          flex-direction: column;
        }

        .activity-item-ultra {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 0;
          border-bottom: 1px solid var(--color-divider);
        }

        .activity-item-ultra:last-child {
          border-bottom: none;
        }

        .activity-icon-ultra {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          font-size: 0.9375rem;
          flex-shrink: 0;
        }

        .activity-icon-ultra.policy { background: var(--color-info-soft); }
        .activity-icon-ultra.client { background: var(--color-success-soft); }
        .activity-icon-ultra.message { background: var(--color-warning-soft); }
        .activity-icon-ultra.task { background: #f3e8ff; }
        .activity-icon-ultra.ai { background: var(--soriano-red-soft); }

        .activity-content-ultra {
          flex: 1;
          min-width: 0;
        }

        .activity-title-ultra {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 2px;
        }

        .activity-subtitle-ultra {
          font-size: 0.6875rem;
          color: var(--color-text-3);
        }

        .activity-meta-ultra {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .activity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .activity-dot.success { background: var(--color-success); }
        .activity-dot.warning { background: var(--color-warning); }
        .activity-dot.info { background: var(--color-info); }
        .activity-dot.error { background: var(--color-error); }

        .activity-time-ultra {
          font-size: 0.6875rem;
          color: var(--color-text-4);
        }

        /* Mini Chart */
        .mini-chart-ultra {
          width: 100%;
          height: 80px;
        }

        /* Chart Section */
        .chart-section-ultra {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chart-header-ultra {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .chart-value-ultra {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--color-text);
        }

        .chart-label-ultra {
          font-size: 0.8125rem;
          color: var(--color-text-3);
        }

        .chart-change-ultra {
          font-size: 0.875rem;
          font-weight: 700;
          padding: 4px 10px;
          background: var(--color-success-soft);
          color: var(--color-success);
          border-radius: 20px;
        }

        /* Secondary Grid */
        .secondary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 24px;
        }

        @media (max-width: 1200px) {
          .secondary-grid { grid-template-columns: 1fr; }
        }

        /* Responsive Sidebar */
        @media (max-width: 1024px) {
          .sidebar-ultra {
            transform: translateX(-100%);
          }
          .sidebar-ultra.collapsed {
            transform: translateX(-100%);
          }
          .main-ultra,
          .sidebar-ultra.collapsed ~ .main-ultra {
            margin-left: 0;
          }
        }
      `}</style>

      <MultilevelSidebar
        sections={navigationConfig}
        expandedItems={expandedItems}
        toggleExpand={toggleExpand}
        activePath={activePath}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        toggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="main-ultra">
        {/* Top Bar */}
        <header className="topbar-ultra">
          <div className="topbar-left">
            <div className="topbar-title-group">
              <h1>Dashboard</h1>
              <p>Resumen ejecutivo del sistema</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box-ultra">
              <input type="text" placeholder="Buscar clientes, pólizas, siniestros..." />
            </div>
            <button type="button" className="topbar-btn-ultra has-notification" title="Notificaciones">🔔</button>
            <button type="button" className="topbar-btn-ultra" title="Configuración">⚙️</button>
            <div className="topbar-time-ultra">
              <p className="topbar-clock">{currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
              <p className="topbar-date">{currentTime.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <button type="button" className="user-menu-trigger">
              <span className="user-avatar-ultra">RS</span>
              <span className="user-name-trigger">Raúl Soriano</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="dashboard-content-ultra">
          <div className="dashboard-grid-ultra">
            {/* KPI Cards */}
            <div className="kpi-grid-ultra">
              <KPICardUltra
                title="Clientes Activos"
                value={1234}
                change="+12.5% vs mes anterior"
                changeType="positive"
                icon="👥"
                gradient="linear-gradient(135deg, #E30613 0%, #8B0309 100%)"
              />
              <KPICardUltra
                title="Pólizas Vigentes"
                value={3567}
                change="+8.3% vs mes anterior"
                changeType="positive"
                icon="📋"
                gradient="linear-gradient(135deg, #007AFF 0%, #0055CC 100%)"
              />
              <KPICardUltra
                title="Primas Mensuales"
                value="€245.8K"
                change="+15.7% vs mes anterior"
                changeType="positive"
                icon="💰"
                gradient="linear-gradient(135deg, #34C759 0%, #248A3D 100%)"
              />
              <KPICardUltra
                title="Siniestros Abiertos"
                value={42}
                change="-5.2% vs mes anterior"
                changeType="positive"
                icon="📈"
                gradient="linear-gradient(135deg, #FF9500 0%, #CC7A00 100%)"
              />
            </div>

            {/* Main Content Grid */}
            <div className="content-grid-ultra">
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Revenue Chart */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Evolución de Primas</h3>
                    <button type="button" className="card-action-ultra">Ver Analytics →</button>
                  </div>
                  <div className="card-content-ultra">
                    <div className="chart-section-ultra">
                      <div className="chart-header-ultra">
                        <div>
                          <p className="chart-value-ultra">€245.8K</p>
                          <p className="chart-label-ultra">Primas cobradas este mes</p>
                        </div>
                        <span className="chart-change-ultra">▲ +15.7%</span>
                      </div>
                      <MiniChartUltra data={revenueData} color="#E30613" />
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Acciones Rápidas</h3>
                  </div>
                  <div className="card-content-ultra">
                    <div className="quick-actions-ultra">
                      {quickActions.map((action) => (
                        <QuickActionUltra key={action.id} action={action} onNavigate={handleNavigate} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Activity Feed */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Actividad Reciente</h3>
                    <button type="button" className="card-action-ultra">Ver todo →</button>
                  </div>
                  <div className="card-content-ultra">
                    <div className="activity-list-ultra">
                      <ActivityItemUltra type="ai" title="AI Agent procesó 23 documentos" subtitle="Extracción automática de datos completada" time="Hace 2 min" status="success" />
                      <ActivityItemUltra type="policy" title="Nueva póliza emitida" subtitle="Auto Premium - María García López" time="Hace 8 min" status="success" />
                      <ActivityItemUltra type="client" title="Nuevo cliente registrado" subtitle="Juan López Martínez - Referido" time="Hace 15 min" status="success" />
                      <ActivityItemUltra type="message" title="Campaña email enviada" subtitle="Recordatorio renovaciones - 47 destinatarios" time="Hace 32 min" status="info" />
                      <ActivityItemUltra type="task" title="Siniestro resuelto" subtitle="REF-2024-1847 - Indemnización aprobada" time="Hace 1 hora" status="success" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Clients Chart */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Cartera de Clientes</h3>
                  </div>
                  <div className="card-content-ultra">
                    <div className="chart-section-ultra">
                      <div className="chart-header-ultra">
                        <div>
                          <p className="chart-value-ultra">1,234</p>
                          <p className="chart-label-ultra">Clientes activos</p>
                        </div>
                        <span className="chart-change-ultra">▲ +12%</span>
                      </div>
                      <MiniChartUltra data={clientsData} color="#007AFF" />
                    </div>
                  </div>
                </div>

                {/* Claims Chart */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Siniestralidad</h3>
                  </div>
                  <div className="card-content-ultra">
                    <div className="chart-section-ultra">
                      <div className="chart-header-ultra">
                        <div>
                          <p className="chart-value-ultra">42</p>
                          <p className="chart-label-ultra">Siniestros abiertos</p>
                        </div>
                        <span className="chart-change-ultra" style={{ background: 'var(--color-success-soft)', color: 'var(--color-success)' }}>▼ -5%</span>
                      </div>
                      <MiniChartUltra data={claimsData} color="#FF9500" />
                    </div>
                  </div>
                </div>

                {/* AI Status */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Agentes IA</h3>
                    <span style={{ fontSize: '0.6875rem', padding: '4px 8px', background: 'var(--color-success-soft)', color: 'var(--color-success)', borderRadius: '20px', fontWeight: 700 }}>7 Activos</span>
                  </div>
                  <div className="card-content-ultra">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>🤖</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Asistente de Ventas</span>
                        </div>
                        <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 8px rgba(52, 199, 89, 0.5)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>📄</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Procesador de Docs</span>
                        </div>
                        <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 8px rgba(52, 199, 89, 0.5)' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'var(--color-surface-2)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Análisis de Riesgos</span>
                        </div>
                        <span style={{ width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', boxShadow: '0 0 8px rgba(52, 199, 89, 0.5)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* System Status */}
                <div className="card-ultra">
                  <div className="card-header-ultra">
                    <h3 className="card-title-ultra">Estado del Sistema</h3>
                    <span style={{ fontSize: '0.6875rem', padding: '4px 8px', background: 'var(--color-success-soft)', color: 'var(--color-success)', borderRadius: '20px', fontWeight: 700 }}>81 DBs</span>
                  </div>
                  <div className="card-content-ultra">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>99.9%</p>
                        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-4)', textTransform: 'uppercase' }}>Uptime</p>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>12ms</p>
                        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-4)', textTransform: 'uppercase' }}>Latencia</p>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>12</p>
                        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-4)', textTransform: 'uppercase' }}>Usuarios</p>
                      </div>
                      <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)' }}>247K</p>
                        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-4)', textTransform: 'uppercase' }}>API Calls</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
