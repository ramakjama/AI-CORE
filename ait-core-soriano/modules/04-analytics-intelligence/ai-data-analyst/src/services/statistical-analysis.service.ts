import { Injectable, Logger } from '@nestjs/common';
import * as stats from 'simple-statistics';
import * as math from 'mathjs';

export interface StatisticalSummary {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  variance: number;
  standardDeviation: number;
  min: number;
  max: number;
  range: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
    iqr: number;
  };
  skewness: number;
  kurtosis: number;
  coefficientOfVariation: number;
}

export interface CorrelationMatrix {
  variables: string[];
  matrix: number[][];
  significantPairs: Array<{
    var1: string;
    var2: string;
    correlation: number;
    pValue: number;
  }>;
}

@Injectable()
export class StatisticalAnalysisService {
  private readonly logger = new Logger(StatisticalAnalysisService.name);

  // Descriptive Statistics
  calculateDescriptiveStats(data: number[]): StatisticalSummary {
    if (!data || data.length === 0) {
      throw new Error('Data array cannot be empty');
    }

    const sorted = [...data].sort((a, b) => a - b);
    const mean = stats.mean(data);
    const variance = stats.variance(data);
    const stdDev = stats.standardDeviation(data);

    return {
      count: data.length,
      mean,
      median: stats.median(sorted),
      mode: stats.mode(data),
      variance,
      standardDeviation: stdDev,
      min: stats.min(data),
      max: stats.max(data),
      range: stats.max(data) - stats.min(data),
      quartiles: {
        q1: stats.quantile(sorted, 0.25),
        q2: stats.quantile(sorted, 0.5),
        q3: stats.quantile(sorted, 0.75),
        iqr: stats.quantile(sorted, 0.75) - stats.quantile(sorted, 0.25),
      },
      skewness: stats.sampleSkewness(data),
      kurtosis: stats.sampleKurtosis(data),
      coefficientOfVariation: mean !== 0 ? (stdDev / mean) * 100 : 0,
    };
  }

  // Correlation Analysis
  calculateCorrelationMatrix(
    data: Record<string, number[]>,
  ): CorrelationMatrix {
    const variables = Object.keys(data);
    const n = variables.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));
    const significantPairs: CorrelationMatrix['significantPairs'] = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (i < j) {
          const correlation = stats.sampleCorrelation(
            data[variables[i]],
            data[variables[j]],
          );
          matrix[i][j] = correlation;
          matrix[j][i] = correlation;

          // Calculate p-value (simplified)
          const pValue = this.calculateCorrelationPValue(
            correlation,
            data[variables[i]].length,
          );

          if (Math.abs(correlation) > 0.5 && pValue < 0.05) {
            significantPairs.push({
              var1: variables[i],
              var2: variables[j],
              correlation,
              pValue,
            });
          }
        }
      }
    }

    return { variables, matrix, significantPairs };
  }

  // Hypothesis Testing
  performTTest(
    sample1: number[],
    sample2: number[],
  ): {
    tStatistic: number;
    pValue: number;
    degreesOfFreedom: number;
    significant: boolean;
  } {
    const n1 = sample1.length;
    const n2 = sample2.length;
    const mean1 = stats.mean(sample1);
    const mean2 = stats.mean(sample2);
    const var1 = stats.variance(sample1);
    const var2 = stats.variance(sample2);

    // Pooled variance
    const pooledVar =
      ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);

    // T-statistic
    const tStatistic =
      (mean1 - mean2) / Math.sqrt(pooledVar * (1 / n1 + 1 / n2));

    const df = n1 + n2 - 2;
    const pValue = this.calculateTTestPValue(tStatistic, df);

    return {
      tStatistic,
      pValue,
      degreesOfFreedom: df,
      significant: pValue < 0.05,
    };
  }

  // ANOVA (Analysis of Variance)
  performANOVA(groups: number[][]): {
    fStatistic: number;
    pValue: number;
    betweenGroupVariance: number;
    withinGroupVariance: number;
    significant: boolean;
  } {
    const k = groups.length; // number of groups
    const n = groups.reduce((sum, group) => sum + group.length, 0); // total observations

    // Calculate grand mean
    const allValues = groups.flat();
    const grandMean = stats.mean(allValues);

    // Between-group variance (SSB)
    const ssb = groups.reduce((sum, group) => {
      const groupMean = stats.mean(group);
      return sum + group.length * Math.pow(groupMean - grandMean, 2);
    }, 0);

    // Within-group variance (SSW)
    const ssw = groups.reduce((sum, group) => {
      const groupMean = stats.mean(group);
      return (
        sum +
        group.reduce((s, val) => s + Math.pow(val - groupMean, 2), 0)
      );
    }, 0);

    const dfBetween = k - 1;
    const dfWithin = n - k;

    const msBetween = ssb / dfBetween;
    const msWithin = ssw / dfWithin;

    const fStatistic = msBetween / msWithin;
    const pValue = this.calculateFTestPValue(fStatistic, dfBetween, dfWithin);

    return {
      fStatistic,
      pValue,
      betweenGroupVariance: msBetween,
      withinGroupVariance: msWithin,
      significant: pValue < 0.05,
    };
  }

  // Regression Analysis
  performLinearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    r2: number;
    residuals: number[];
    standardError: number;
  } {
    const result = stats.linearRegression([x, y]);
    const line = stats.linearRegressionLine(result);

    const predictions = x.map(line);
    const residuals = y.map((val, i) => val - predictions[i]);
    const r2 = stats.rSquared([x, y], line);

    // Standard error of regression
    const n = x.length;
    const sse = residuals.reduce((sum, r) => sum + r * r, 0);
    const standardError = Math.sqrt(sse / (n - 2));

    return {
      slope: result.m,
      intercept: result.b,
      r2,
      residuals,
      standardError,
    };
  }

  // Outlier Detection
  detectOutliers(
    data: number[],
    method: 'iqr' | 'zscore' = 'iqr',
  ): {
    outliers: number[];
    indices: number[];
    bounds: { lower: number; upper: number };
  } {
    if (method === 'iqr') {
      const sorted = [...data].sort((a, b) => a - b);
      const q1 = stats.quantile(sorted, 0.25);
      const q3 = stats.quantile(sorted, 0.75);
      const iqr = q3 - q1;

      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const outliers: number[] = [];
      const indices: number[] = [];

      data.forEach((val, i) => {
        if (val < lowerBound || val > upperBound) {
          outliers.push(val);
          indices.push(i);
        }
      });

      return {
        outliers,
        indices,
        bounds: { lower: lowerBound, upper: upperBound },
      };
    } else {
      // Z-score method
      const mean = stats.mean(data);
      const stdDev = stats.standardDeviation(data);

      const outliers: number[] = [];
      const indices: number[] = [];

      data.forEach((val, i) => {
        const zScore = Math.abs((val - mean) / stdDev);
        if (zScore > 3) {
          outliers.push(val);
          indices.push(i);
        }
      });

      return {
        outliers,
        indices,
        bounds: {
          lower: mean - 3 * stdDev,
          upper: mean + 3 * stdDev,
        },
      };
    }
  }

  // Distribution Testing
  performNormalityTest(data: number[]): {
    isNormal: boolean;
    skewness: number;
    kurtosis: number;
    shapiroWilk?: number;
  } {
    const skewness = stats.sampleSkewness(data);
    const kurtosis = stats.sampleKurtosis(data);

    // Simple normality check based on skewness and kurtosis
    const isNormal =
      Math.abs(skewness) < 1 && Math.abs(kurtosis - 3) < 1;

    return {
      isNormal,
      skewness,
      kurtosis,
    };
  }

  // Confidence Intervals
  calculateConfidenceInterval(
    data: number[],
    confidence: number = 0.95,
  ): {
    mean: number;
    lower: number;
    upper: number;
    marginOfError: number;
  } {
    const mean = stats.mean(data);
    const stdError = stats.standardDeviation(data) / Math.sqrt(data.length);

    // Z-score for confidence level (approximation)
    const zScore = this.getZScore(confidence);
    const marginOfError = zScore * stdError;

    return {
      mean,
      lower: mean - marginOfError,
      upper: mean + marginOfError,
      marginOfError,
    };
  }

  // Chi-Square Test
  performChiSquareTest(
    observed: number[],
    expected: number[],
  ): {
    chiSquare: number;
    pValue: number;
    degreesOfFreedom: number;
    significant: boolean;
  } {
    if (observed.length !== expected.length) {
      throw new Error('Observed and expected arrays must have the same length');
    }

    const chiSquare = observed.reduce((sum, obs, i) => {
      const exp = expected[i];
      return sum + Math.pow(obs - exp, 2) / exp;
    }, 0);

    const df = observed.length - 1;
    const pValue = this.calculateChiSquarePValue(chiSquare, df);

    return {
      chiSquare,
      pValue,
      degreesOfFreedom: df,
      significant: pValue < 0.05,
    };
  }

  // Helper methods for p-value calculations
  private calculateCorrelationPValue(r: number, n: number): number {
    const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
    return this.calculateTTestPValue(t, n - 2);
  }

  private calculateTTestPValue(t: number, df: number): number {
    // Simplified p-value calculation (approximation)
    const absT = Math.abs(t);
    if (absT > 3) return 0.01;
    if (absT > 2) return 0.05;
    if (absT > 1.5) return 0.1;
    return 0.2;
  }

  private calculateFTestPValue(
    f: number,
    df1: number,
    df2: number,
  ): number {
    // Simplified p-value calculation (approximation)
    if (f > 5) return 0.01;
    if (f > 3) return 0.05;
    if (f > 2) return 0.1;
    return 0.2;
  }

  private calculateChiSquarePValue(chiSquare: number, df: number): number {
    // Simplified p-value calculation (approximation)
    const criticalValue = df * 2; // Rough approximation
    return chiSquare > criticalValue ? 0.05 : 0.2;
  }

  private getZScore(confidence: number): number {
    const zScores: Record<number, number> = {
      0.9: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    return zScores[confidence] || 1.96;
  }
}
