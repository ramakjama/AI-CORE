import { motion } from 'framer-motion';
import { Minus, Square, X } from 'lucide-react';

// ============================================
// NOVA BROWSER - TITLE BAR
// Window controls and branding
// ============================================

export default function TitleBar() {
  const isMac = window.nova?.platform === 'darwin';

  return (
    <div
      className="h-10 bg-nova-white/80 backdrop-blur-xl flex items-center justify-between px-4 select-none border-b border-black/5 relative z-20"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        {isMac && <div className="w-16" />}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Tech Logo */}
          <div className="relative flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-nova-black">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {/* Tech glow dot */}
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-nova-tech rounded-full animate-pulse" />
          </div>
          <span className="text-[14px] font-semibold tracking-tight text-nova-black">
            NOVA
          </span>
          <span className="text-[10px] font-medium tracking-[0.15em] text-nova-graphite uppercase">
            Browser
          </span>
          {/* Tech Badge */}
          <span className="ml-2 px-2 py-0.5 text-[9px] font-medium tracking-wider bg-gradient-to-r from-nova-tech to-nova-cyber text-white rounded-full">
            TECH
          </span>
        </motion.div>
      </div>

      {/* Window Controls (Windows/Linux) */}
      {!isMac && (
        <div
          className="flex items-center"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={() => window.nova?.window?.minimize()}
            className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors"
            title="Minimize"
          >
            <Minus className="w-4 h-4 text-nova-graphite" />
          </button>
          <button
            type="button"
            onClick={() => window.nova?.window?.maximize()}
            className="w-10 h-10 flex items-center justify-center hover:bg-black/5 transition-colors"
            title="Maximize"
          >
            <Square className="w-3 h-3 text-nova-graphite" />
          </button>
          <button
            type="button"
            onClick={() => window.nova?.window?.close()}
            className="w-10 h-10 flex items-center justify-center hover:bg-nova-danger transition-colors group"
            title="Close"
          >
            <X className="w-4 h-4 text-nova-graphite group-hover:text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
