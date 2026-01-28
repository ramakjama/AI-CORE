import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  LOGISTIC_REGRESSION = 'logistic_regression',
  DECISION_TREE = 'decision_tree',
  RANDOM_FOREST = 'random_forest',
  NEURAL_NETWORK = 'neural_network',
  CLUSTERING = 'clustering',
  TIME_SERIES = 'time_series',
  ANOMALY_DETECTION = 'anomaly_detection',
}

export enum ModelStatus {
  TRAINING = 'training',
  TRAINED = 'trained',
  DEPLOYED = 'deployed',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

@Entity('ml_models')
@Index(['type', 'status'])
@Index(['createdAt'])
export class MLModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ModelType,
    default: ModelType.LINEAR_REGRESSION,
  })
  type: ModelType;

  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.TRAINING,
  })
  status: ModelStatus;

  @Column({ type: 'varchar', length: 255 })
  version: string;

  @Column({ type: 'jsonb', nullable: true })
  hyperparameters: {
    learningRate?: number;
    epochs?: number;
    batchSize?: number;
    layers?: any[];
    optimizer?: string;
    lossFunction?: string;
    [key: string]: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  performance: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    rmse?: number;
    mae?: number;
    r2Score?: number;
    confusionMatrix?: number[][];
    rocAuc?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  features: {
    input: string[];
    output: string[];
    featureImportance?: Record<string, number>;
  };

  @Column({ type: 'text', nullable: true })
  modelPath: string;

  @Column({ type: 'jsonb', nullable: true })
  trainingMetadata: {
    datasetId?: string;
    trainingSamples?: number;
    validationSamples?: number;
    testSamples?: number;
    trainingTime?: number;
    lastTrainedAt?: Date;
  };

  @Column({ type: 'boolean', default: false })
  isDeployed: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  deploymentEndpoint: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
