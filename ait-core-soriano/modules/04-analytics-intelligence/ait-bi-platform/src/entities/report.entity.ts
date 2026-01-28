import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ReportType {
  EXECUTIVE_SUMMARY = 'executive_summary',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  SALES = 'sales',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json',
  HTML = 'html'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SCHEDULED = 'scheduled'
}

@Entity('bi_reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportFormat })
  format: ReportFormat;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column()
  userId: string;

  @Column({ type: 'json' })
  configuration: any;

  @Column({ type: 'json', nullable: true })
  parameters: any;

  @Column({ type: 'json', nullable: true })
  filters: any;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ type: 'json', nullable: true })
  schedule: any;

  @Column({ type: 'simple-array', nullable: true })
  recipients: string[];

  @Column({ nullable: true })
  errorMessage: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  generatedAt: Date;

  @Column({ nullable: true })
  expiresAt: Date;
}
