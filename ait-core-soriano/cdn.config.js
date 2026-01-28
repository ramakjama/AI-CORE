/**
 * AIT-CORE CDN Configuration
 * Cloudflare, AWS CloudFront, and other CDN integrations
 */

const axios = require('axios');

// CDN Providers Configuration
const cdnProviders = {
  cloudflare: {
    enabled: process.env.CLOUDFLARE_ENABLED === 'true',
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN,
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
    baseUrl: 'https://api.cloudflare.com/client/v4',
    purgeEndpoint: '/zones/{zoneId}/purge_cache',
  },

  cloudfront: {
    enabled: process.env.CLOUDFRONT_ENABLED === 'true',
    distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  custom: {
    enabled: process.env.CUSTOM_CDN_ENABLED === 'true',
    url: process.env.CDN_URL || 'https://cdn.ait-core.com',
    purgeUrl: process.env.CDN_PURGE_URL,
    apiKey: process.env.CDN_API_KEY,
  },
};

// Asset routing configuration
const assetRouting = {
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2|ttf|eot)$/,
    cdnPath: '/static',
    cacheTTL: 31536000, // 1 year
  },
  images: {
    pattern: /\.(png|jpg|jpeg|gif|webp|avif|svg)$/,
    cdnPath: '/images',
    cacheTTL: 2592000, // 30 days
    transforms: {
      enabled: true,
      quality: 85,
      formats: ['webp', 'avif'],
    },
  },
  fonts: {
    pattern: /\.(woff|woff2|ttf|eot|otf)$/,
    cdnPath: '/fonts',
    cacheTTL: 31536000, // 1 year
  },
  videos: {
    pattern: /\.(mp4|webm|ogg)$/,
    cdnPath: '/videos',
    cacheTTL: 604800, // 7 days
  },
};

// Cache purge strategies
const purgeStrategies = {
  immediate: {
    enabled: true,
    triggers: ['deployment', 'manual'],
  },
  scheduled: {
    enabled: false,
    cron: '0 0 * * *', // Daily at midnight
  },
  onDemand: {
    enabled: true,
    paths: [],
  },
};

// CDN Manager Class
class CDNManager {
  constructor() {
    this.provider = this.detectProvider();
  }

  detectProvider() {
    if (cdnProviders.cloudflare.enabled) return 'cloudflare';
    if (cdnProviders.cloudfront.enabled) return 'cloudfront';
    if (cdnProviders.custom.enabled) return 'custom';
    return null;
  }

  // Get CDN URL for asset
  getCDNUrl(assetPath, type = 'static') {
    if (!this.provider) return assetPath;

    const config = cdnProviders[this.provider];
    const routing = assetRouting[type] || assetRouting.static;

    let cdnUrl;
    if (this.provider === 'cloudflare') {
      cdnUrl = `https://${process.env.CLOUDFLARE_DOMAIN}${routing.cdnPath}${assetPath}`;
    } else if (this.provider === 'cloudfront') {
      cdnUrl = `https://${process.env.CLOUDFRONT_DOMAIN}${routing.cdnPath}${assetPath}`;
    } else {
      cdnUrl = `${config.url}${routing.cdnPath}${assetPath}`;
    }

    return cdnUrl;
  }

  // Purge cache for specific paths
  async purgeCache(paths = []) {
    if (!this.provider) {
      console.log('No CDN provider configured');
      return { success: false, message: 'No CDN provider configured' };
    }

    try {
      switch (this.provider) {
        case 'cloudflare':
          return await this.purgeCloudflare(paths);
        case 'cloudfront':
          return await this.purgeCloudFront(paths);
        case 'custom':
          return await this.purgeCustomCDN(paths);
        default:
          return { success: false, message: 'Unknown CDN provider' };
      }
    } catch (error) {
      console.error('CDN purge error:', error);
      return { success: false, message: error.message };
    }
  }

  // Cloudflare purge
  async purgeCloudflare(paths = []) {
    const config = cdnProviders.cloudflare;
    const url = `${config.baseUrl}/zones/${config.zoneId}/purge_cache`;

    const payload = paths.length > 0
      ? { files: paths }
      : { purge_everything: true };

    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: response.data.success,
      message: response.data.success ? 'Cache purged successfully' : 'Cache purge failed',
      data: response.data,
    };
  }

  // CloudFront purge
  async purgeCloudFront(paths = []) {
    const AWS = require('aws-sdk');
    const config = cdnProviders.cloudfront;

    const cloudfront = new AWS.CloudFront({
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    });

    const params = {
      DistributionId: config.distributionId,
      InvalidationBatch: {
        CallerReference: `purge-${Date.now()}`,
        Paths: {
          Quantity: paths.length > 0 ? paths.length : 1,
          Items: paths.length > 0 ? paths : ['/*'],
        },
      },
    };

    const result = await cloudfront.createInvalidation(params).promise();

    return {
      success: true,
      message: 'Cache invalidation created',
      data: result,
    };
  }

  // Custom CDN purge
  async purgeCustomCDN(paths = []) {
    const config = cdnProviders.custom;

    if (!config.purgeUrl) {
      return { success: false, message: 'Purge URL not configured' };
    }

    const response = await axios.post(config.purgeUrl, {
      paths: paths.length > 0 ? paths : ['*'],
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: response.data.success || response.status === 200,
      message: 'Cache purged successfully',
      data: response.data,
    };
  }

  // Purge all cache
  async purgeAll() {
    return await this.purgeCache([]);
  }

  // Purge by pattern
  async purgeByPattern(pattern) {
    const paths = [`/*${pattern}*`];
    return await this.purgeCache(paths);
  }

  // Preload assets
  async preloadAssets(assets = []) {
    if (!this.provider || this.provider !== 'cloudflare') {
      return { success: false, message: 'Preload only supported on Cloudflare' };
    }

    // Cloudflare Cache Reserve / Always Online
    // This would require making requests to warm the cache
    const results = [];

    for (const asset of assets) {
      try {
        const url = this.getCDNUrl(asset);
        await axios.head(url);
        results.push({ asset, success: true });
      } catch (error) {
        results.push({ asset, success: false, error: error.message });
      }
    }

    return {
      success: true,
      message: `Preloaded ${results.filter(r => r.success).length}/${results.length} assets`,
      results,
    };
  }

  // Get CDN analytics
  async getAnalytics(startDate, endDate) {
    if (!this.provider || this.provider !== 'cloudflare') {
      return { success: false, message: 'Analytics only available for Cloudflare' };
    }

    const config = cdnProviders.cloudflare;
    const url = `${config.baseUrl}/zones/${config.zoneId}/analytics/dashboard`;

    const response = await axios.get(url, {
      params: {
        since: startDate,
        until: endDate,
      },
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
      },
    });

    return {
      success: response.data.success,
      data: response.data.result,
    };
  }
}

// URL transformation helpers
function transformImageUrl(url, options = {}) {
  const {
    width,
    height,
    quality = 85,
    format = 'auto',
  } = options;

  // Cloudflare Image Resizing
  if (cdnProviders.cloudflare.enabled) {
    const params = new URLSearchParams();
    if (width) params.append('width', width);
    if (height) params.append('height', height);
    if (quality) params.append('quality', quality);
    if (format) params.append('format', format);

    return `${url}?${params.toString()}`;
  }

  return url;
}

function generateSrcSet(url, widths = [640, 768, 1024, 1280, 1920]) {
  return widths
    .map(width => {
      const transformedUrl = transformImageUrl(url, { width, format: 'webp' });
      return `${transformedUrl} ${width}w`;
    })
    .join(', ');
}

// Create singleton instance
const cdnManager = new CDNManager();

module.exports = {
  cdnProviders,
  assetRouting,
  purgeStrategies,
  cdnManager,
  transformImageUrl,
  generateSrcSet,
};
