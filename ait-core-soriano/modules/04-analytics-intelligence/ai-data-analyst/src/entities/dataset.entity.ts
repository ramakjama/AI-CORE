import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum DatasetType {
  CSV = 'csv',
  JSON = 'json',
  DATABASE = 'database',
  API = 'api',
  STREAM = 'stream',
}

export enum DataQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Entity('datasets')
@Index(['type', 'isActive'])
@Index(['createdAt'])
export class DataSet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DatasetType,
    default: DatasetType.DATABASE,
  })
  type: DatasetType;

  @Column({ type: 'text', nullable: true })
  source: string;

  @Column({ type: 'jsonb', nullable: true })
  schema: {
    fields: Array<{
      name: string;
      type: string;
      nullable: boolean;
      description?: string;
    }>;
    primaryKey?: string[];
    indexes?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  statistics: {
    rowCount: number;
    columnCount: number;
    nullPercentage: number;
    duplicatePercentage: number;
    dataQuality: DataQuality;
    lastAnalyzed: Date;
  };

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    size?: number;
    format?: string;
    encoding?: string;
    delimiter?: string;
    tags?: string[];
  };

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
