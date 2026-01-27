// AI-Analytics Feature Store Service

import type { Feature, FeatureGroup } from '../types';

export interface FeatureStatistics {
  nullRate: number;
  uniqueCount: number;
  meanValue?: number;
  stdValue?: number;
  minValue?: number;
  maxValue?: number;
  percentiles?: Record<number, number>;
  distribution?: string;
}

export interface FeatureCorrelation {
  feature1: string;
  feature2: string;
  correlation: number;
  pValue: number;
}

export class FeatureStoreService {
  private featureCache: Map<string, Feature> = new Map();
  private groupCache: Map<string, FeatureGroup> = new Map();

  async getFeatureGroup(code: string): Promise<FeatureGroup | null> {
    if (this.groupCache.has(code)) {
      return this.groupCache.get(code)!;
    }
    // TODO: Fetch from sm_analytics database
    return null;
  }

  async getFeature(code: string): Promise<Feature | null> {
    if (this.featureCache.has(code)) {
      return this.featureCache.get(code)!;
    }
    // TODO: Fetch from sm_analytics database
    return null;
  }

  async computeStatistics(featureCode: string, data: number[]): Promise<FeatureStatistics> {
    const sorted = [...data].sort((a, b) => a - b);
    const n = data.length;
    const nullCount = data.filter(v => v === null || v === undefined || Number.isNaN(v)).length;
    const validData = data.filter(v => v !== null && v !== undefined && !Number.isNaN(v));

    const mean = validData.reduce((sum, v) => sum + v, 0) / validData.length;
    const variance = validData.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / validData.length;
    const std = Math.sqrt(variance);

    return {
      nullRate: nullCount / n,
      uniqueCount: new Set(validData).size,
      meanValue: mean,
      stdValue: std,
      minValue: sorted[0],
      maxValue: sorted[n - 1],
      percentiles: {
        5: this.percentile(sorted, 5),
        25: this.percentile(sorted, 25),
        50: this.percentile(sorted, 50),
        75: this.percentile(sorted, 75),
        95: this.percentile(sorted, 95),
      },
      distribution: this.detectDistribution(validData, mean, std),
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower] ?? 0;
    return (sorted[lower] ?? 0) * (upper - index) + (sorted[upper] ?? 0) * (index - lower);
  }

  private detectDistribution(data: number[], mean: number, std: number): string {
    // Simplified distribution detection using skewness
    const n = data.length;
    const skewness = data.reduce((sum, v) => sum + Math.pow((v - mean) / std, 3), 0) / n;
    const kurtosis = data.reduce((sum, v) => sum + Math.pow((v - mean) / std, 4), 0) / n - 3;

    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis) < 1) return 'NORMAL';
    if (skewness > 1) return 'LOGNORMAL';
    if (skewness < -1) return 'LEFT_SKEWED';
    return 'UNKNOWN';
  }

  async computeCorrelation(feature1Data: number[], feature2Data: number[]): Promise<number> {
    if (feature1Data.length !== feature2Data.length) {
      throw new Error('Feature arrays must have same length');
    }

    const n = feature1Data.length;
    const mean1 = feature1Data.reduce((s, v) => s + v, 0) / n;
    const mean2 = feature2Data.reduce((s, v) => s + v, 0) / n;

    let numerator = 0;
    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < n; i++) {
      const d1 = (feature1Data[i] ?? 0) - mean1;
      const d2 = (feature2Data[i] ?? 0) - mean2;
      numerator += d1 * d2;
      denom1 += d1 * d1;
      denom2 += d2 * d2;
    }

    return numerator / Math.sqrt(denom1 * denom2);
  }

  async refreshFeatureGroup(groupCode: string): Promise<void> {
    // TODO: Re-compute all feature statistics from source database
    console.log(`Refreshing feature group: ${groupCode}`);
    this.groupCache.delete(groupCode);
  }

  async getFeatureImportance(modelId: string): Promise<Array<{ feature: string; importance: number }>> {
    // TODO: Fetch from MLModel's feature importance
    return [];
  }
}

export const featureStoreService = new FeatureStoreService();
