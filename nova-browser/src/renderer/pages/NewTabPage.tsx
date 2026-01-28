import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Shield,
  ShieldCheck,
  Globe,
  Github,
  Twitter,
  Linkedin,
  Mail,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Zap,
  Cpu,
  Database,
  Wifi,
} from 'lucide-react';
import { useBrowserStore } from '../stores/browserStore';

// ============================================
// NOVA BROWSER - WHITE TECH NEW TAB
// AI Innovation Technologies
// ============================================

const quickLinks = [
  { icon: Globe, label: 'Google', url: 'https://google.com' },
  { icon: Github, label: 'GitHub', url: 'https://github.com' },
  { icon: Twitter, label: 'Twitter', url: 'https://twitter.com' },
  { icon: Linkedin, label: 'LinkedIn', url: 'https://linkedin.com' },
  { icon: Mail, label: 'Gmail', url: 'https://mail.google.com' },
];

export default function NewTabPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const { updateTab, activeTab, securityStats, securityEnabled } = useBrowserStore();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) setGreeting('Good morning');
    else if (hour >= 12 && hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [currentTime]);

  const handleSearch = (query: string) => {
    if (!query.trim()) return;

    let url = query;
    if (!query.includes('.') && !query.startsWith('http')) {
      url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    } else if (!query.startsWith('http')) {
      url = `https://${query}`;
    }

    if (activeTab) {
      updateTab(activeTab, { url, title: 'Loading...' });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="h-full w-full bg-nova-white overflow-y-auto relative">
      {/* Tech Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 tech-grid" />
        <div className="absolute inset-0 hex-pattern opacity-40" />
        <div className="absolute inset-0 data-flow" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        {/* Time Display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-[140px] font-extralight tracking-tighter text-nova-black leading-none">
            {formatTime(currentTime)}
          </h1>
          <p className="text-xl text-nova-graphite font-light mt-2">
            {greeting}
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative group">
            {/* Tech glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-nova-tech/20 to-nova-cyber/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex items-center gap-4 bg-white rounded-2xl px-6 py-4 border border-black/10 shadow-tech group-hover:shadow-tech-hover transition-all">
              <Search className="w-5 h-5 text-nova-graphite" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Search the web or enter URL..."
                className="flex-1 bg-transparent text-nova-black text-lg placeholder-nova-graphite outline-none font-light"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearch(searchQuery)}
                  className="p-2.5 bg-nova-black rounded-xl hover:bg-nova-charcoal transition-colors"
                  title="Search"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* AI Search Suggestion */}
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 mx-auto flex items-center gap-2 px-4 py-2 text-nova-graphite hover:text-nova-tech transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Ask AI Assistant</span>
            <span className="text-xs bg-nova-pearl px-2 py-0.5 rounded-md border border-black/5">Ctrl+J</span>
          </motion.button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-6">
            {quickLinks.map((link, index) => (
              <motion.button
                key={link.label}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                onClick={() => {
                  if (activeTab) {
                    updateTab(activeTab, { url: link.url, title: link.label });
                  }
                }}
                className="group flex flex-col items-center gap-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-black/10 flex items-center justify-center group-hover:border-nova-tech/30 group-hover:shadow-glow-tech transition-all">
                  <link.icon className="w-6 h-6 text-nova-graphite group-hover:text-nova-tech transition-colors" />
                </div>
                <span className="text-[11px] text-nova-graphite group-hover:text-nova-black font-medium transition-colors">
                  {link.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Security Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className={`p-6 rounded-2xl border backdrop-blur-sm ${
            securityEnabled
              ? 'bg-nova-success/5 border-nova-success/20'
              : 'bg-white border-black/10'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  securityEnabled ? 'bg-nova-success/10' : 'bg-nova-pearl'
                }`}>
                  {securityEnabled ? (
                    <ShieldCheck className="w-7 h-7 text-nova-success" />
                  ) : (
                    <Shield className="w-7 h-7 text-nova-graphite" />
                  )}
                </div>
                <div>
                  <h3 className={`text-base font-semibold ${
                    securityEnabled ? 'text-nova-success' : 'text-nova-graphite'
                  }`}>
                    {securityEnabled ? 'AI-Defender Active' : 'Protection Disabled'}
                  </h3>
                  <p className="text-sm text-nova-graphite">
                    {securityEnabled
                      ? `${securityStats.threatsBlocked.toLocaleString()} threats blocked this session`
                      : 'Enable protection for secure browsing'
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-8 text-center">
                <div>
                  <p className="text-2xl font-light text-nova-black">
                    {securityStats.adsBlocked.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-nova-graphite uppercase tracking-wider font-medium">Ads Blocked</p>
                </div>
                <div>
                  <p className="text-2xl font-light text-nova-black">
                    {securityStats.trackersBlocked.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-nova-graphite uppercase tracking-wider font-medium">Trackers</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tech Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-4 gap-4"
        >
          <TechStatCard
            icon={Zap}
            label="Speed"
            value="Blazing"
            color="tech"
          />
          <TechStatCard
            icon={Clock}
            label="Session"
            value={`${Math.floor((Date.now() % 3600000) / 60000)}m`}
            color="cyber"
          />
          <TechStatCard
            icon={Cpu}
            label="CPU"
            value="12%"
            color="success"
          />
          <TechStatCard
            icon={Database}
            label="Memory"
            value="256MB"
            color="info"
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-nova-tech animate-pulse" />
            <span className="text-[11px] text-nova-graphite tracking-wider font-medium">
              CONNECTED TO THE FUTURE
            </span>
          </div>
          <p className="text-[11px] text-nova-steel tracking-wider">
            NOVA BROWSER &mdash; AI Innovation Technologies
          </p>
        </motion.div>
      </div>
    </div>
  );
}

interface TechStatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'tech' | 'cyber' | 'success' | 'info';
}

function TechStatCard({ icon: Icon, label, value, color }: TechStatCardProps) {
  const colorClasses = {
    tech: 'text-nova-tech',
    cyber: 'text-nova-cyber',
    success: 'text-nova-success',
    info: 'text-nova-info',
  };

  const bgClasses = {
    tech: 'from-nova-tech/5 to-transparent',
    cyber: 'from-nova-cyber/5 to-transparent',
    success: 'from-nova-success/5 to-transparent',
    info: 'from-nova-info/5 to-transparent',
  };

  return (
    <div className={`p-4 bg-gradient-to-br ${bgClasses[color]} rounded-2xl border border-black/5 backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${colorClasses[color]}`} />
        <span className="text-[10px] text-nova-graphite uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-light ${colorClasses[color]}`}>{value}</p>
    </div>
  );
}
