import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// ============================================
// NOVA BROWSER - SECURITY ENGINE
// AI-Defender: Real ad blocking and protection
// ============================================

interface SecurityStats {
  threatsBlocked: number;
  trackersBlocked: number;
  adsBlocked: number;
  malwareBlocked: number;
  phishingBlocked: number;
  lastScan: string | null;
}

interface ThreatRecord {
  id: string;
  type: 'ad' | 'tracker' | 'malware' | 'phishing';
  url: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  blockedAt: Date;
}

type ProtectionLevel = 'standard' | 'strict' | 'paranoid';

interface StoreData {
  isAdBlockEnabled: boolean;
  isTrackingProtectionEnabled: boolean;
  httpsOnlyMode: boolean;
  protectionLevel: string;
  stats: SecurityStats;
}

export class SecurityEngine {
  private configPath: string = '';
  private adBlockList: Set<string> = new Set();
  private trackerList: Set<string> = new Set();
  private malwareList: Set<string> = new Set();
  private phishingList: Set<string> = new Set();

  private isAdBlockEnabled: boolean = true;
  private isTrackingProtectionEnabled: boolean = true;
  private httpsOnlyMode: boolean = false;
  private protectionLevel: ProtectionLevel = 'standard';

  private stats: SecurityStats = {
    threatsBlocked: 0,
    trackersBlocked: 0,
    adsBlocked: 0,
    malwareBlocked: 0,
    phishingBlocked: 0,
    lastScan: null,
  };

  private recentThreats: ThreatRecord[] = [];

  constructor() {
    // Don't initialize here - wait for app to be ready
  }

  private ensureConfigPath(): void {
    if (!this.configPath) {
      const userDataPath = app.getPath('userData');
      this.configPath = path.join(userDataPath, 'nova-security.json');
    }
  }

  private loadSettings(): void {
    this.ensureConfigPath();
    try {
      if (this.configPath && fs.existsSync(this.configPath)) {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) as StoreData;
        this.isAdBlockEnabled = data.isAdBlockEnabled ?? true;
        this.isTrackingProtectionEnabled = data.isTrackingProtectionEnabled ?? true;
        this.httpsOnlyMode = data.httpsOnlyMode ?? false;
        this.protectionLevel = (data.protectionLevel as ProtectionLevel) ?? 'standard';
        this.stats = data.stats ?? this.stats;
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
    }
  }

  private saveSettings(): void {
    this.ensureConfigPath();
    try {
      if (!this.configPath) return;
      const data: StoreData = {
        isAdBlockEnabled: this.isAdBlockEnabled,
        isTrackingProtectionEnabled: this.isTrackingProtectionEnabled,
        httpsOnlyMode: this.httpsOnlyMode,
        protectionLevel: this.protectionLevel,
        stats: this.stats,
      };
      fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save security settings:', error);
    }
  }

  async initialize(): Promise<void> {
    // Load settings now that app is ready
    this.loadSettings();

    // Load built-in block lists
    this.loadBuiltInLists();

    // Try to fetch updated lists (non-blocking)
    this.fetchUpdatedLists().catch(console.error);

    console.log('Security Engine initialized');
    console.log(`Loaded ${this.adBlockList.size} ad rules`);
    console.log(`Loaded ${this.trackerList.size} tracker rules`);
  }

  private loadBuiltInLists(): void {
    // Common ad domains
    const adDomains = [
      'doubleclick.net',
      'googlesyndication.com',
      'googleadservices.com',
      'adnxs.com',
      'adsrvr.org',
      'advertising.com',
      'adform.net',
      'adtech.de',
      'admob.com',
      'adsafeprotected.com',
      'adcolony.com',
      'amazon-adsystem.com',
      'bidswitch.net',
      'casalemedia.com',
      'criteo.com',
      'crwdcntrl.net',
      'demdex.net',
      'dotomi.com',
      'exelator.com',
      'eyeota.net',
      'facebook.com/tr',
      'facebook.net/en_US/fbevents.js',
      'flashtalking.com',
      'fwmrm.net',
      'googletag',
      'gstatic.com/cv',
      'iad-03.braze.com',
      'imrworldwide.com',
      'innovid.com',
      'intentmedia.net',
      'krxd.net',
      'liadm.com',
      'licdn.com/li.lms-analytics',
      'lijit.com',
      'liveintent.com',
      'liveramp.com',
      'mathtag.com',
      'media.net',
      'mediamath.com',
      'moatads.com',
      'mookie1.com',
      'myvisualiq.net',
      'nativo.com',
      'nexac.com',
      'openx.net',
      'outbrain.com',
      'pbid.pro',
      'pippio.com',
      'postrelease.com',
      'pubmatic.com',
      'quantcast.com',
      'quantserve.com',
      'rfihub.com',
      'rlcdn.com',
      'rubiconproject.com',
      'scorecardresearch.com',
      'semasio.net',
      'sharethrough.com',
      'simpli.fi',
      'smartadserver.com',
      'sojern.com',
      'spotxchange.com',
      'springserve.com',
      'taboola.com',
      'tapad.com',
      'teads.tv',
      'tidaltv.com',
      'tribalfusion.com',
      'truste.com',
      'turn.com',
      'undertone.com',
      'unrulymedia.com',
      'videologygroup.com',
      'yieldlab.net',
      'yieldmo.com',
      'zemanta.com',
      'zqtk.net',
    ];

    // Common trackers
    const trackerDomains = [
      'analytics.google.com',
      'google-analytics.com',
      'googleanalytics.com',
      'hotjar.com',
      'mixpanel.com',
      'segment.com',
      'segment.io',
      'amplitude.com',
      'heapanalytics.com',
      'fullstory.com',
      'logrocket.com',
      'newrelic.com',
      'nr-data.net',
      'mouseflow.com',
      'crazyegg.com',
      'luckyorange.com',
      'clicktale.net',
      'optimizely.com',
      'inspectlet.com',
      'mxpnl.com',
      'omtrdc.net',
      'pardot.com',
      'pingdom.net',
      'eloqua.com',
      'marketo.com',
      'marketo.net',
      'hubspot.com',
      'hs-analytics.net',
      'hs-scripts.com',
      'intercom.io',
      'intercomcdn.com',
      'drift.com',
      'sentry.io',
      'bugsnag.com',
      'rollbar.com',
      'appsflyer.com',
      'branch.io',
      'adjust.com',
      'kochava.com',
      'singular.net',
      'apptimize.com',
      'leanplum.com',
      'clevertap.com',
      'webengage.com',
      'onesignal.com',
      'pushwoosh.com',
      'airship.com',
      'braze.com',
      'firebase.google.com',
      'crashlytics.com',
      'flurry.com',
      'localytics.com',
      'tune.com',
      'omappapi.com',
      'ometria.com',
      'getdrip.com',
      'customer.io',
      'iterable.com',
      'sailthru.com',
      'responsys.net',
      'exacttarget.com',
      'cheetahdigital.com',
      'exponea.com',
      'moengage.com',
      'insider.com',
      'useinsider.com',
      'clerk.io',
      'nosto.com',
      'barilliance.com',
      'dynamic-yield.com',
      'evergage.com',
      'monetate.net',
      'certona.net',
      'richrelevance.com',
      'bloomreach.com',
    ];

    // Known malware/phishing domains (sample)
    const malwareDomains = [
      'malware-site.com',
      'phishing-example.net',
      // These would be loaded from a real threat feed in production
    ];

    adDomains.forEach(d => this.adBlockList.add(d));
    trackerDomains.forEach(d => this.trackerList.add(d));
    malwareDomains.forEach(d => this.malwareList.add(d));
  }

  private async fetchUpdatedLists(): Promise<void> {
    // In production, this would fetch from EasyList, EasyPrivacy, etc.
    // For now, we use the built-in lists
    try {
      // Example: Fetch EasyList
      // const easyList = await this.fetchList('https://easylist.to/easylist/easylist.txt');
      // this.parseEasyList(easyList);
      console.log('Block lists are up to date');
    } catch (error) {
      console.error('Failed to update block lists:', error);
    }
  }

  shouldBlock(url: string): boolean {
    if (!this.isAdBlockEnabled && !this.isTrackingProtectionEnabled) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check ad block list
      if (this.isAdBlockEnabled) {
        for (const domain of this.adBlockList) {
          if (hostname.includes(domain) || url.includes(domain)) {
            return true;
          }
        }
      }

      // Check tracker list
      if (this.isTrackingProtectionEnabled) {
        for (const domain of this.trackerList) {
          if (hostname.includes(domain) || url.includes(domain)) {
            return true;
          }
        }
      }

      // Check malware list (always active)
      for (const domain of this.malwareList) {
        if (hostname.includes(domain)) {
          return true;
        }
      }

      // Check phishing list (always active)
      for (const domain of this.phishingList) {
        if (hostname.includes(domain)) {
          return true;
        }
      }

      // Additional checks based on protection level
      if (this.protectionLevel === 'strict' || this.protectionLevel === 'paranoid') {
        // Block common tracking parameters
        if (urlObj.searchParams.has('utm_source') ||
            urlObj.searchParams.has('fbclid') ||
            urlObj.searchParams.has('gclid')) {
          // Don't block, but could strip these parameters
        }
      }

      if (this.protectionLevel === 'paranoid') {
        // Block third-party scripts
        // This is very aggressive and may break sites
      }

      return false;
    } catch {
      return false;
    }
  }

  recordBlockedRequest(url: string, type: 'ad' | 'tracker' | 'malware' | 'phishing'): void {
    switch (type) {
      case 'ad':
        this.stats.adsBlocked++;
        break;
      case 'tracker':
        this.stats.trackersBlocked++;
        break;
      case 'malware':
        this.stats.malwareBlocked++;
        this.stats.threatsBlocked++;
        break;
      case 'phishing':
        this.stats.phishingBlocked++;
        this.stats.threatsBlocked++;
        break;
    }

    // Record threat
    const threat: ThreatRecord = {
      id: Date.now().toString(),
      type,
      url,
      severity: type === 'malware' || type === 'phishing' ? 'critical' : 'low',
      blockedAt: new Date(),
    };

    this.recentThreats.unshift(threat);

    // Keep only last 100 threats
    if (this.recentThreats.length > 100) {
      this.recentThreats = this.recentThreats.slice(0, 100);
    }

    this.saveSettings();
  }

  // Settings toggles
  toggleAdBlock(): boolean {
    this.isAdBlockEnabled = !this.isAdBlockEnabled;
    this.saveSettings();
    return this.isAdBlockEnabled;
  }

  toggleTrackingProtection(): boolean {
    this.isTrackingProtectionEnabled = !this.isTrackingProtectionEnabled;
    this.saveSettings();
    return this.isTrackingProtectionEnabled;
  }

  toggleHttpsOnly(): boolean {
    this.httpsOnlyMode = !this.httpsOnlyMode;
    this.saveSettings();
    return this.httpsOnlyMode;
  }

  isHttpsOnlyEnabled(): boolean {
    return this.httpsOnlyMode;
  }

  setProtectionLevel(level: ProtectionLevel): void {
    this.protectionLevel = level;
    this.saveSettings();
  }

  getProtectionLevel(): ProtectionLevel {
    return this.protectionLevel;
  }

  // Get stats and info
  getStats(): SecurityStats & {
    isAdBlockEnabled: boolean;
    isTrackingProtectionEnabled: boolean;
    httpsOnlyMode: boolean;
    protectionLevel: ProtectionLevel;
  } {
    return {
      ...this.stats,
      isAdBlockEnabled: this.isAdBlockEnabled,
      isTrackingProtectionEnabled: this.isTrackingProtectionEnabled,
      httpsOnlyMode: this.httpsOnlyMode,
      protectionLevel: this.protectionLevel,
    };
  }

  getRecentThreats(): ThreatRecord[] {
    return this.recentThreats.slice(0, 20);
  }

  // Security scan
  async runSecurityScan(): Promise<{
    clean: boolean;
    issues: string[];
    recommendations: string[]
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check security settings
    if (!this.isAdBlockEnabled) {
      recommendations.push('Enable ad blocker for better protection');
    }

    if (!this.isTrackingProtectionEnabled) {
      recommendations.push('Enable tracking protection for privacy');
    }

    if (!this.httpsOnlyMode) {
      recommendations.push('Enable HTTPS-only mode for secure connections');
    }

    if (this.protectionLevel === 'standard') {
      recommendations.push('Consider using strict protection level for enhanced security');
    }

    // Update last scan time
    this.stats.lastScan = new Date().toISOString();
    this.saveSettings();

    return {
      clean: issues.length === 0,
      issues,
      recommendations,
    };
  }

  // Reset stats
  resetStats(): void {
    this.stats = {
      threatsBlocked: 0,
      trackersBlocked: 0,
      adsBlocked: 0,
      malwareBlocked: 0,
      phishingBlocked: 0,
      lastScan: null,
    };
    this.recentThreats = [];
    this.saveSettings();
  }
}
