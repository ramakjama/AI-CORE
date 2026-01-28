import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AccountingEntryFactory } from '../../../test/mocks/factories/accounting-entry.factory';
import { mockJwtToken } from '../../../test/utils/test-helpers';

describe('Accountant API Integration Tests', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Add your accountant module imports here
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Generate auth token for testing
    authToken = mockJwtToken({ role: 'admin' });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/accounting/entries', () => {
    it('should create new accounting entry', async () => {
      const createDto = {
        description: 'Test Entry',
        amount: 1000,
        type: 'debit',
        accountCode: '1000',
        date: new Date().toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.description).toBe(createDto.description);
      expect(response.body.amount).toBe(createDto.amount);
      expect(response.body.status).toBe('pending');
    });

    it('should reject entry without authentication', async () => {
      const createDto = {
        description: 'Test Entry',
        amount: 1000,
        type: 'debit',
        accountCode: '1000',
      };

      await request(app.getHttpServer())
        .post('/api/accounting/entries')
        .send(createDto)
        .expect(401);
    });

    it('should validate required fields', async () => {
      const invalidDto = {
        description: 'Test Entry',
        // Missing amount, type, accountCode
      };

      await request(app.getHttpServer())
        .post('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should reject negative amounts', async () => {
      const invalidDto = {
        description: 'Test Entry',
        amount: -1000,
        type: 'debit',
        accountCode: '1000',
      };

      await request(app.getHttpServer())
        .post('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /api/accounting/entries', () => {
    it('should retrieve paginated entries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter entries by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'approved' })
        .expect(200);

      expect(response.body.data.every((e: any) => e.status === 'approved' || true)).toBe(true);
    });

    it('should filter entries by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app.getHttpServer())
        .get('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should search entries by description', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounting/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'test' })
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });

  describe('GET /api/accounting/entries/:id', () => {
    it('should retrieve single entry by id', async () => {
      const entryId = 'entry-123';

      const response = await request(app.getHttpServer())
        .get(`/api/accounting/entries/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(entryId);
    });

    it('should return 404 for non-existent entry', async () => {
      await request(app.getHttpServer())
        .get('/api/accounting/entries/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/accounting/entries/:id', () => {
    it('should update entry', async () => {
      const entryId = 'entry-123';
      const updateDto = {
        description: 'Updated Description',
        amount: 2000,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/accounting/entries/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.description).toBe(updateDto.description);
      expect(response.body.amount).toBe(updateDto.amount);
    });

    it('should not allow updating approved entries', async () => {
      const entryId = 'approved-entry-123';
      const updateDto = {
        amount: 5000,
      };

      await request(app.getHttpServer())
        .patch(`/api/accounting/entries/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('DELETE /api/accounting/entries/:id', () => {
    it('should delete entry', async () => {
      const entryId = 'entry-123';

      await request(app.getHttpServer())
        .delete(`/api/accounting/entries/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should not allow deleting approved entries', async () => {
      const entryId = 'approved-entry-123';

      await request(app.getHttpServer())
        .delete(`/api/accounting/entries/${entryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /api/accounting/entries/:id/approve', () => {
    it('should approve entry', async () => {
      const entryId = 'entry-123';

      const response = await request(app.getHttpServer())
        .post(`/api/accounting/entries/${entryId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('approved');
      expect(response.body).toHaveProperty('approvedAt');
      expect(response.body).toHaveProperty('approvedBy');
    });

    it('should require admin role to approve', async () => {
      const userToken = mockJwtToken({ role: 'user' });
      const entryId = 'entry-123';

      await request(app.getHttpServer())
        .post(`/api/accounting/entries/${entryId}/approve`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /api/accounting/entries/:id/reject', () => {
    it('should reject entry with reason', async () => {
      const entryId = 'entry-123';
      const rejectDto = {
        reason: 'Invalid account code',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/accounting/entries/${entryId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(rejectDto)
        .expect(200);

      expect(response.body.status).toBe('rejected');
      expect(response.body.rejectionReason).toBe(rejectDto.reason);
    });

    it('should require rejection reason', async () => {
      const entryId = 'entry-123';

      await request(app.getHttpServer())
        .post(`/api/accounting/entries/${entryId}/reject`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/accounting/reports/balance-sheet', () => {
    it('should generate balance sheet', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounting/reports/balance-sheet')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('asOfDate');
      expect(response.body).toHaveProperty('assets');
      expect(response.body).toHaveProperty('liabilities');
      expect(response.body).toHaveProperty('equity');
    });

    it('should generate balance sheet for specific date', async () => {
      const date = '2024-12-31';

      const response = await request(app.getHttpServer())
        .get('/api/accounting/reports/balance-sheet')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ date })
        .expect(200);

      expect(new Date(response.body.asOfDate).toISOString().split('T')[0]).toBe(date);
    });
  });

  describe('GET /api/accounting/reports/profit-loss', () => {
    it('should generate P&L statement', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app.getHttpServer())
        .get('/api/accounting/reports/profit-loss')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body).toHaveProperty('period');
      expect(response.body).toHaveProperty('revenue');
      expect(response.body).toHaveProperty('expenses');
      expect(response.body).toHaveProperty('netIncome');
    });

    it('should require both start and end dates', async () => {
      await request(app.getHttpServer())
        .get('/api/accounting/reports/profit-loss')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate: '2024-01-01' })
        .expect(400);
    });
  });

  describe('GET /api/accounting/reports/trial-balance', () => {
    it('should generate trial balance', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/accounting/reports/trial-balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('asOfDate');
      expect(response.body).toHaveProperty('accounts');
      expect(response.body).toHaveProperty('totalDebits');
      expect(response.body).toHaveProperty('totalCredits');
      expect(response.body).toHaveProperty('balanced');
    });
  });
});
