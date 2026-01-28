import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Session } from './session.entity';
import { RefreshToken } from './refresh-token.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  OAUTH2 = 'oauth2',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  @Exclude()
  password: string;

  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
    name: 'auth_provider',
  })
  authProvider: AuthProvider;

  @Column({ name: 'provider_id', nullable: true })
  providerId: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'mfa_enabled', default: false })
  mfaEnabled: boolean;

  @Column({ name: 'mfa_secret', nullable: true })
  @Exclude()
  mfaSecret: string;

  @Column({ name: 'backup_codes', type: 'text', array: true, nullable: true })
  @Exclude()
  backupCodes: string[];

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'locked_until', type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp: string;

  @Column({ name: 'password_changed_at', type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'simple-array', nullable: true })
  permissions: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  // Virtual properties
  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email;
  }

  get isLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE && !this.isLocked;
  }
}
