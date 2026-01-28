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
import { RecordingStatus } from '../interfaces/recording.interface';
import { Call } from './call.entity';

@Entity('pbx_recordings')
@Index(['callId'])
@Index(['status'])
@Index(['expiresAt'])
export class Recording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  callId: string;

  @ManyToOne(() => Call)
  @JoinColumn({ name: 'callId' })
  call: Call;

  @Column()
  filename: string;

  @Column()
  filepath: string;

  @Column({ type: 'int' })
  duration: number;

  @Column({ type: 'bigint' })
  size: number;

  @Column({ default: 'wav' })
  format: string;

  @Column({
    type: 'enum',
    enum: RecordingStatus,
    default: RecordingStatus.RECORDING,
  })
  status: RecordingStatus;

  @Column({ nullable: true, select: false })
  encryptionKey: string;

  @Column({ nullable: true })
  encryptionIV: string;

  @Column({ nullable: true })
  storageUrl: string;

  @Column({ nullable: true })
  storageProvider: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  uploadedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
