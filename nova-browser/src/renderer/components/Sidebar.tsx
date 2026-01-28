import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Shield,
  Clock,
  Download,
  Settings,
  Sparkles,
  Layout,
  Briefcase,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Bookmark,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';
import { PanelType } from '../App';

// ============================================
// NOVA BROWSER - SIDEBAR COMPONENT
// Navigation and quick actions
// ============================================

interface SidebarProps {
  activePanel: PanelType;
  onTogglePanel: (panel: PanelType) => void;
}

const iconMap: Record<string, React.ElementType> = {
  layout: Layout,
  briefcase: Briefcase,
  user: User,
};

export default function Sidebar({ activePanel, onTogglePanel }: SidebarProps) {
  const {
    tabs,
    activeTab,
    activeWorkspace,
    workspaces,
    setActiveTab,
    addTab,
    closeTab,
    setActiveWorkspace,
    securityEnabled,
    securityStats,
  } = useBrowserStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const workspaceTabs = tabs.filter(t => t.workspaceId === activeWorkspace);

  return (
    <motion.div
      className="bg-nova-snow/80 backdrop-blur-xl h-full flex flex-col border-r border-black/5 relative"
      initial={{ width: 260 }}
      animate={{ width: isExpanded ? 260 : 56 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Workspaces */}
      <div className="p-3 border-b border-black/5">
        <div className="flex items-center gap-1">
          {workspaces.map(workspace => {
            const Icon = iconMap[workspace.icon] || Layout;
            const isActive = activeWorkspace === workspace.id;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => setActiveWorkspace(workspace.id)}
                title={workspace.name}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-nova-black text-white shadow-tech'
                    : 'text-nova-graphite hover:text-nova-black hover:bg-black/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {isExpanded && (
                  <span className="text-xs font-medium truncate">{workspace.name}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin">
        <AnimatePresence>
          {workspaceTabs.map((tab, index) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: index * 0.02 }}
              className={`group relative flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-white shadow-tech border border-black/5'
                  : 'hover:bg-white/50'
              }`}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {/* Active Indicator */}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-nova-tech to-nova-cyber rounded-full"
                />
              )}

              {/* Favicon */}
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-nova-pearl">
                {tab.favicon ? (
                  <img src={tab.favicon} alt="" className="w-4 h-4 rounded" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-nova-platinum" />
                )}
              </div>

              {isExpanded && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-nova-black font-medium truncate">{tab.title}</p>
                    {tab.url !== 'nova://newtab' && (
                      <p className="text-[10px] text-nova-graphite truncate">
                        {tab.url.replace(/^https?:\/\//, '').split('/')[0]}
                      </p>
                    )}
                  </div>

                  {/* Security Badge */}
                  {tab.isSecure && tab.url !== 'nova://newtab' && (
                    <div className="w-2 h-2 rounded-full bg-nova-success" />
                  )}

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    title="Close tab"
                    className={`p-1 rounded-lg transition-opacity ${
                      hoveredTab === tab.id ? 'opacity-100' : 'opacity-0'
                    } hover:bg-black/5`}
                  >
                    <X className="w-3.5 h-3.5 text-nova-graphite" />
                  </button>
                </>
              )}

              {/* Loading Indicator */}
              {tab.isLoading && (
                <motion.div
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-nova-tech to-nova-cyber rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Tab Button */}
        <button
          type="button"
          onClick={() => addTab()}
          title="New Tab"
          className="w-full flex items-center gap-2 p-2.5 rounded-xl text-nova-graphite hover:text-nova-black hover:bg-white/50 transition-all"
        >
          <Plus className="w-4 h-4" />
          {isExpanded && <span className="text-[13px] font-medium">New Tab</span>}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-t border-black/5 space-y-1">
        {/* AI Assistant */}
        <SidebarAction
          icon={Sparkles}
          label="AI Assistant"
          shortcut="Ctrl+J"
          onClick={() => onTogglePanel('ai')}
          expanded={isExpanded}
          premium
          isActive={activePanel === 'ai'}
        />

        {/* Security */}
        <SidebarAction
          icon={Shield}
          label="Security"
          shortcut="Ctrl+Shift+S"
          onClick={() => onTogglePanel('security')}
          expanded={isExpanded}
          badge={securityStats.threatsBlocked.toLocaleString()}
          active={securityEnabled}
          isActive={activePanel === 'security'}
        />

        <div className="h-px bg-black/5 my-2" />

        <SidebarAction
          icon={Bookmark}
          label="Bookmarks"
          shortcut="Ctrl+B"
          onClick={() => onTogglePanel('bookmarks')}
          expanded={isExpanded}
          isActive={activePanel === 'bookmarks'}
        />
        <SidebarAction
          icon={Clock}
          label="History"
          shortcut="Ctrl+H"
          onClick={() => onTogglePanel('history')}
          expanded={isExpanded}
          isActive={activePanel === 'history'}
        />
        <SidebarAction
          icon={Download}
          label="Downloads"
          shortcut="Ctrl+D"
          onClick={() => onTogglePanel('downloads')}
          expanded={isExpanded}
          isActive={activePanel === 'downloads'}
        />
        <SidebarAction
          icon={Settings}
          label="Settings"
          onClick={() => {}}
          expanded={isExpanded}
        />
      </div>

      {/* Collapse Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-black/10 rounded-full flex items-center justify-center hover:shadow-tech transition-all z-10"
      >
        {isExpanded ? (
          <ChevronLeft className="w-3 h-3 text-nova-graphite" />
        ) : (
          <ChevronRight className="w-3 h-3 text-nova-graphite" />
        )}
      </button>
    </motion.div>
  );
}

interface SidebarActionProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  expanded: boolean;
  premium?: boolean;
  active?: boolean;
  badge?: string;
  shortcut?: string;
  isActive?: boolean;
}

function SidebarAction({
  icon: Icon,
  label,
  onClick,
  expanded,
  premium,
  active,
  badge,
  shortcut,
  isActive
}: SidebarActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all ${
        isActive
          ? 'bg-nova-black text-white shadow-tech'
          : premium
          ? 'bg-gradient-to-r from-nova-tech/10 to-nova-cyber/10 hover:from-nova-tech/20 hover:to-nova-cyber/20 border border-nova-tech/20'
          : active
          ? 'text-nova-success bg-nova-success/10'
          : 'text-nova-graphite hover:text-nova-black hover:bg-white/50'
      }`}
    >
      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : premium ? 'text-nova-tech' : ''}`} />
      {expanded && (
        <>
          <span className={`text-[13px] flex-1 text-left font-medium ${isActive ? 'text-white' : premium ? 'text-nova-charcoal' : ''}`}>
            {label}
          </span>
          {badge && !isActive && (
            <span className="text-[10px] px-1.5 py-0.5 bg-nova-black text-white rounded-md font-medium">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
