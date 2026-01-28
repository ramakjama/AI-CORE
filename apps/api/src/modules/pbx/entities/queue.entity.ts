import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { QueueStrategy } from '../interfaces/queue.interface';

@Entity('pbx_queues')
@Index(['name'], { unique: true })
@Index(['extension'], { unique: true })
@Index(['active'])
export class Queue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 10 })
  extension: string;

  @Column({
    type: 'enum',
    enum: QueueStrategy,
    default: QueueStrategy.RING_ALL,
  })
  strategy: QueueStrategy;

  @Column({ type: 'int', default: 300 })
  maxWaitTime: number;

  @Column({ type: 'int', default: 50 })
  maxCallers: number;

  @Column({ type: 'int', default: 60 })
  announceFrequency: number;

  @Column({ type: 'boolean', default: true })
  announceHoldTime: boolean;

  @Column({ default: 'default' })
  musicOnHold: string;

  @Column({ type: 'int', default: 1 })
  priority: number;

  @Column({ type: 'simple-array', default: '' })
  requiredSkills: string[];

  @Column({ type: 'int', default: 80 })
  serviceLevel: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'int', default: 0 })
  currentCalls: number;

  @Column({ type: 'int', default: 0 })
  waitingCalls: number;

  @Column({ type: 'int', default: 0 })
  availableAgents: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
