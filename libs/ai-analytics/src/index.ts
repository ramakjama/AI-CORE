// AI-Analytics Module - Main Entry Point
// ML/DL, Feature Store, Segmentation, Monte Carlo Simulations, Actuarial Models

export * from './types';

// Services
export { featureStoreService, FeatureStoreService } from './services/feature-store.service';
export type { FeatureStatistics, FeatureCorrelation } from './services/feature-store.service';

export { predictionService, PredictionService } from './services/prediction.service';
export type { PredictionRequest, PredictionResponse, BatchPredictionRequest } from './services/prediction.service';

export { segmentationService, SegmentationService } from './services/segmentation.service';
export type { RFMScores, SegmentAssignment } from './services/segmentation.service';

export { simulationService, SimulationService } from './services/simulation.service';
export type { Distribution, SimulationInput, MonteCarloConfig } from './services/simulation.service';

// Re-export key types
export type {
  Feature,
  FeatureGroup,
  MLModel,
  ModelPrediction,
  Segment,
  SegmentationModel,
  Simulation,
  SimulationResult,
  ActuarialModel,
  Experiment,
  ModelMonitoring,
  ModelType,
  ModelPurpose,
  ModelStatus,
  SegmentationType,
  MetricType,
} from './types';
