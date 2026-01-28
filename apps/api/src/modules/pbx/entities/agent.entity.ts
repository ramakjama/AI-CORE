import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { AgentStatus } from '../interfaces/agent.interface';

@Entity('pbx_agents')
@Index(['userId'], { unique: true })
@Index(['extension'], { unique: true })
@Index(['status'])
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ unique: true, length: 10 })
  extension: string;

  @Column({ unique: true, length: 50 })
  sipUser: string;

  @Column({
    type: 'enum',
    enum: AgentStatus,
    default: AgentStatus.OFFLINE,
  })
  status: AgentStatus;

  @Column({ type: 'jsonb', default: [] })
  skills: Array<{ skill: string; level: number }>;

  @Column({ type: 'simple-array', default: '' })
  languages: string[];

  @Column({ type: 'int', default: 1 })
  maxConcurrentCalls: number;

  @Column({ type: 'int', default: 0 })
  currentCalls: number;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'boolean', default: false })
  isOnline: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastStatusChange: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastCallTime: Date;

  @Column({ type: 'int', default: 0 })
  totalCallsToday: number;

  @Column({ type: 'int', default: 0 })
  totalCallsHandled: number;

  @Column({ type: 'float', default: 0 })
  averageHandleTime: number;

  @Column({ type: 'float', default: 0 })
  customerSatisfactionScore: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
