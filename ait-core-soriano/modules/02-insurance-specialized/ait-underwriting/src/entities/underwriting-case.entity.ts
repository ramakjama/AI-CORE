import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';

export enum UnderwritingStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  DECLINED = 'DECLINED',
  REFERRED = 'REFERRED',
  CONDITIONAL = 'CONDITIONAL',
  WITHDRAWN = 'WITHDRAWN'
}

export enum UnderwritingType {
  NEW_BUSINESS = 'NEW_BUSINESS',
  RENEWAL = 'RENEWAL',
  ENDORSEMENT = 'ENDORSEMENT',
  REINSTATEMENT = 'REINSTATEMENT'
}

export enum RiskLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
  UNACCEPTABLE = 'UNACCEPTABLE'
}

@Entity('underwriting_cases')
export class UnderwritingCase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  caseNumber: string;

  @Column({ type: 'enum', enum: UnderwritingType })
  type: UnderwritingType;

  @Column({ type: 'enum', enum: UnderwritingStatus, default: UnderwritingStatus.PENDING })
  status: UnderwritingStatus;

  @Column({ type: 'uuid' })
  applicationId: string;

  @Column({ type: 'uuid' })
  applicantId: string;

  @Column({ type: 'varchar', length: 100 })
  productType: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  requestedSumInsured: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  requestedPremium: number;

  @Column({ type: 'enum', enum: RiskLevel, nullable: true })
  riskLevel: RiskLevel;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  riskScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  fraudScore: number;

  @Column({ type: 'boolean', default: false })
  requiresMedicalExam: boolean;

  @Column({ type: 'boolean', default: false })
  requiresFinancialCheck: boolean;

  @Column({ type: 'boolean', default: false })
  isAutoUnderwritten: boolean;

  @Column({ type: 'uuid', nullable: true })
  underwriterId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  underwriterName: string;

  @Column({ type: 'jsonb', nullable: true })
  riskFactors: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  medicalInfo: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  financialInfo: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  aiRecommendations: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  underwriterNotes: string;

  @Column({ type: 'text', nullable: true })
  decisionReason: string;

  @Column({ type: 'jsonb', nullable: true })
  conditions: Array<{
    type: string;
    description: string;
    impact: string;
  }>;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  approvedSumInsured: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  approvedPremium: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  loadingPercentage: number;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  decidedAt: Date;

  @Column({ type: 'int', default: 0 })
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}
