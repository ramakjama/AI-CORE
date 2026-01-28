import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ResolutionStatus } from '../interfaces/summary.interface';
import { Call } from './call.entity';
import { Transcription } from './transcription.entity';

@Entity('pbx_call_summaries')
@Index(['callId'], { unique: true })
@Index(['resolutionStatus'])
export class CallSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  callId: string;

  @ManyToOne(() => Call)
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ type: 'uuid' })
  transcriptionId: string;

  @ManyToOne(() => Transcription)
  @JoinColumn({ name: 'transcriptionId' })
  transcription: Transcription;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'simple-array' })
  topics: string[];

  @Column({ type: 'simple-array' })
  agreements: string[];

  @Column({ type: 'jsonb' })
  actionItems: Array<{
    id: string;
    description: string;
    assignedTo?: string;
    dueDate?: Date;
    priority: string;
    status: string;
    createdAt: Date;
  }>;

  @Column({ type: 'simple-array' })
  nextSteps: string[];

  @Column({ type: 'text' })
  resolution: string;

  @Column({
    type: 'enum',
    enum: ResolutionStatus,
  })
  resolutionStatus: ResolutionStatus;

  @Column()
  sentiment: string;

  @Column({ type: 'simple-array' })
  keyPoints: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
