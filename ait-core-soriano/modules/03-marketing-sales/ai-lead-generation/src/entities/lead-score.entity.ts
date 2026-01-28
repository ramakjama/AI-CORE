import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Lead } from './lead.entity';

@Entity('lead_scores')
export class LeadScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Lead)
  lead: Lead;

  @Column()
  score: number;

  @Column('jsonb')
  breakdown: any;

  @CreateDateColumn()
  createdAt: Date;
}
