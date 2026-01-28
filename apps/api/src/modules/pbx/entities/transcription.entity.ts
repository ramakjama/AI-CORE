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
import { TranscriptionStatus } from '../interfaces/transcription.interface';
import { Call } from './call.entity';

@Entity('pbx_transcriptions')
@Index(['callId'], { unique: true })
@Index(['status'])
export class Transcription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  callId: string;

  @ManyToOne(() => Call)
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column({ length: 10, default: 'es' })
  language: string;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'jsonb' })
  segments: Array<{
    id: number;
    start: number;
    end: number;
    text: string;
    speaker?: string;
    confidence?: number;
  }>;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'int' })
  wordCount: number;

  @Column({
    type: 'enum',
    enum: TranscriptionStatus,
    default: TranscriptionStatus.PENDING,
  })
  status: TranscriptionStatus;

  @Column({ default: 'whisper-1' })
  model: string;

  @Column({ type: 'int', nullable: true })
  processingTime: number;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
