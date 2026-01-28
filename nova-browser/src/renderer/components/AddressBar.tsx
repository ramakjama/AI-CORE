import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Home,
  ShieldCheck,
  Lock,
  Unlock,
  Star,
  Search,
  Sparkles,
  Command,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

interface AddressBarProps {
  onCommandPalette: () => void;
}

export default function AddressBar({ onCommandPalette }: AddressBarProps) {
  const { tabs, activeTab, updateTab, addToHistory, securityEnabled } = useBrowserStore();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentTab = tabs.find(t => t.id === activeTab);

  useEffect(() => {
    if (currentTab && currentTab.url !== 'nova://newtab') {
      setInputValue(currentTab.url);
    } else {
      setInputValue('');
    }
  }, [currentTab?.url]);

  const handleNavigate = (url: string) => {
    if (!url.trim()) return;

    let finalUrl = url;

    if (!url.includes('.') && !url.startsWith('http') && !url.startsWith('nova://')) {
      finalUrl = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    } else if (!url.startsWith('http') && !url.startsWith('nova://')) {
      finalUrl = `https://${url}`;
    }

    if (activeTab) {
      updateTab(activeTab, {
        url: finalUrl,
        title: 'Loading...',
        isLoading: true,
        isSecure: finalUrl.startsWith('https://'),
      });

      addToHistory({ url: finalUrl, title: url, securityScore: 100 });
    }

    setIsFocused(false);
  };

  const isSecure = currentTab?.url?.startsWith('https://') || currentTab?.url?.startsWith('nova://');

  return (
    <div className="h-14 bg-nova-white/80 backdrop-blur-xl flex items-center px-3 gap-2 border-b border-black/5">
      {/* Navigation buttons */}
      <div className="flex items-center gap-0.5">
        <NavButton
          icon={ArrowLeft}
          onClick={() => {}}
          disabled={!currentTab?.canGoBack}
          title="Go back"
        />
        <NavButton
          icon={ArrowRight}
          onClick={() => {}}
          disabled={!currentTab?.canGoForward}
          title="Go forward"
        />
        <NavButton
          icon={RotateCw}
          onClick={() => {}}
          loading={currentTab?.isLoading}
          title="Reload"
        />
        <NavButton
          icon={Home}
          onClick={() => updateTab(activeTab!, { url: 'nova://newtab' })}
          title="Home"
        />
      </div>

      {/* Address bar */}
      <div className="flex-1 relative">
        <div
          className={`flex items-center gap-3 bg-nova-pearl rounded-xl px-4 py-2.5 transition-all border ${
            isFocused ? 'border-nova-tech/30 shadow-glow-tech' : 'border-transparent'
          }`}
        >
          {/* Security indicator */}
          {!isFocused && currentTab?.url && currentTab.url !== 'nova://newtab' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center"
            >
              {isSecure ? (
                <Lock className="w-4 h-4 text-nova-success" />
              ) : (
                <Unlock className="w-4 h-4 text-nova-warning" />
              )}
            </motion.div>
          )}

          {isFocused && <Search className="w-4 h-4 text-nova-graphite" />}

          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleNavigate(inputValue);
              if (e.key === 'Escape') inputRef.current?.blur();
            }}
            placeholder="Search or enter URL"
            className="flex-1 bg-transparent text-[13px] text-nova-black placeholder-nova-graphite outline-none font-medium"
          />

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            {securityEnabled && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-nova-success/10 rounded-lg border border-nova-success/20">
                <ShieldCheck className="w-3.5 h-3.5 text-nova-success" />
                <span className="text-[10px] text-nova-success font-semibold">Protected</span>
              </div>
            )}

            <button
              type="button"
              onClick={onCommandPalette}
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              title="Command Palette (Ctrl+K)"
            >
              <Command className="w-4 h-4 text-nova-graphite" />
            </button>

            <button
              type="button"
              className="p-2 hover:bg-black/5 rounded-lg transition-colors"
              title="AI Assistant (Ctrl+J)"
            >
              <Sparkles className="w-4 h-4 text-nova-tech" />
            </button>
          </div>
        </div>
      </div>

      {/* Bookmark button */}
      <button
        type="button"
        className="p-2 hover:bg-black/5 rounded-lg transition-colors"
        title="Bookmark this page"
      >
        <Star className="w-4 h-4 text-nova-graphite hover:text-nova-warning" />
      </button>
    </div>
  );
}

interface NavButtonProps {
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  title: string;
}

function NavButton({ icon: Icon, onClick, disabled, loading, title }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        disabled
          ? 'text-nova-platinum cursor-not-allowed'
          : 'text-nova-graphite hover:bg-black/5 hover:text-nova-black'
      }`}
    >
      <motion.div
        animate={loading ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: loading ? Infinity : 0, ease: 'linear' }}
      >
        <Icon className="w-4 h-4" />
      </motion.div>
    </button>
  );
}
