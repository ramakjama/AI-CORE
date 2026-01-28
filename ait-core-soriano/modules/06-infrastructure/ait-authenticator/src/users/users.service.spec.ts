import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User, UserStatus, AuthProvider } from '../entities/user.entity';
import { UserFactory } from '../../../../../test/mocks/factories/user.factory';
import { createMockRepository } from '../../../../../test/utils/test-helpers';
import { MockConfigService } from '../../../../../test/utils/nestjs-test-helpers';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;
  let mockConfigService: MockConfigService;

  beforeEach(async () => {
    mockRepository = createMockRepository<User>();
    mockConfigService = new MockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const mockUser = UserFactory.create({ ...registerDto, password: hashedPassword });
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
        authProvider: AuthProvider.LOCAL,
      });
      expect(result.email).toBe(registerDto.email);
      expect(result.authProvider).toBe(AuthProvider.LOCAL);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockRepository.findOne.mockResolvedValue(UserFactory.create());

      await expect(service.create(registerDto)).rejects.toThrow(ConflictException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active users', async () => {
      const users = UserFactory.createMany(3);
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: null },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const user = UserFactory.create();
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(user.id);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id, deletedAt: null },
      });
    });

    it('should return null if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user by email', async () => {
      const user = UserFactory.create({ email: 'test@example.com' });
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null },
      });
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const user = UserFactory.create();
      const updateData = { firstName: 'Updated' };

      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.save.mockResolvedValue({ ...user, ...updateData });

      const result = await service.update(user.id, updateData);

      expect(result.firstName).toBe(updateData.firstName);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updatePassword', () => {
    it('should update user password with hash', async () => {
      const userId = 'user-id';
      const newPassword = 'newPassword123';
      const hashedPassword = 'hashed-new-password';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updatePassword(userId, newPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        password: hashedPassword,
        passwordChangedAt: expect.any(Date),
      });
    });
  });

  describe('verifyEmail', () => {
    it('should mark email as verified and activate user', async () => {
      const userId = 'user-id';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.verifyEmail(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
    });
  });

  describe('incrementFailedLoginAttempts', () => {
    it('should increment failed login attempts', async () => {
      const user = UserFactory.create({ failedLoginAttempts: 2 });
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.incrementFailedLoginAttempts(user.id);

      expect(mockRepository.update).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 3,
      });
    });

    it('should lock account after 5 failed attempts', async () => {
      const user = UserFactory.create({ failedLoginAttempts: 4 });
      mockRepository.findOne.mockResolvedValue(user);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.incrementFailedLoginAttempts(user.id);

      expect(mockRepository.update).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 5,
        lockedUntil: expect.any(Date),
      });
    });
  });

  describe('resetFailedLoginAttempts', () => {
    it('should reset failed login attempts and unlock account', async () => {
      const userId = 'user-id';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.resetFailedLoginAttempts(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp and IP', async () => {
      const userId = 'user-id';
      const ipAddress = '192.168.1.1';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateLastLogin(userId, ipAddress);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        lastLoginAt: expect.any(Date),
        lastLoginIp: ipAddress,
      });
    });
  });

  describe('enableMfa', () => {
    it('should enable MFA with secret and backup codes', async () => {
      const userId = 'user-id';
      const secret = 'mfa-secret';
      const backupCodes = ['code1', 'code2', 'code3'];
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.enableMfa(userId, secret, backupCodes);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        mfaEnabled: true,
        mfaSecret: secret,
        backupCodes,
      });
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA and clear secret', async () => {
      const userId = 'user-id';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.disableMfa(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        mfaEnabled: false,
        mfaSecret: null,
        backupCodes: null,
      });
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      const userId = 'user-id';
      mockRepository.update.mockResolvedValue({ affected: 1 });

      await service.softDelete(userId);

      expect(mockRepository.update).toHaveBeenCalledWith(userId, {
        deletedAt: expect.any(Date),
        status: UserStatus.INACTIVE,
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword('password', 'hashed-password');

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hashed-password');
    });

    it('should return false for invalid password', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword('wrong-password', 'hashed-password');

      expect(result).toBe(false);
    });
  });
});
