// AI-Analytics Segmentation Service

import type { Segment, SegmentationModel, SegmentationType } from '../types';

export interface RFMScores {
  recency: number;  // 1-5
  frequency: number; // 1-5
  monetary: number;  // 1-5
  rfmScore: string;  // e.g., "543"
  segment: string;   // e.g., "Champions", "At Risk"
}

export interface SegmentAssignment {
  entityId: string;
  entityType: string;
  segmentId: string;
  segmentCode: string;
  probability: number;
  assignedAt: Date;
}

const RFM_SEGMENTS: Record<string, string> = {
  '555': 'CHAMPIONS',
  '554': 'CHAMPIONS',
  '544': 'LOYAL_CUSTOMERS',
  '545': 'LOYAL_CUSTOMERS',
  '454': 'LOYAL_CUSTOMERS',
  '455': 'LOYAL_CUSTOMERS',
  '445': 'LOYAL_CUSTOMERS',
  '355': 'POTENTIAL_LOYALISTS',
  '354': 'POTENTIAL_LOYALISTS',
  '345': 'POTENTIAL_LOYALISTS',
  '344': 'POTENTIAL_LOYALISTS',
  '335': 'POTENTIAL_LOYALISTS',
  '553': 'NEW_CUSTOMERS',
  '552': 'NEW_CUSTOMERS',
  '551': 'NEW_CUSTOMERS',
  '541': 'PROMISING',
  '542': 'PROMISING',
  '533': 'PROMISING',
  '532': 'PROMISING',
  '531': 'PROMISING',
  '443': 'NEED_ATTENTION',
  '434': 'NEED_ATTENTION',
  '343': 'NEED_ATTENTION',
  '334': 'NEED_ATTENTION',
  '244': 'ABOUT_TO_SLEEP',
  '243': 'ABOUT_TO_SLEEP',
  '234': 'ABOUT_TO_SLEEP',
  '233': 'ABOUT_TO_SLEEP',
  '155': 'CANT_LOSE_THEM',
  '154': 'CANT_LOSE_THEM',
  '145': 'CANT_LOSE_THEM',
  '144': 'CANT_LOSE_THEM',
  '133': 'AT_RISK',
  '134': 'AT_RISK',
  '143': 'AT_RISK',
  '124': 'AT_RISK',
  '123': 'HIBERNATING',
  '122': 'HIBERNATING',
  '113': 'HIBERNATING',
  '112': 'HIBERNATING',
  '111': 'LOST',
  '211': 'LOST',
  '121': 'LOST',
};

export class SegmentationService {
  private modelCache: Map<string, SegmentationModel> = new Map();

  async calculateRFM(
    partyId: string,
    transactions: Array<{ date: Date; amount: number }>
  ): Promise<RFMScores> {
    const now = new Date();
    const sortedByDate = [...transactions].sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );

    // Recency: Days since last transaction
    const lastTransaction = sortedByDate[0];
    const daysSinceLastTx = lastTransaction
      ? Math.floor((now.getTime() - lastTransaction.date.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Frequency: Number of transactions
    const frequency = transactions.length;

    // Monetary: Total amount
    const monetary = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate scores (1-5)
    const recencyScore = this.calculateScore(daysSinceLastTx, [30, 90, 180, 365], true);
    const frequencyScore = this.calculateScore(frequency, [1, 3, 5, 10], false);
    const monetaryScore = this.calculateScore(monetary, [500, 1500, 5000, 15000], false);

    const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;
    const segment = this.mapRFMToSegment(rfmScore);

    return {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      rfmScore,
      segment,
    };
  }

  private calculateScore(value: number, thresholds: number[], inverse: boolean): number {
    let score = 1;
    for (const threshold of thresholds) {
      if (inverse ? value <= threshold : value >= threshold) {
        score++;
      }
    }
    return Math.min(score, 5);
  }

  private mapRFMToSegment(rfmScore: string): string {
    if (RFM_SEGMENTS[rfmScore]) {
      return RFM_SEGMENTS[rfmScore];
    }

    // Fallback logic based on R score
    const r = parseInt(rfmScore[0] ?? '1', 10);
    const f = parseInt(rfmScore[1] ?? '1', 10);
    const m = parseInt(rfmScore[2] ?? '1', 10);

    if (r >= 4 && f >= 4 && m >= 4) return 'CHAMPIONS';
    if (r >= 4 && f >= 3) return 'LOYAL_CUSTOMERS';
    if (r >= 3 && f >= 2) return 'POTENTIAL_LOYALISTS';
    if (r >= 4 && f <= 2) return 'NEW_CUSTOMERS';
    if (r <= 2 && f >= 4) return 'CANT_LOSE_THEM';
    if (r <= 2 && f >= 2) return 'AT_RISK';
    if (r <= 2 && f <= 2) return 'LOST';
    return 'OTHERS';
  }

  async runKMeansClustering(
    data: Array<{ entityId: string; features: number[] }>,
    k: number,
    maxIterations: number = 100
  ): Promise<SegmentAssignment[]> {
    if (data.length === 0 || k <= 0) {
      return [];
    }

    const dimensions = data[0]?.features.length ?? 0;

    // Initialize centroids randomly
    let centroids = this.initializeCentroids(data.map(d => d.features), k);
    let assignments: number[] = new Array(data.length).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      const newAssignments = data.map(point =>
        this.findNearestCentroid(point.features, centroids)
      );

      // Check convergence
      if (this.arraysEqual(assignments, newAssignments)) {
        break;
      }
      assignments = newAssignments;

      // Update centroids
      centroids = this.updateCentroids(data.map(d => d.features), assignments, k, dimensions);
    }

    // Calculate distances for probability estimation
    return data.map((point, idx) => {
      const centroidIdx = assignments[idx] ?? 0;
      const distance = this.euclideanDistance(point.features, centroids[centroidIdx] ?? []);
      const maxDistance = Math.max(...centroids.map(c => this.euclideanDistance(point.features, c)));

      return {
        entityId: point.entityId,
        entityType: 'party',
        segmentId: `segment_${centroidIdx}`,
        segmentCode: `CLUSTER_${centroidIdx}`,
        probability: maxDistance > 0 ? 1 - (distance / maxDistance) : 1,
        assignedAt: new Date(),
      };
    });
  }

  private initializeCentroids(data: number[][], k: number): number[][] {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, k);
  }

  private findNearestCentroid(point: number[], centroids: number[][]): number {
    let minDist = Infinity;
    let nearestIdx = 0;

    centroids.forEach((centroid, idx) => {
      const dist = this.euclideanDistance(point, centroid);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });

    return nearestIdx;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, idx) => sum + Math.pow(val - (b[idx] ?? 0), 2), 0)
    );
  }

  private updateCentroids(
    data: number[][],
    assignments: number[],
    k: number,
    dimensions: number
  ): number[][] {
    const centroids: number[][] = [];

    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, idx) => assignments[idx] === i);

      if (clusterPoints.length === 0) {
        centroids.push(new Array(dimensions).fill(0));
        continue;
      }

      const newCentroid = new Array(dimensions).fill(0);
      for (const point of clusterPoints) {
        point.forEach((val, dim) => {
          newCentroid[dim] += val;
        });
      }
      centroids.push(newCentroid.map(sum => sum / clusterPoints.length));
    }

    return centroids;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }

  async getSegmentRecommendations(segmentCode: string): Promise<string[]> {
    const recommendations: Record<string, string[]> = {
      'CHAMPIONS': [
        'Exclusive loyalty rewards',
        'Early access to new products',
        'Personalized thank you messages',
        'Referral program incentives',
      ],
      'LOYAL_CUSTOMERS': [
        'Upsell premium products',
        'Cross-sell complementary coverage',
        'Loyalty discounts on renewals',
      ],
      'POTENTIAL_LOYALISTS': [
        'Engagement campaigns',
        'Product education content',
        'Bundle offers',
      ],
      'AT_RISK': [
        'Win-back campaigns',
        'Retention offers',
        'Customer satisfaction surveys',
        'Proactive outreach',
      ],
      'LOST': [
        'Reactivation campaigns',
        'Special comeback offers',
        'Feedback collection',
      ],
    };

    return recommendations[segmentCode] ?? ['Standard engagement'];
  }
}

export const segmentationService = new SegmentationService();
