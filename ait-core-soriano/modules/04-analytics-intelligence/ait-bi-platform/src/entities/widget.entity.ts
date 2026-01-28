import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Dashboard } from './dashboard.entity';

export enum WidgetType {
  CHART = 'chart',
  TABLE = 'table',
  METRIC = 'metric',
  MAP = 'map',
  GAUGE = 'gauge',
  FUNNEL = 'funnel',
  PIVOT = 'pivot',
  TEXT = 'text',
  IMAGE = 'image'
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
  DONUT = 'donut',
  RADAR = 'radar',
  HEATMAP = 'heatmap',
  TREEMAP = 'treemap',
  SANKEY = 'sankey'
}

@Entity('bi_widgets')
export class Widget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'enum', enum: WidgetType })
  type: WidgetType;

  @Column({ type: 'enum', enum: ChartType, nullable: true })
  chartType: ChartType;

  @Column()
  dashboardId: string;

  @Column({ type: 'json' })
  configuration: any;

  @Column({ type: 'json' })
  dataQuery: any;

  @Column({ type: 'json', nullable: true })
  dataSource: any;

  @Column({ type: 'json', nullable: true })
  styling: any;

  @Column({ type: 'json' })
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @Column({ default: 0 })
  refreshInterval: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'json', nullable: true })
  filters: any;

  @Column({ type: 'json', nullable: true })
  interactions: any;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @ManyToOne(() => Dashboard, dashboard => dashboard.widgets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dashboardId' })
  dashboard: Dashboard;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
