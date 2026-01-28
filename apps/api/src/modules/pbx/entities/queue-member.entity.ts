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
import { Queue } from './queue.entity';
import { Agent } from './agent.entity';

@Entity('pbx_queue_members')
@Index(['queueId', 'agentId'], { unique: true })
@Index(['queueId'])
@Index(['agentId'])
export class QueueMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  queueId: string;

  @ManyToOne(() => Queue)
  @JoinColumn({ name: 'queueId' })
  queue: Queue;

  @Column({ type: 'uuid' })
  agentId: string;

  @ManyToOne(() => Agent)
  @JoinColumn({ name: 'agentId' })
  agent: Agent;

  @Column({ type: 'int', default: 0 })
  penalty: number;

  @Column({ type: 'boolean', default: false })
  paused: boolean;

  @Column({ type: 'text', nullable: true })
  pauseReason: string;

  @Column({ type: 'int', default: 0 })
  callsAnswered: number;

  @Column({ type: 'timestamp', nullable: true })
  lastCallTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
