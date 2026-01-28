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
import { SentimentScore, EmotionType } from '../interfaces/sentiment.interface';
import { Call } from './call.entity';
import { Transcription } from './transcription.entity';

@Entity('pbx_sentiment_analyses')
@Index(['callId'], { unique: true })
@Index(['escalationRequired'])
export class SentimentAnalysis {
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

  @Column({ type: 'float' })
  overallScore: number;

  @Column({
    type: 'enum',
    enum: SentimentScore,
  })
  overallSentiment: SentimentScore;

  @Column({
    type: 'simple-array',
    transformer: {
      to: (value: EmotionType[]) => value.join(','),
      from: (value: string) => (value ? value.split(',') : []),
    },
  })
  emotions: EmotionType[];

  @Column({ type: 'float' })
  frustrationLevel: number;

  @Column({ type: 'float' })
  urgencyLevel: number;

  @Column({ type: 'float' })
  satisfactionScore: number;

  @Column({ type: 'simple-array' })
  keyPhrases: string[];

  @Column({ type: 'boolean', default: false })
  escalationRequired: boolean;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  @Column({ type: 'jsonb' })
  timeline: Array<{
    timestamp: number;
    score: number;
    sentiment: string;
    text: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
