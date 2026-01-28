import { Injectable, Logger } from '@nestjs/common';

export interface DataQualityReport {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  missingValues: Record<string, number>;
  duplicateRecords: number;
  outliers: Record<string, number[]>;
  dataTypes: Record<string, string>;
  qualityScore: number;
}

@Injectable()
export class DataProcessingService {
  private readonly logger = new Logger(DataProcessingService.name);

  // Data Cleaning
  cleanData(
    data: any[],
    options: {
      removeDuplicates?: boolean;
      handleMissing?: 'remove' | 'mean' | 'median' | 'mode' | 'forward' | 'backward';
      removeOutliers?: boolean;
      normalizeNumeric?: boolean;
    } = {},
  ): any[] {
    let cleaned = [...data];

    // Remove duplicates
    if (options.removeDuplicates) {
      cleaned = this.removeDuplicates(cleaned);
    }

    // Handle missing values
    if (options.handleMissing) {
      cleaned = this.handleMissingValues(cleaned, options.handleMissing);
    }

    // Remove outliers
    if (options.removeOutliers) {
      cleaned = this.removeOutliers(cleaned);
    }

    // Normalize numeric values
    if (options.normalizeNumeric) {
      cleaned = this.normalizeNumericFields(cleaned);
    }

    return cleaned;
  }

  // Remove duplicate records
  removeDuplicates(data: any[]): any[] {
    const seen = new Set<string>();
    return data.filter((item) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Handle missing values
  handleMissingValues(
    data: any[],
    method: 'remove' | 'mean' | 'median' | 'mode' | 'forward' | 'backward',
  ): any[] {
    if (method === 'remove') {
      return data.filter((record) =>
        Object.values(record).every((val) => val != null && val !== ''),
      );
    }

    const fields = Object.keys(data[0] || {});
    const result = [...data];

    fields.forEach((field) => {
      const values = data
        .map((r) => r[field])
        .filter((v) => v != null && v !== '');

      if (values.length === 0) return;

      let fillValue: any;

      switch (method) {
        case 'mean':
          if (typeof values[0] === 'number') {
            fillValue = values.reduce((a, b) => a + b, 0) / values.length;
          }
          break;
        case 'median':
          if (typeof values[0] === 'number') {
            const sorted = [...values].sort((a, b) => a - b);
            fillValue = sorted[Math.floor(sorted.length / 2)];
          }
          break;
        case 'mode':
          const counts = new Map<any, number>();
          values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
          fillValue = Array.from(counts.entries()).sort(
            (a, b) => b[1] - a[1],
          )[0][0];
          break;
        case 'forward':
          result.forEach((record, i) => {
            if (record[field] == null || record[field] === '') {
              for (let j = i - 1; j >= 0; j--) {
                if (result[j][field] != null && result[j][field] !== '') {
                  record[field] = result[j][field];
                  break;
                }
              }
            }
          });
          return;
        case 'backward':
          result.forEach((record, i) => {
            if (record[field] == null || record[field] === '') {
              for (let j = i + 1; j < result.length; j++) {
                if (result[j][field] != null && result[j][field] !== '') {
                  record[field] = result[j][field];
                  break;
                }
              }
            }
          });
          return;
      }

      if (fillValue !== undefined) {
        result.forEach((record) => {
          if (record[field] == null || record[field] === '') {
            record[field] = fillValue;
          }
        });
      }
    });

    return result;
  }

  // Remove outliers
  removeOutliers(data: any[]): any[] {
    const numericFields = this.getNumericFields(data);
    const bounds: Record<string, { lower: number; upper: number }> = {};

    // Calculate IQR bounds for each numeric field
    numericFields.forEach((field) => {
      const values = data
        .map((r) => r[field])
        .filter((v) => typeof v === 'number')
        .sort((a, b) => a - b);

      if (values.length === 0) return;

      const q1 = values[Math.floor(values.length * 0.25)];
      const q3 = values[Math.floor(values.length * 0.75)];
      const iqr = q3 - q1;

      bounds[field] = {
        lower: q1 - 1.5 * iqr,
        upper: q3 + 1.5 * iqr,
      };
    });

    // Filter out records with outliers
    return data.filter((record) => {
      return numericFields.every((field) => {
        const value = record[field];
        if (typeof value !== 'number') return true;
        const { lower, upper } = bounds[field];
        return value >= lower && value <= upper;
      });
    });
  }

  // Normalize numeric fields
  normalizeNumericFields(data: any[]): any[] {
    const numericFields = this.getNumericFields(data);
    const result = data.map((r) => ({ ...r }));

    numericFields.forEach((field) => {
      const values = data
        .map((r) => r[field])
        .filter((v) => typeof v === 'number');

      if (values.length === 0) return;

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      if (range === 0) return;

      result.forEach((record) => {
        if (typeof record[field] === 'number') {
          record[field] = (record[field] - min) / range;
        }
      });
    });

    return result;
  }

  // Standardize numeric fields (z-score normalization)
  standardizeNumericFields(data: any[]): any[] {
    const numericFields = this.getNumericFields(data);
    const result = data.map((r) => ({ ...r }));

    numericFields.forEach((field) => {
      const values = data
        .map((r) => r[field])
        .filter((v) => typeof v === 'number');

      if (values.length === 0) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev === 0) return;

      result.forEach((record) => {
        if (typeof record[field] === 'number') {
          record[field] = (record[field] - mean) / stdDev;
        }
      });
    });

    return result;
  }

  // Data Quality Assessment
  assessDataQuality(data: any[]): DataQualityReport {
    if (!data || data.length === 0) {
      return {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        missingValues: {},
        duplicateRecords: 0,
        outliers: {},
        dataTypes: {},
        qualityScore: 0,
      };
    }

    const fields = Object.keys(data[0]);
    const totalRecords = data.length;

    // Count missing values
    const missingValues: Record<string, number> = {};
    fields.forEach((field) => {
      const missing = data.filter(
        (r) => r[field] == null || r[field] === '',
      ).length;
      if (missing > 0) {
        missingValues[field] = missing;
      }
    });

    // Count duplicates
    const uniqueRecords = new Set(data.map((r) => JSON.stringify(r)));
    const duplicateRecords = totalRecords - uniqueRecords.size;

    // Detect outliers
    const outliers: Record<string, number[]> = {};
    const numericFields = this.getNumericFields(data);
    numericFields.forEach((field) => {
      const values = data
        .map((r, i) => ({ value: r[field], index: i }))
        .filter((v) => typeof v.value === 'number');

      if (values.length === 0) return;

      const sorted = values
        .map((v) => v.value)
        .sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;

      const outlierIndices = values
        .filter((v) => v.value < lower || v.value > upper)
        .map((v) => v.index);

      if (outlierIndices.length > 0) {
        outliers[field] = outlierIndices;
      }
    });

    // Determine data types
    const dataTypes: Record<string, string> = {};
    fields.forEach((field) => {
      const sampleValue = data.find((r) => r[field] != null)?.[field];
      dataTypes[field] = typeof sampleValue;
    });

    // Calculate quality score
    const missingRatio =
      Object.values(missingValues).reduce((a, b) => a + b, 0) /
      (totalRecords * fields.length);
    const duplicateRatio = duplicateRecords / totalRecords;
    const outlierRatio =
      Object.values(outliers).reduce((a, b) => a + b.length, 0) /
      totalRecords;

    const qualityScore = Math.max(
      0,
      100 - (missingRatio * 40 + duplicateRatio * 30 + outlierRatio * 30),
    );

    const validRecords = data.filter((record) =>
      fields.every((field) => record[field] != null && record[field] !== ''),
    ).length;

    return {
      totalRecords,
      validRecords,
      invalidRecords: totalRecords - validRecords,
      missingValues,
      duplicateRecords,
      outliers,
      dataTypes,
      qualityScore: Math.round(qualityScore * 100) / 100,
    };
  }

  // Feature Engineering
  createDerivedFeatures(
    data: any[],
    transformations: Array<{
      name: string;
      formula: (record: any) => any;
    }>,
  ): any[] {
    return data.map((record) => {
      const derived = { ...record };
      transformations.forEach((transform) => {
        try {
          derived[transform.name] = transform.formula(record);
        } catch (error) {
          this.logger.warn(
            `Failed to apply transformation ${transform.name}: ${error.message}`,
          );
          derived[transform.name] = null;
        }
      });
      return derived;
    });
  }

  // Binning/Discretization
  binNumericField(
    data: any[],
    field: string,
    bins: number | number[],
  ): any[] {
    const values = data
      .map((r) => r[field])
      .filter((v) => typeof v === 'number')
      .sort((a, b) => a - b);

    if (values.length === 0) return data;

    let edges: number[];
    if (typeof bins === 'number') {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const step = (max - min) / bins;
      edges = Array.from({ length: bins + 1 }, (_, i) => min + i * step);
    } else {
      edges = bins;
    }

    return data.map((record) => {
      const value = record[field];
      if (typeof value !== 'number') return record;

      let bin = 0;
      for (let i = 0; i < edges.length - 1; i++) {
        if (value >= edges[i] && value < edges[i + 1]) {
          bin = i;
          break;
        }
      }
      if (value >= edges[edges.length - 1]) {
        bin = edges.length - 2;
      }

      return {
        ...record,
        [`${field}_bin`]: bin,
        [`${field}_range`]: `${edges[bin].toFixed(2)}-${edges[bin + 1].toFixed(2)}`,
      };
    });
  }

  // One-Hot Encoding
  oneHotEncode(data: any[], categoricalFields: string[]): any[] {
    const uniqueValues: Record<string, Set<any>> = {};

    // Collect unique values for each categorical field
    categoricalFields.forEach((field) => {
      uniqueValues[field] = new Set(data.map((r) => r[field]));
    });

    // Create one-hot encoded features
    return data.map((record) => {
      const encoded = { ...record };

      categoricalFields.forEach((field) => {
        const value = record[field];
        uniqueValues[field].forEach((uniqueVal) => {
          encoded[`${field}_${uniqueVal}`] = value === uniqueVal ? 1 : 0;
        });
      });

      return encoded;
    });
  }

  // Helper methods
  private getNumericFields(data: any[]): string[] {
    if (!data || data.length === 0) return [];

    const fields = Object.keys(data[0]);
    return fields.filter((field) => {
      const sample = data.find((r) => r[field] != null)?.[field];
      return typeof sample === 'number';
    });
  }
}
