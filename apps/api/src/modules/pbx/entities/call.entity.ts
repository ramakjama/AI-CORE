import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CallStatus, CallDirection } from '../interfaces/call.interface';

@Entity('pbx_calls')
@Index(['clientId', 'createdAt'])
@Index(['agentId', 'createdAt'])
@Index(['status'])
@Index(['uniqueId'], { unique: true })
export class Call {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  uniqueId: string;

  @Column()
  callId: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({
    type: 'enum',
    enum: CallDirection,
    default: CallDirection.INBOUND,
  })
  direction: CallDirection;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.RINGING,
  })
  status: CallStatus;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  answerTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'int', nullable: true })
  duration: number;

  @Column({ type: 'int', nullable: true, default: 0 })
  waitTime: number;

  @Column({ type: 'uuid', nullable: true })
  agentId: string;

  @Column({ type: 'uuid', nullable: true })
  clientId: string;

  @Column({ type: 'uuid', nullable: true })
  queueId: string;

  @Column({ nullable: true })
  recordingUrl: string;

  @Column({ type: 'uuid', nullable: true })
  transcriptionId: string;

  @Column({ type: 'uuid', nullable: true })
  summaryId: string;

  @Column({ type: 'uuid', nullable: true })
  sentimentAnalysisId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
