import { motion } from 'framer-motion';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Bug,
  Eye,
  EyeOff,
  Lock,
  Scan,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

// ============================================
// AI-DEFENDER SECURITY PANEL - WHITE TECH
// AI Innovation Technologies
// ============================================

interface SecurityPanelProps {
  onClose: () => void;
}

export default function SecurityPanel({ onClose }: SecurityPanelProps) {
  const {
    securityEnabled,
    securityStats,
    protectionLevel,
    isScanning,
    recentThreats,
    isAdBlockEnabled,
    isTrackingProtectionEnabled,
    isHttpsOnlyMode,
    toggleSecurity,
    setProtectionLevel,
    runSecurityScan,
    toggleAdBlock,
    toggleTrackingProtection,
    toggleHttpsOnly,
  } = useBrowserStore();

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-[420px] bg-nova-white/95 backdrop-blur-xl border-l border-black/10 flex flex-col shadow-tech-hover"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            securityEnabled ? 'bg-nova-success/10' : 'bg-nova-pearl'
          }`}>
            {securityEnabled ? (
              <ShieldCheck className="w-5 h-5 text-nova-success" />
            ) : (
              <ShieldOff className="w-5 h-5 text-nova-graphite" />
            )}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-nova-black">AI-Defender</h3>
            <p className="text-[11px] text-nova-graphite">Security Engine v2.0</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          title="Close security panel"
        >
          <X className="w-5 h-5 text-nova-graphite" />
        </button>
      </div>

      {/* Main Status */}
      <div className="p-4 border-b border-black/5">
        <div className={`p-4 rounded-xl ${
          securityEnabled
            ? 'bg-nova-success/5 border border-nova-success/20'
            : 'bg-nova-pearl border border-black/5'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {securityEnabled ? (
                <CheckCircle className="w-5 h-5 text-nova-success" />
              ) : (
                <XCircle className="w-5 h-5 text-nova-graphite" />
              )}
              <span className={`text-sm font-semibold ${
                securityEnabled ? 'text-nova-success' : 'text-nova-graphite'
              }`}>
                {securityEnabled ? 'PROTECTED' : 'PROTECTION OFF'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleSecurity}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                securityEnabled
                  ? 'bg-nova-pearl text-nova-charcoal hover:bg-nova-silver/30'
                  : 'bg-nova-success text-white hover:bg-nova-success/80'
              }`}
            >
              {securityEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {securityEnabled && (
            <p className="text-[12px] text-nova-graphite">
              Real-time protection is active. Your browsing is secured by AI-Defender.
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 border-b border-black/5">
        <h4 className="text-[11px] text-nova-graphite uppercase tracking-wider mb-3 font-medium">Protection Stats</h4>
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Shield}
            label="Threats Blocked"
            value={formatNumber(securityStats.threatsBlocked)}
            color="success"
          />
          <StatCard
            icon={Eye}
            label="Trackers Blocked"
            value={formatNumber(securityStats.trackersBlocked)}
            color="info"
          />
          <StatCard
            icon={Bug}
            label="Malware Blocked"
            value={formatNumber(securityStats.malwareBlocked)}
            color="danger"
          />
          <StatCard
            icon={AlertTriangle}
            label="Phishing Blocked"
            value={formatNumber(securityStats.phishingBlocked)}
            color="warning"
          />
        </div>
      </div>

      {/* Protection Level */}
      <div className="p-4 border-b border-black/5">
        <h4 className="text-[11px] text-nova-graphite uppercase tracking-wider mb-3 font-medium">Protection Level</h4>
        <div className="flex gap-2">
          {(['standard', 'strict', 'paranoid'] as const).map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setProtectionLevel(level)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                protectionLevel === level
                  ? 'bg-nova-black text-white'
                  : 'bg-nova-pearl text-nova-charcoal hover:bg-nova-silver/30'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-nova-graphite mt-2">
          {protectionLevel === 'standard' && 'Basic protection for everyday browsing'}
          {protectionLevel === 'strict' && 'Enhanced protection with aggressive blocking'}
          {protectionLevel === 'paranoid' && 'Maximum security - may break some sites'}
        </p>
      </div>

      {/* Quick Settings */}
      <div className="p-4 border-b border-black/5">
        <h4 className="text-[11px] text-nova-graphite uppercase tracking-wider mb-3 font-medium">Quick Settings</h4>
        <div className="space-y-2">
          <ToggleSetting
            icon={ShieldAlert}
            label="Ad Blocker"
            description="Block ads and popups"
            enabled={isAdBlockEnabled}
            onToggle={toggleAdBlock}
          />
          <ToggleSetting
            icon={EyeOff}
            label="Tracking Protection"
            description="Block trackers and fingerprinting"
            enabled={isTrackingProtectionEnabled}
            onToggle={toggleTrackingProtection}
          />
          <ToggleSetting
            icon={Lock}
            label="HTTPS-Only Mode"
            description="Force secure connections"
            enabled={isHttpsOnlyMode}
            onToggle={toggleHttpsOnly}
          />
        </div>
      </div>

      {/* Scan Button */}
      <div className="p-4 border-b border-black/5">
        <button
          type="button"
          onClick={runSecurityScan}
          disabled={isScanning}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
            isScanning
              ? 'bg-nova-pearl text-nova-graphite'
              : 'bg-nova-black text-white hover:bg-nova-charcoal'
          }`}
        >
          {isScanning ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Scan className="w-4 h-4" />
              </motion.div>
              Scanning...
            </>
          ) : (
            <>
              <Scan className="w-4 h-4" />
              Run Security Scan
            </>
          )}
        </button>
        {securityStats.lastScan && (
          <p className="text-[11px] text-nova-graphite text-center mt-2">
            Last scan: {new Date(securityStats.lastScan).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="text-[11px] text-nova-graphite uppercase tracking-wider mb-3 font-medium">Recent Activity</h4>
        {recentThreats.length > 0 ? (
          <div className="space-y-2">
            {recentThreats.slice(0, 5).map(threat => (
              <div
                key={threat.id}
                className="p-3 bg-nova-pearl rounded-xl border border-black/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    threat.severity === 'critical' ? 'bg-nova-danger' :
                    threat.severity === 'high' ? 'bg-nova-warning' :
                    'bg-nova-info'
                  }`} />
                  <span className="text-xs text-nova-charcoal font-medium">{threat.type}</span>
                  <span className="text-[10px] text-nova-graphite ml-auto capitalize">
                    {threat.severity}
                  </span>
                </div>
                <p className="text-[11px] text-nova-graphite truncate">{threat.url}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 text-nova-platinum mx-auto mb-2" />
            <p className="text-[12px] text-nova-graphite">No recent threats detected</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/5 bg-nova-pearl/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-nova-success animate-pulse" />
            <span className="text-[11px] text-nova-graphite font-medium">AI-Defender Active</span>
          </div>
          <span className="text-[10px] text-nova-steel">AI Innovation Technologies</span>
        </div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'success' | 'info' | 'warning' | 'danger';
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    success: 'text-nova-success',
    info: 'text-nova-info',
    warning: 'text-nova-warning',
    danger: 'text-nova-danger',
  };

  const bgClasses = {
    success: 'from-nova-success/5',
    info: 'from-nova-info/5',
    warning: 'from-nova-warning/5',
    danger: 'from-nova-danger/5',
  };

  return (
    <div className={`p-3 bg-gradient-to-br ${bgClasses[color]} to-transparent rounded-xl border border-black/5`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${colorClasses[color]}`} />
        <span className="text-[10px] text-nova-graphite font-medium">{label}</span>
      </div>
      <p className={`text-lg font-semibold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}

interface ToggleSettingProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function ToggleSetting({ icon: Icon, label, description, enabled, onToggle }: ToggleSettingProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-nova-pearl rounded-xl border border-black/5">
      <Icon className={`w-4 h-4 ${enabled ? 'text-nova-success' : 'text-nova-graphite'}`} />
      <div className="flex-1">
        <p className="text-[13px] text-nova-charcoal font-medium">{label}</p>
        <p className="text-[10px] text-nova-graphite">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        title={`Toggle ${label}`}
        className={`w-10 h-5 rounded-full transition-all ${
          enabled ? 'bg-nova-success' : 'bg-nova-platinum'
        }`}
      >
        <motion.div
          className="w-4 h-4 bg-white rounded-full shadow"
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}
