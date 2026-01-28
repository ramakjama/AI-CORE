import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useBrowserStore } from '../stores/browserStore';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function BrowserView() {
  const { tabs, activeTab, updateTab } = useBrowserStore();
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const [error, setError] = useState<string | null>(null);

  const currentTab = tabs.find(t => t.id === activeTab);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !currentTab) return;

    const handleDidStartLoading = () => {
      updateTab(currentTab.id, { isLoading: true });
      setError(null);
    };

    const handleDidStopLoading = () => {
      updateTab(currentTab.id, { isLoading: false });
    };

    const handleDidFinishLoad = () => {
      updateTab(currentTab.id, {
        isLoading: false,
        title: (webview as any).getTitle?.() || currentTab.url,
        canGoBack: (webview as any).canGoBack?.() || false,
        canGoForward: (webview as any).canGoForward?.() || false,
      });
    };

    const handlePageTitleUpdated = (e: any) => {
      updateTab(currentTab.id, { title: e.title });
    };

    const handleDidFailLoad = (e: any) => {
      if (e.errorCode !== -3) {
        setError(e.errorDescription || 'Failed to load page');
        updateTab(currentTab.id, { isLoading: false });
      }
    };

    const handlePageFaviconUpdated = (e: any) => {
      if (e.favicons && e.favicons.length > 0) {
        updateTab(currentTab.id, { favicon: e.favicons[0] });
      }
    };

    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('page-title-updated', handlePageTitleUpdated);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('page-favicon-updated', handlePageFaviconUpdated);

    return () => {
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      webview.removeEventListener('did-stop-loading', handleDidStopLoading);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('page-favicon-updated', handlePageFaviconUpdated);
    };
  }, [currentTab?.id, updateTab]);

  if (!currentTab || currentTab.url === 'nova://newtab') {
    return null;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-nova-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-nova-danger/10 border border-nova-danger/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-nova-danger" />
          </div>
          <h2 className="text-xl font-semibold text-nova-black mb-2">Failed to load page</h2>
          <p className="text-nova-graphite mb-6">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              if (webviewRef.current) {
                (webviewRef.current as any).reload?.();
              }
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-nova-black text-white hover:bg-nova-charcoal rounded-xl transition-colors mx-auto font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-white">
      {/* Loading bar */}
      {currentTab.isLoading && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-nova-tech to-nova-cyber z-50"
          initial={{ scaleX: 0, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
      )}

      <webview
        ref={webviewRef as any}
        src={currentTab.url}
        className="h-full w-full"
        style={{ display: 'flex' }}
        // @ts-ignore
        allowpopups="true"
        // @ts-ignore
        webpreferences="contextIsolation=yes"
      />
    </div>
  );
}
