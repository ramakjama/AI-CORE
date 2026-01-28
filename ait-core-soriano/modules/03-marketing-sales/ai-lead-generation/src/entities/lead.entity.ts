import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  company: string;

  @Column()
  jobTitle: string;

  @Column({ nullable: true })
  linkedInUrl: string;

  @Column({ nullable: true })
  companyWebsite: string;

  @Column()
  industry: string;

  @Column()
  companySize: string;

  @Column()
  location: string;

  @Column('jsonb', { nullable: true })
  enrichedData: any;

  @Column({ default: 0 })
  score: number;

  @Column({ nullable: true })
  qualification: string;

  @Column({ nullable: true })
  qualificationReason: string;

  @Column({ default: 'new' })
  status: string;

  @Column({ nullable: true })
  assignedTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
