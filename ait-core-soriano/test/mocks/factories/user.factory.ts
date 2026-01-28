import { User, UserStatus, UserRole, AuthProvider } from '@ait-core/modules/ait-authenticator';
import { randomEmail, randomString, randomUUID } from '../../utils/test-helpers';

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  authProvider?: AuthProvider;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
}

export class UserFactory {
  static create(options: UserFactoryOptions = {}): User {
    const user = new User();

    user.id = options.id || randomUUID();
    user.email = options.email || randomEmail();
    user.password = options.password || 'hashed-password-' + randomString();
    user.firstName = options.firstName || 'Test';
    user.lastName = options.lastName || 'User';
    user.role = options.role || UserRole.USER;
    user.status = options.status || UserStatus.ACTIVE;
    user.authProvider = options.authProvider || AuthProvider.LOCAL;
    user.emailVerified = options.emailVerified !== undefined ? options.emailVerified : true;
    user.mfaEnabled = options.mfaEnabled !== undefined ? options.mfaEnabled : false;
    user.failedLoginAttempts = 0;
    user.createdAt = new Date();
    user.updatedAt = new Date();

    return user;
  }

  static createMany(count: number, options: UserFactoryOptions = {}): User[] {
    return Array.from({ length: count }, () => this.create(options));
  }

  static createAdmin(options: UserFactoryOptions = {}): User {
    return this.create({ ...options, role: UserRole.ADMIN });
  }

  static createSuperAdmin(options: UserFactoryOptions = {}): User {
    return this.create({ ...options, role: UserRole.SUPER_ADMIN });
  }

  static createUnverified(options: UserFactoryOptions = {}): User {
    return this.create({ ...options, emailVerified: false, status: UserStatus.PENDING });
  }

  static createInactive(options: UserFactoryOptions = {}): User {
    return this.create({ ...options, status: UserStatus.INACTIVE });
  }

  static createWithMfa(options: UserFactoryOptions = {}): User {
    return this.create({
      ...options,
      mfaEnabled: true,
      mfaSecret: 'test-mfa-secret',
    });
  }
}
