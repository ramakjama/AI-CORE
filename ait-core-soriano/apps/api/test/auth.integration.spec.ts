import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../../modules/06-infrastructure/ait-authenticator/src/entities/user.entity';
import { UserFactory } from '../../../test/mocks/factories/user.factory';
import { createMockRepository } from '../../../test/utils/test-helpers';
import { MockConfigService } from '../../../test/utils/nestjs-test-helpers';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('Auth API Integration Tests', () => {
  let app: INestApplication;
  let mockUserRepository: any;

  beforeAll(async () => {
    mockUserRepository = createMockRepository<User>();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Add your auth module imports here
      ],
      providers: [
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useClass: MockConfigService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const newUser = UserFactory.create({
        ...registerDto,
        password: hashedPassword,
      });

      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(newUser);
      mockUserRepository.save.mockResolvedValue(newUser);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      mockUserRepository.findOne.mockResolvedValue(UserFactory.create({ email: registerDto.email }));

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should reject registration with invalid email', async () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should reject registration with missing fields', async () => {
      const registerDto = {
        email: 'test@example.com',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'ValidPassword123!',
      };

      const user = UserFactory.create({
        email: loginDto.email,
        password: 'hashed-password',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUserRepository.findOne.mockResolvedValue(user);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject login with invalid password', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      const user = UserFactory.create({ email: loginDto.email });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(user);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      };

      mockUserRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should lock account after multiple failed attempts', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      const user = UserFactory.create({
        email: loginDto.email,
        failedLoginAttempts: 4,
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      );
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('should reject expired refresh token', async () => {
      const expiredToken = 'expired-refresh-token';

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const accessToken = 'valid-access-token';

      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should reject logout without token', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user profile', async () => {
      const user = UserFactory.create();
      const accessToken = 'valid-access-token';

      mockUserRepository.findOne.mockResolvedValue(user);

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should send password reset email', async () => {
      const email = 'user@example.com';
      const user = UserFactory.create({ email });

      mockUserRepository.findOne.mockResolvedValue(user);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email })
        .expect(200);
    });

    it('should not reveal if email does not exist', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepository.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email })
        .expect(200); // Should still return 200 for security
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const resetDto = {
        token: 'valid-reset-token',
        newPassword: 'NewSecurePassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetDto)
        .expect(200);
    });

    it('should reject invalid reset token', async () => {
      const resetDto = {
        token: 'invalid-reset-token',
        newPassword: 'NewSecurePassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetDto)
        .expect(400);
    });

    it('should reject weak new password', async () => {
      const resetDto = {
        token: 'valid-reset-token',
        newPassword: '123',
      };

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetDto)
        .expect(400);
    });
  });

  describe('POST /auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const token = 'valid-verification-token';

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(200);
    });

    it('should reject invalid verification token', async () => {
      const token = 'invalid-verification-token';

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token })
        .expect(400);
    });
  });
});
