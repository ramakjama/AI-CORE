import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AnalysisType {
  DESCRIPTIVE = 'descriptive',
  DIAGNOSTIC = 'diagnostic',
  PREDICTIVE = 'predictive',
  PRESCRIPTIVE = 'prescriptive',
  EXPLORATORY = 'exploratory',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('analysis_reports')
@Index(['type', 'status'])
@Index(['createdAt'])
export class AnalysisReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AnalysisType,
    default: AnalysisType.DESCRIPTIVE,
  })
  type: AnalysisType;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.PENDING,
  })
  status: AnalysisStatus;

  @Column({ type: 'jsonb', nullable: true })
  parameters: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  results: {
    summary: Record<string, any>;
    statistics: Record<string, any>;
    insights: string[];
    recommendations: string[];
    visualizations: any[];
    accuracy?: number;
    confidence?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    datasetId?: string;
    modelId?: string;
    executionTime?: number;
    dataPoints?: number;
    features?: string[];
  };

  @Column({ type: 'varchar', length: 255, nullable: true })
  datasetId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  modelId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userId: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
