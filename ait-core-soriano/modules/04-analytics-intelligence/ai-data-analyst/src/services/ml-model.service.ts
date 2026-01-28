import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as tf from '@tensorflow/tfjs-node';
import * as regression from 'regression';
import { MLModel, ModelType, ModelStatus } from '../entities/ml-model.entity';

@Injectable()
export class MLModelService {
  private readonly logger = new Logger(MLModelService.name);
  private models: Map<string, tf.LayersModel> = new Map();

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
  ) {}

  async trainLinearRegression(
    data: { x: number[]; y: number[] },
    modelId: string,
  ): Promise<any> {
    try {
      const pairs = data.x.map((x, i) => [x, data.y[i]]);
      const result = regression.linear(pairs);

      const predictions = data.x.map((x) => result.predict(x)[1]);
      const rmse = this.calculateRMSE(data.y, predictions);
      const r2 = this.calculateR2(data.y, predictions);

      return {
        equation: result.equation,
        r2: result.r2,
        rmse,
        performance: { rmse, r2Score: r2 },
        predictions,
      };
    } catch (error) {
      this.logger.error(`Training failed: ${error.message}`);
      throw error;
    }
  }

  async trainNeuralNetwork(
    data: { features: number[][]; labels: number[][] },
    config: {
      layers: Array<{ units: number; activation: string }>;
      epochs: number;
      learningRate: number;
      batchSize: number;
    },
    modelId: string,
  ): Promise<any> {
    try {
      const inputShape = data.features[0].length;
      const outputShape = data.labels[0].length;

      // Create model
      const model = tf.sequential();

      // Input layer
      model.add(
        tf.layers.dense({
          units: config.layers[0].units,
          activation: config.layers[0].activation as any,
          inputShape: [inputShape],
        }),
      );

      // Hidden layers
      for (let i = 1; i < config.layers.length; i++) {
        model.add(
          tf.layers.dense({
            units: config.layers[i].units,
            activation: config.layers[i].activation as any,
          }),
        );
      }

      // Output layer
      model.add(
        tf.layers.dense({
          units: outputShape,
          activation: 'linear',
        }),
      );

      // Compile model
      model.compile({
        optimizer: tf.train.adam(config.learningRate),
        loss: 'meanSquaredError',
        metrics: ['mae'],
      });

      // Prepare tensors
      const xs = tf.tensor2d(data.features);
      const ys = tf.tensor2d(data.labels);

      // Train model
      const history = await model.fit(xs, ys, {
        epochs: config.epochs,
        batchSize: config.batchSize,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            this.logger.log(
              `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`,
            );
          },
        },
      });

      // Store model
      this.models.set(modelId, model);

      // Clean up tensors
      xs.dispose();
      ys.dispose();

      return {
        history: history.history,
        performance: {
          finalLoss: history.history.loss[history.history.loss.length - 1],
          finalValLoss:
            history.history.val_loss[history.history.val_loss.length - 1],
        },
      };
    } catch (error) {
      this.logger.error(`Neural network training failed: ${error.message}`);
      throw error;
    }
  }

  async trainClusteringModel(
    data: number[][],
    numClusters: number,
  ): Promise<any> {
    try {
      // Simple K-means implementation
      const centers = this.initializeCenters(data, numClusters);
      const maxIterations = 100;
      let assignments: number[] = [];

      for (let iter = 0; iter < maxIterations; iter++) {
        // Assign points to nearest center
        assignments = data.map((point) =>
          this.findNearestCenter(point, centers),
        );

        // Update centers
        const newCenters = this.updateCenters(data, assignments, numClusters);

        // Check convergence
        if (this.centersEqual(centers, newCenters)) {
          break;
        }

        centers.splice(0, centers.length, ...newCenters);
      }

      return {
        centers,
        assignments,
        numClusters,
        inertia: this.calculateInertia(data, centers, assignments),
      };
    } catch (error) {
      this.logger.error(`Clustering training failed: ${error.message}`);
      throw error;
    }
  }

  async predict(modelId: string, input: number[][]): Promise<number[][]> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const inputTensor = tf.tensor2d(input);
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const result = await prediction.array();

    inputTensor.dispose();
    prediction.dispose();

    return result as number[][];
  }

  async evaluateModel(
    modelId: string,
    testData: { features: number[][]; labels: number[][] },
  ): Promise<any> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const xs = tf.tensor2d(testData.features);
    const ys = tf.tensor2d(testData.labels);

    const evaluation = model.evaluate(xs, ys) as tf.Scalar[];
    const loss = await evaluation[0].data();
    const mae = await evaluation[1].data();

    xs.dispose();
    ys.dispose();
    evaluation.forEach((tensor) => tensor.dispose());

    return {
      loss: loss[0],
      mae: mae[0],
    };
  }

  async saveModel(modelId: string, path: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    await model.save(`file://${path}`);
    this.logger.log(`Model ${modelId} saved to ${path}`);
  }

  async loadModel(modelId: string, path: string): Promise<void> {
    const model = await tf.loadLayersModel(`file://${path}/model.json`);
    this.models.set(modelId, model);
    this.logger.log(`Model ${modelId} loaded from ${path}`);
  }

  // Helper methods
  private calculateRMSE(actual: number[], predicted: number[]): number {
    const mse =
      actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) /
      actual.length;
    return Math.sqrt(mse);
  }

  private calculateR2(actual: number[], predicted: number[]): number {
    const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssTotal = actual.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0,
    );
    const ssRes = actual.reduce(
      (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
      0,
    );
    return 1 - ssRes / ssTotal;
  }

  private initializeCenters(data: number[][], k: number): number[][] {
    const centers: number[][] = [];
    const usedIndices = new Set<number>();

    while (centers.length < k) {
      const idx = Math.floor(Math.random() * data.length);
      if (!usedIndices.has(idx)) {
        centers.push([...data[idx]]);
        usedIndices.add(idx);
      }
    }

    return centers;
  }

  private findNearestCenter(point: number[], centers: number[][]): number {
    let minDist = Infinity;
    let nearest = 0;

    centers.forEach((center, i) => {
      const dist = this.euclideanDistance(point, center);
      if (dist < minDist) {
        minDist = dist;
        nearest = i;
      }
    });

    return nearest;
  }

  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0),
    );
  }

  private updateCenters(
    data: number[][],
    assignments: number[],
    k: number,
  ): number[][] {
    const centers: number[][] = Array(k)
      .fill(0)
      .map(() => Array(data[0].length).fill(0));
    const counts = Array(k).fill(0);

    data.forEach((point, i) => {
      const cluster = assignments[i];
      counts[cluster]++;
      point.forEach((val, j) => {
        centers[cluster][j] += val;
      });
    });

    return centers.map((center, i) =>
      center.map((val) => (counts[i] > 0 ? val / counts[i] : 0)),
    );
  }

  private centersEqual(a: number[][], b: number[][]): boolean {
    const epsilon = 1e-6;
    return a.every((centerA, i) =>
      centerA.every((val, j) => Math.abs(val - b[i][j]) < epsilon),
    );
  }

  private calculateInertia(
    data: number[][],
    centers: number[][],
    assignments: number[],
  ): number {
    return data.reduce((sum, point, i) => {
      const center = centers[assignments[i]];
      return sum + Math.pow(this.euclideanDistance(point, center), 2);
    }, 0);
  }
}
