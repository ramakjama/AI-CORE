import { motion } from 'framer-motion';
import { Plus, ChevronDown } from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

export default function TabsBar() {
  const { tabs, activeTab, setActiveTab, addTab, closeTab, activeWorkspace } = useBrowserStore();

  const workspaceTabs = tabs.filter(t => t.workspaceId === activeWorkspace);

  // Mostrar tabs horizontales solo si hay muchas pestanas
  if (workspaceTabs.length <= 1) return null;

  return (
    <div className="h-9 bg-nova-darker/50 flex items-center px-2 gap-1 overflow-x-auto scrollbar-thin">
      {workspaceTabs.map(tab => (
        <motion.div
          key={tab.id}
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer min-w-0 max-w-[180px] group ${
            activeTab === tab.id
              ? 'bg-white/10'
              : 'hover:bg-white/5'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.favicon ? (
            <img src={tab.favicon} alt="" className="w-4 h-4 flex-shrink-0" />
          ) : (
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-nova-purple to-nova-blue flex-shrink-0" />
          )}
          <span className="text-xs text-gray-300 truncate">{tab.title}</span>
          <button
            onClick={e => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 ml-auto text-gray-500 hover:text-white transition-opacity"
          >
            x
          </button>
        </motion.div>
      ))}

      <button
        onClick={() => addTab()}
        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
      >
        <Plus className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
