import { Injectable, Logger } from '@nestjs/common';
import { MetricPoint } from '../types/metrics.types';

interface LiveMetric {
  value: number;
  lastUpdated: Date;
  changePercentage: number;
}

@Injectable()
export class RealTimeMetricsService {
  private readonly logger = new Logger(RealTimeMetricsService.name);
  private metricsCache: Map<string, LiveMetric> = new Map();
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Get current number of active users/sessions
   */
  async getCurrentActive(): Promise<number> {
    return this.getCachedOrFetch('current_active', async () => {
      // Mock: In production, query from session store or analytics
      return Math.floor(Math.random() * 100 + 20);
    });
  }

  /**
   * Get today's revenue so far
   */
  async getTodayRevenue(): Promise<number> {
    return this.getCachedOrFetch('today_revenue', async () => {
      // Mock: In production, sum today's transactions
      return Math.random() * 50000 + 10000;
    });
  }

  /**
   * Get today's policy count
   */
  async getTodayPolicies(): Promise<number> {
    return this.getCachedOrFetch('today_policies', async () => {
      return Math.floor(Math.random() * 50 + 10);
    });
  }

  /**
   * Get today's new customers
   */
  async getTodayCustomers(): Promise<number> {
    return this.getCachedOrFetch('today_customers', async () => {
      return Math.floor(Math.random() * 20 + 5);
    });
  }

  /**
   * Get today's quotes generated
   */
  async getTodayQuotes(): Promise<number> {
    return this.getCachedOrFetch('today_quotes', async () => {
      return Math.floor(Math.random() * 100 + 30);
    });
  }

  /**
   * Get today's claims filed
   */
  async getTodayClaims(): Promise<number> {
    return this.getCachedOrFetch('today_claims', async () => {
      return Math.floor(Math.random() * 10 + 2);
    });
  }

  /**
   * Get last 24 hours data points for a metric
   */
  async getLast24Hours(metric: string, granularity: 'hour' | '15min' = 'hour'): Promise<MetricPoint[]> {
    this.logger.log(`Fetching last 24 hours of ${metric} data`);

    const points: MetricPoint[] = [];
    const now = new Date();
    const intervalMinutes = granularity === 'hour' ? 60 : 15;
    const pointsCount = granularity === 'hour' ? 24 : 96;

    for (let i = pointsCount - 1; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000);
      const value = await this.getHistoricalMetricValue(metric, timestamp);

      points.push({
        timestamp,
        value,
        label: this.formatTimestamp(timestamp, granularity),
      });
    }

    return points;
  }

  /**
   * Get last hour data (minute by minute)
   */
  async getLastHour(metric: string): Promise<MetricPoint[]> {
    const points: MetricPoint[] = [];
    const now = new Date();

    for (let i = 59; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      const value = await this.getHistoricalMetricValue(metric, timestamp);

      points.push({
        timestamp,
        value,
        label: timestamp.toLocaleTimeString(),
      });
    }

    return points;
  }

  /**
   * Get current conversion rate (real-time)
   */
  async getCurrentConversionRate(): Promise<number> {
    const quotes = await this.getTodayQuotes();
    const policies = await this.getTodayPolicies();
    return quotes > 0 ? (policies / quotes) * 100 : 0;
  }

  /**
   * Get current average response time (in minutes)
   */
  async getCurrentAverageResponseTime(): Promise<number> {
    return this.getCachedOrFetch('current_response_time', async () => {
      return Math.random() * 30 + 5;
    });
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<{
    apiResponseTime: number;
    activeConnections: number;
    errorRate: number;
    throughput: number;
  }> {
    return {
      apiResponseTime: Math.random() * 100 + 50, // ms
      activeConnections: Math.floor(Math.random() * 500 + 100),
      errorRate: Math.random() * 2, // percentage
      throughput: Math.floor(Math.random() * 1000 + 500), // requests/min
    };
  }

  /**
   * Get live dashboard summary
   */
  async getLiveDashboard(): Promise<{
    active: number;
    revenue: number;
    policies: number;
    quotes: number;
    claims: number;
    conversionRate: number;
    responseTime: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const [active, revenue, policies, quotes, claims, conversionRate, responseTime] = await Promise.all([
      this.getCurrentActive(),
      this.getTodayRevenue(),
      this.getTodayPolicies(),
      this.getTodayQuotes(),
      this.getTodayClaims(),
      this.getCurrentConversionRate(),
      this.getCurrentAverageResponseTime(),
    ]);

    // Determine trend based on hour-over-hour comparison
    const trend = await this.determineTrend('revenue');

    return {
      active,
      revenue,
      policies,
      quotes,
      claims,
      conversionRate,
      responseTime,
      trend,
    };
  }

  /**
   * Get metric change (vs previous period)
   */
  async getMetricChange(metric: string, timeWindow: 'hour' | 'day' = 'hour'): Promise<{
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
  }> {
    const current = await this.getCurrentMetricValue(metric);
    const previous = await this.getPreviousMetricValue(metric, timeWindow);
    const change = current - previous;
    const changePercentage = previous !== 0 ? (change / previous) * 100 : 0;

    return {
      current,
      previous,
      change,
      changePercentage,
    };
  }

  /**
   * Subscribe to real-time updates (for WebSocket)
   */
  async subscribeToMetric(metric: string, callback: (value: number) => void): Promise<void> {
    this.logger.log(`Subscribing to real-time updates for ${metric}`);
    // In production, this would set up WebSocket or SSE connection
    // Mock implementation with polling
    setInterval(async () => {
      const value = await this.getCurrentMetricValue(metric);
      callback(value);
    }, 5000); // Update every 5 seconds
  }

  /**
   * Get top performers (agents, products, regions) in real-time
   */
  async getTopPerformers(dimension: 'agent' | 'product' | 'region', limit: number = 10): Promise<Array<{
    id: string;
    name: string;
    value: number;
    rank: number;
  }>> {
    // Mock implementation
    const performers = [];
    for (let i = 0; i < limit; i++) {
      performers.push({
        id: `${dimension}_${i + 1}`,
        name: `${dimension.charAt(0).toUpperCase() + dimension.slice(1)} ${i + 1}`,
        value: Math.random() * 10000 + 1000,
        rank: i + 1,
      });
    }
    return performers;
  }

  /**
   * Get alerts based on thresholds
   */
  async getActiveAlerts(): Promise<Array<{
    metric: string;
    currentValue: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    triggeredAt: Date;
  }>> {
    const alerts = [];

    // Check conversion rate
    const conversionRate = await this.getCurrentConversionRate();
    if (conversionRate < 10) {
      alerts.push({
        metric: 'conversion_rate',
        currentValue: conversionRate,
        threshold: 10,
        severity: 'high' as const,
        message: 'Conversion rate dropped below 10%',
        triggeredAt: new Date(),
      });
    }

    // Check response time
    const responseTime = await this.getCurrentAverageResponseTime();
    if (responseTime > 30) {
      alerts.push({
        metric: 'response_time',
        currentValue: responseTime,
        threshold: 30,
        severity: 'medium' as const,
        message: 'Average response time exceeds 30 minutes',
        triggeredAt: new Date(),
      });
    }

    return alerts;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async getCachedOrFetch(key: string, fetchFn: () => Promise<number>): Promise<number> {
    const cached = this.metricsCache.get(key);

    if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_TTL) {
      return cached.value;
    }

    const value = await fetchFn();
    this.metricsCache.set(key, {
      value,
      lastUpdated: new Date(),
      changePercentage: 0,
    });

    return value;
  }

  private async getCurrentMetricValue(metric: string): Promise<number> {
    const methodMap: Record<string, () => Promise<number>> = {
      revenue: this.getTodayRevenue.bind(this),
      policies: this.getTodayPolicies.bind(this),
      customers: this.getTodayCustomers.bind(this),
      quotes: this.getTodayQuotes.bind(this),
      claims: this.getTodayClaims.bind(this),
      active: this.getCurrentActive.bind(this),
    };

    const method = methodMap[metric];
    return method ? method() : 0;
  }

  private async getPreviousMetricValue(metric: string, timeWindow: 'hour' | 'day'): Promise<number> {
    // Mock: In production, query from time-series database
    const current = await this.getCurrentMetricValue(metric);
    return current * (0.8 + Math.random() * 0.4); // Random variation
  }

  private async getHistoricalMetricValue(metric: string, timestamp: Date): Promise<number> {
    // Mock: Generate realistic-looking historical data
    const hour = timestamp.getHours();
    const baseValue = await this.getCurrentMetricValue(metric);

    // Add time-of-day pattern
    const timeMultiplier = Math.sin((hour - 6) * Math.PI / 12) * 0.3 + 0.7;

    // Add some randomness
    const randomVariation = 0.8 + Math.random() * 0.4;

    return baseValue * timeMultiplier * randomVariation;
  }

  private async determineTrend(metric: string): Promise<'up' | 'down' | 'stable'> {
    const change = await this.getMetricChange(metric, 'hour');

    if (Math.abs(change.changePercentage) < 5) {
      return 'stable';
    }

    return change.changePercentage > 0 ? 'up' : 'down';
  }

  private formatTimestamp(timestamp: Date, granularity: 'hour' | '15min'): string {
    if (granularity === 'hour') {
      return timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  }

  /**
   * Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.metricsCache.clear();
    this.logger.log('Metrics cache cleared');
  }
}
