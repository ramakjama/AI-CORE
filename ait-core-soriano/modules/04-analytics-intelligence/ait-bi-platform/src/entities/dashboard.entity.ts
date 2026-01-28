import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Widget } from './widget.entity';

export enum DashboardType {
  EXECUTIVE = 'executive',
  OPERATIONAL = 'operational',
  ANALYTICAL = 'analytical',
  STRATEGIC = 'strategic',
  CUSTOM = 'custom'
}

export enum DashboardVisibility {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
  ORGANIZATION = 'organization'
}

@Entity('bi_dashboards')
export class Dashboard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: DashboardType })
  type: DashboardType;

  @Column({ type: 'enum', enum: DashboardVisibility, default: DashboardVisibility.PRIVATE })
  visibility: DashboardVisibility;

  @Column()
  ownerId: string;

  @Column({ type: 'json', nullable: true })
  layout: any;

  @Column({ type: 'json', nullable: true })
  filters: any;

  @Column({ type: 'json', nullable: true })
  theme: any;

  @Column({ default: 0 })
  refreshInterval: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  permissions: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @OneToMany(() => Widget, widget => widget.dashboard)
  widgets: Widget[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastAccessedAt: Date;
}
