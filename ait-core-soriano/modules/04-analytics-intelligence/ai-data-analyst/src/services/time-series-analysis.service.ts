import { Injectable, Logger } from '@nestjs/common';

export interface TimeSeriesDecomposition {
  trend: number[];
  seasonal: number[];
  residual: number[];
  period: number;
}

export interface ForecastResult {
  predictions: number[];
  confidenceIntervals: Array<{ lower: number; upper: number }>;
  method: string;
  metrics: {
    mse: number;
    mae: number;
    mape: number;
  };
}

@Injectable()
export class TimeSeriesAnalysisService {
  private readonly logger = new Logger(TimeSeriesAnalysisService.name);

  // Moving Average
  calculateMovingAverage(data: number[], window: number): number[] {
    if (window > data.length) {
      throw new Error('Window size cannot be larger than data length');
    }

    const result: number[] = [];
    for (let i = 0; i <= data.length - window; i++) {
      const windowData = data.slice(i, i + window);
      const avg = windowData.reduce((a, b) => a + b, 0) / window;
      result.push(avg);
    }

    return result;
  }

  // Exponential Smoothing
  exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
  ): number[] {
    if (alpha < 0 || alpha > 1) {
      throw new Error('Alpha must be between 0 and 1');
    }

    const result: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
      result.push(smoothed);
    }

    return result;
  }

  // Double Exponential Smoothing (Holt's Method)
  doubleExponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    beta: number = 0.1,
  ): { level: number[]; trend: number[]; forecast: number[] } {
    const level: number[] = [data[0]];
    const trend: number[] = [data[1] - data[0]];
    const forecast: number[] = [data[0]];

    for (let i = 1; i < data.length; i++) {
      const prevLevel = level[i - 1];
      const prevTrend = trend[i - 1];

      const newLevel = alpha * data[i] + (1 - alpha) * (prevLevel + prevTrend);
      const newTrend = beta * (newLevel - prevLevel) + (1 - beta) * prevTrend;

      level.push(newLevel);
      trend.push(newTrend);
      forecast.push(newLevel + newTrend);
    }

    return { level, trend, forecast };
  }

  // Seasonal Decomposition
  seasonalDecomposition(
    data: number[],
    period: number,
  ): TimeSeriesDecomposition {
    // Calculate trend using moving average
    const trend = this.calculateTrend(data, period);

    // Calculate seasonal component
    const detrended = data.map((val, i) => {
      const trendIndex = Math.floor(i - (period - 1) / 2);
      return trendIndex >= 0 && trendIndex < trend.length
        ? val - trend[trendIndex]
        : 0;
    });

    const seasonal = this.calculateSeasonal(detrended, period);

    // Calculate residual
    const residual = data.map((val, i) => {
      const trendIndex = Math.floor(i - (period - 1) / 2);
      const t = trendIndex >= 0 && trendIndex < trend.length ? trend[trendIndex] : val;
      const s = seasonal[i % period];
      return val - t - s;
    });

    return { trend, seasonal, residual, period };
  }

  // ARIMA Forecasting (simplified)
  arimaForecast(
    data: number[],
    steps: number,
    params: { p: number; d: number; q: number } = { p: 1, d: 1, q: 1 },
  ): ForecastResult {
    // Differencing
    let series = [...data];
    for (let i = 0; i < params.d; i++) {
      series = this.difference(series);
    }

    // Simple AR model for forecasting
    const predictions: number[] = [];
    const lastValues = series.slice(-params.p);

    for (let i = 0; i < steps; i++) {
      // Simple autoregressive prediction
      const prediction =
        lastValues.reduce((sum, val, idx) => {
          const weight = (params.p - idx) / params.p;
          return sum + val * weight;
        }, 0) / params.p;

      predictions.push(prediction);
      lastValues.shift();
      lastValues.push(prediction);
    }

    // Reverse differencing
    let forecasts = [...predictions];
    for (let i = 0; i < params.d; i++) {
      forecasts = this.reverseDifference(forecasts, data);
    }

    // Calculate confidence intervals
    const stdDev = this.calculateStdDev(series);
    const confidenceIntervals = forecasts.map((pred) => ({
      lower: pred - 1.96 * stdDev,
      upper: pred + 1.96 * stdDev,
    }));

    // Calculate metrics on training data
    const trainPredictions = this.predictInSample(data, params.p);
    const metrics = this.calculateForecastMetrics(
      data.slice(params.p),
      trainPredictions,
    );

    return {
      predictions: forecasts,
      confidenceIntervals,
      method: `ARIMA(${params.p},${params.d},${params.q})`,
      metrics,
    };
  }

  // Autocorrelation Function
  calculateAutocorrelation(data: number[], maxLag: number): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      data.length;

    const acf: number[] = [];

    for (let lag = 0; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < data.length - lag; i++) {
        sum += (data[i] - mean) * (data[i + lag] - mean);
      }
      acf.push(sum / (data.length * variance));
    }

    return acf;
  }

  // Detect Seasonality
  detectSeasonality(data: number[], maxPeriod: number = 24): {
    hasSeasonal: boolean;
    period: number | null;
    strength: number;
  } {
    const acf = this.calculateAutocorrelation(data, maxPeriod);

    // Find peaks in ACF (excluding lag 0)
    let maxCorrelation = 0;
    let detectedPeriod = null;

    for (let lag = 2; lag <= maxPeriod; lag++) {
      if (acf[lag] > maxCorrelation && acf[lag] > 0.3) {
        maxCorrelation = acf[lag];
        detectedPeriod = lag;
      }
    }

    return {
      hasSeasonal: maxCorrelation > 0.3,
      period: detectedPeriod,
      strength: maxCorrelation,
    };
  }

  // Trend Detection
  detectTrend(data: number[]): {
    hasTrend: boolean;
    direction: 'increasing' | 'decreasing' | 'none';
    slope: number;
    significance: number;
  } {
    // Simple linear regression
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    // Calculate significance
    const yMean = sumY / n;
    const yPred = x.map((xi) => slope * xi + (yMean - slope * (n - 1) / 2));
    const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - yPred[i], 2), 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - ssRes / ssTot;

    let direction: 'increasing' | 'decreasing' | 'none' = 'none';
    if (Math.abs(slope) > 0.01 && r2 > 0.3) {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      hasTrend: Math.abs(slope) > 0.01 && r2 > 0.3,
      direction,
      slope,
      significance: r2,
    };
  }

  // Anomaly Detection in Time Series
  detectAnomalies(
    data: number[],
    threshold: number = 3,
  ): Array<{ index: number; value: number; score: number }> {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = this.calculateStdDev(data);

    const anomalies: Array<{ index: number; value: number; score: number }> = [];

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({ index, value, score: zScore });
      }
    });

    return anomalies;
  }

  // Change Point Detection
  detectChangePoints(
    data: number[],
    windowSize: number = 10,
  ): number[] {
    const changePoints: number[] = [];

    for (let i = windowSize; i < data.length - windowSize; i++) {
      const before = data.slice(i - windowSize, i);
      const after = data.slice(i, i + windowSize);

      const meanBefore = before.reduce((a, b) => a + b, 0) / windowSize;
      const meanAfter = after.reduce((a, b) => a + b, 0) / windowSize;

      const stdBefore = this.calculateStdDev(before);
      const stdAfter = this.calculateStdDev(after);

      // Check for significant change
      const tStat = Math.abs(meanAfter - meanBefore) /
        Math.sqrt((stdBefore ** 2 + stdAfter ** 2) / windowSize);

      if (tStat > 2) {
        changePoints.push(i);
      }
    }

    return changePoints;
  }

  // Helper methods
  private calculateTrend(data: number[], period: number): number[] {
    const halfPeriod = Math.floor(period / 2);
    const trend: number[] = [];

    for (let i = halfPeriod; i < data.length - halfPeriod; i++) {
      const window = data.slice(i - halfPeriod, i + halfPeriod + 1);
      const avg = window.reduce((a, b) => a + b, 0) / window.length;
      trend.push(avg);
    }

    return trend;
  }

  private calculateSeasonal(detrended: number[], period: number): number[] {
    const seasonal: number[] = Array(period).fill(0);
    const counts: number[] = Array(period).fill(0);

    detrended.forEach((val, i) => {
      const seasonIndex = i % period;
      seasonal[seasonIndex] += val;
      counts[seasonIndex]++;
    });

    return seasonal.map((sum, i) => (counts[i] > 0 ? sum / counts[i] : 0));
  }

  private difference(series: number[]): number[] {
    const result: number[] = [];
    for (let i = 1; i < series.length; i++) {
      result.push(series[i] - series[i - 1]);
    }
    return result;
  }

  private reverseDifference(
    differenced: number[],
    original: number[],
  ): number[] {
    const result: number[] = [original[original.length - 1]];
    for (let i = 0; i < differenced.length; i++) {
      result.push(result[result.length - 1] + differenced[i]);
    }
    return result.slice(1);
  }

  private predictInSample(data: number[], p: number): number[] {
    const predictions: number[] = [];

    for (let i = p; i < data.length; i++) {
      const lastValues = data.slice(i - p, i);
      const prediction =
        lastValues.reduce((sum, val, idx) => {
          const weight = (p - idx) / p;
          return sum + val * weight;
        }, 0) / p;
      predictions.push(prediction);
    }

    return predictions;
  }

  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      data.length;
    return Math.sqrt(variance);
  }

  private calculateForecastMetrics(
    actual: number[],
    predicted: number[],
  ): { mse: number; mae: number; mape: number } {
    const n = Math.min(actual.length, predicted.length);
    let mse = 0;
    let mae = 0;
    let mape = 0;

    for (let i = 0; i < n; i++) {
      const error = actual[i] - predicted[i];
      mse += error * error;
      mae += Math.abs(error);
      if (actual[i] !== 0) {
        mape += Math.abs(error / actual[i]);
      }
    }

    return {
      mse: mse / n,
      mae: mae / n,
      mape: (mape / n) * 100,
    };
  }
}
