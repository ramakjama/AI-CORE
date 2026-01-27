// AI-Analytics Types - Based on sm_analytics Prisma Schema

export type ModelType =
  | 'DESCRIPTIVE_STATS' | 'DISTRIBUTION_ANALYSIS' | 'CORRELATION_ANALYSIS'
  | 'HYPOTHESIS_TEST' | 'CONFIDENCE_INTERVAL' | 'ANOVA' | 'CHI_SQUARE'
  | 'LINEAR_REGRESSION' | 'LOGISTIC_REGRESSION' | 'POISSON_REGRESSION'
  | 'TIME_SERIES' | 'ARIMA' | 'GARCH' | 'VAR_MODEL' | 'PANEL_DATA'
  | 'SURVIVAL_ANALYSIS' | 'COX_REGRESSION' | 'GLM_TWEEDIE' | 'CHAIN_LADDER'
  | 'RANDOM_FOREST' | 'GRADIENT_BOOSTING' | 'XGBOOST' | 'LIGHTGBM' | 'CATBOOST'
  | 'NEURAL_NETWORK_MLP' | 'CNN' | 'RNN' | 'LSTM' | 'TRANSFORMER' | 'AUTOENCODER'
  | 'KMEANS' | 'DBSCAN' | 'HIERARCHICAL' | 'GAUSSIAN_MIXTURE'
  | 'PCA' | 'TSNE' | 'UMAP'
  | 'MONTE_CARLO' | 'BOOTSTRAP';

export type ModelPurpose =
  | 'CHURN_PREDICTION' | 'CROSS_SELL_PROPENSITY' | 'UPSELL_PROPENSITY'
  | 'LTV_PREDICTION' | 'CLAIM_FREQUENCY' | 'CLAIM_SEVERITY' | 'FRAUD_DETECTION'
  | 'PRICING_OPTIMIZATION' | 'RISK_SCORING' | 'CUSTOMER_SEGMENTATION'
  | 'RETENTION_PREDICTION' | 'PAYMENT_DEFAULT' | 'RENEWAL_PROBABILITY';

export type ModelStatus = 'DRAFT' | 'TRAINING' | 'VALIDATING' | 'READY' | 'DEPLOYED' | 'DEPRECATED';

export type SegmentationType = 'RFM' | 'VALUE_BASED' | 'BEHAVIORAL' | 'DEMOGRAPHIC' | 'LIFECYCLE' | 'RISK_BASED';

export type MetricType = 'ACCURACY' | 'PRECISION' | 'RECALL' | 'F1_SCORE' | 'AUC_ROC' | 'RMSE' | 'MAE' | 'R_SQUARED';

export interface Feature {
  id: string;
  code: string;
  name: string;
  featureType: 'NUMERICAL' | 'CATEGORICAL' | 'BINARY' | 'DATETIME' | 'TEXT' | 'EMBEDDING';
  dataType: string;
  nullRate?: number;
  meanValue?: number;
  stdValue?: number;
  categories?: string[];
  globalImportance?: number;
}

export interface FeatureGroup {
  id: string;
  code: string;
  name: string;
  sourceDatabase: string;
  features: Feature[];
  lastRefreshedAt?: Date;
}

export interface MLModel {
  id: string;
  code: string;
  name: string;
  modelType: ModelType;
  purpose: ModelPurpose;
  status: ModelStatus;
  version: number;
  hyperparameters?: Record<string, unknown>;
  architecture?: Record<string, unknown>;
  targetVariable: string;
  trainedAt?: Date;
  deployedAt?: Date;
  totalPredictions: number;
}

export interface ModelPrediction {
  id: string;
  modelId: string;
  entityType: string;
  entityId: string;
  prediction: number;
  predictionLabel?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  shapValues?: Record<string, number>;
  topFactors?: Array<{ feature: string; impact: number; direction: '+' | '-' }>;
  predictedAt: Date;
}

export interface Segment {
  id: string;
  code: string;
  name: string;
  size: number;
  percentage?: number;
  avgLtv?: number;
  avgPremium?: number;
  churnRate?: number;
  recommendedActions?: string[];
}

export interface SegmentationModel {
  id: string;
  code: string;
  name: string;
  segmentationType: SegmentationType;
  algorithm: string;
  segments: Segment[];
  entityCount?: number;
  lastRunAt?: Date;
}

export interface Simulation {
  id: string;
  code: string;
  name: string;
  simulationType: 'MONTE_CARLO' | 'BOOTSTRAP' | 'SCENARIO_ANALYSIS' | 'STRESS_TEST';
  iterations: number;
  inputVariables: Array<{ name: string; distribution: string; params: Record<string, number> }>;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
}

export interface SimulationResult {
  id: string;
  simulationId: string;
  outputVariable: string;
  mean: number;
  std: number;
  median: number;
  min: number;
  max: number;
  var95?: number;
  var99?: number;
  cvar95?: number;
}

export interface ActuarialModel {
  id: string;
  code: string;
  name: string;
  modelType: 'CHAIN_LADDER' | 'BORNHUETTER_FERGUSON' | 'CAPE_COD' | 'GLM';
  lineOfBusiness: string;
  ultimateLosses?: number;
  ibnrReserve?: number;
  valuationDate: Date;
}

export interface Experiment {
  id: string;
  code: string;
  name: string;
  hypothesis?: string;
  experimentType: 'AB_TEST' | 'MULTIVARIATE' | 'BANDIT';
  variants: Array<{ name: string; allocation: number }>;
  primaryMetric: string;
  status: 'DRAFT' | 'RUNNING' | 'CONCLUDED';
  winningVariant?: string;
  pValue?: number;
}

export interface ModelMonitoring {
  id: string;
  modelId: string;
  periodStart: Date;
  periodEnd: Date;
  dataDrift?: Record<string, { driftScore: number; pValue: number }>;
  performanceMetrics?: Record<string, number>;
  predictionCount: number;
  errorCount: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}
