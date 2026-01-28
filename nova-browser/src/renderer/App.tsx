import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import AddressBar from './components/AddressBar';
import BrowserView from './components/BrowserView';
import CommandPalette from './components/CommandPalette';
import AIAssistant from './components/AIAssistant';
import SecurityPanel from './components/SecurityPanel';
import HistoryPanel from './components/HistoryPanel';
import DownloadsPanel from './components/DownloadsPanel';
import BookmarksPanel from './components/BookmarksPanel';
import NewTabPage from './pages/NewTabPage';
import { useBrowserStore } from './stores/browserStore';

// ============================================
// NOVA BROWSER - WHITE TECH EDITION
// AI Innovation Technologies
// ============================================

export type PanelType = 'ai' | 'security' | 'history' | 'downloads' | 'bookmarks' | null;

function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const { activeTab, tabs } = useBrowserStore();

  const currentTab = tabs.find(t => t.id === activeTab);
  const isNewTab = !currentTab?.url || currentTab.url === 'nova://newtab';

  // Toggle panel - close if same, open if different
  const togglePanel = (panel: PanelType) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      // AI Assistant
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        togglePanel('ai');
      }
      // Security Panel
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        togglePanel('security');
      }
      // History
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        togglePanel('history');
      }
      // Downloads
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        togglePanel('downloads');
      }
      // Bookmarks
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        togglePanel('bookmarks');
      }
      // Close panel with Escape
      if (e.key === 'Escape' && activePanel) {
        setActivePanel(null);
      }
      // Fullscreen toggle
      if (e.key === 'F11') {
        e.preventDefault();
        window.nova?.window?.toggleFullscreen?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel]);

  // Listen for fullscreen changes
  useEffect(() => {
    window.nova?.window?.onFullscreenChange?.((isFullscreen: boolean) => {
      document.body.classList.toggle('fullscreen', isFullscreen);
    });
  }, []);

  const closePanel = () => setActivePanel(null);

  return (
    <div className="h-screen w-screen bg-nova-white overflow-hidden flex flex-col relative">
      {/* TECH BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 tech-grid" />
        <div className="absolute inset-0 hex-pattern opacity-50" />
        <div className="absolute inset-0 cyber-lines opacity-30" />
        <div className="absolute inset-0 scan-effect" />
        <div className="absolute inset-0 data-flow" />
      </div>

      <TitleBar />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar
          activePanel={activePanel}
          onTogglePanel={togglePanel}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <AddressBar onCommandPalette={() => setShowCommandPalette(true)} />

          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {isNewTab ? (
                <motion.div
                  key="newtab"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <NewTabPage />
                </motion.div>
              ) : (
                <motion.div
                  key="browser"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <BrowserView />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Side Panels */}
            <AnimatePresence>
              {activePanel === 'ai' && <AIAssistant onClose={closePanel} />}
              {activePanel === 'security' && <SecurityPanel onClose={closePanel} />}
              {activePanel === 'history' && <HistoryPanel onClose={closePanel} />}
              {activePanel === 'downloads' && <DownloadsPanel onClose={closePanel} />}
              {activePanel === 'bookmarks' && <BookmarksPanel onClose={closePanel} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette onClose={() => setShowCommandPalette(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
