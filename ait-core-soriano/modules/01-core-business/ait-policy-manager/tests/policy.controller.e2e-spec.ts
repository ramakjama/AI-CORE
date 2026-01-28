import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PolicyController } from '../src/controllers/policy.controller';
import { PolicyService } from '../src/services/policy.service';
import { PolicyRulesService } from '../src/services/policy-rules.service';
import { PolicyType, PolicyStatus } from '../src/dto';

describe('PolicyController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PolicyController],
      providers: [PolicyService, PolicyRulesService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Mock authentication
    authToken = 'Bearer test-token';
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== CREATE POLICY ====================

  describe('/POST policies', () => {
    it('should create a new policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies')
        .set('Authorization', authToken)
        .send({
          clientId: 'client-123',
          productId: 'product-auto-basic',
          type: PolicyType.AUTO,
          effectiveDate: '2026-02-01T00:00:00Z',
          expirationDate: '2027-02-01T00:00:00Z',
          totalPremium: 850,
          agentId: 'agent-456',
          coverages: [
            {
              name: 'Responsabilidad Civil',
              code: 'RC_AUTO',
              sumInsured: 50000,
              premium: 350
            }
          ]
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('policyNumber');
          expect(res.body.status).toBe(PolicyStatus.DRAFT);
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies')
        .set('Authorization', authToken)
        .send({
          clientId: 'client-123',
          // Missing required fields
        })
        .expect(400);
    });

    it('should return 401 without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies')
        .send({})
        .expect(401);
    });
  });

  // ==================== GET POLICIES ====================

  describe('/GET policies', () => {
    it('should return paginated list of policies', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies?status=active')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(res.body.data.every(p => p.status === 'active')).toBe(true);
        });
    });

    it('should filter by type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies?type=auto')
        .set('Authorization', authToken)
        .expect(200);
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies?page=1&limit=10')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(10);
          expect(res.body.data.length).toBeLessThanOrEqual(10);
        });
    });
  });

  describe('/GET policies/:id', () => {
    it('should return policy details', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/policy-123')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('policyNumber');
          expect(res.body).toHaveProperty('coverages');
          expect(res.body).toHaveProperty('party');
        });
    });

    it('should return 404 for non-existent policy', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/non-existent')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  // ==================== UPDATE POLICY ====================

  describe('/PUT policies/:id', () => {
    it('should update policy', () => {
      return request(app.getHttpServer())
        .put('/api/v1/policies/policy-123')
        .set('Authorization', authToken)
        .send({
          status: PolicyStatus.ACTIVE,
          notes: 'Updated notes'
        })
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe(PolicyStatus.ACTIVE);
        });
    });
  });

  // ==================== RENEW POLICY ====================

  describe('/POST policies/:id/renew', () => {
    it('should renew policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/policy-123/renew')
        .set('Authorization', authToken)
        .send({
          newEffectiveDate: '2027-02-01T00:00:00Z',
          newExpirationDate: '2028-02-01T00:00:00Z',
          keepCurrentCoverages: true
        })
        .expect(201)
        .expect(res => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.id).not.toBe('policy-123');
        });
    });

    it('should return 400 for cancelled policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/cancelled-policy/renew')
        .set('Authorization', authToken)
        .send({
          newEffectiveDate: '2027-02-01T00:00:00Z',
          newExpirationDate: '2028-02-01T00:00:00Z'
        })
        .expect(400);
    });
  });

  // ==================== ENDORSE POLICY ====================

  describe('/POST policies/:id/endorse', () => {
    it('should create endorsement', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/policy-123/endorse')
        .set('Authorization', authToken)
        .send({
          endorsementType: 'add_coverage',
          effectiveDate: '2026-06-01T00:00:00Z',
          description: 'Add glass coverage',
          premiumAdjustment: 50
        })
        .expect(201);
    });
  });

  // ==================== CANCEL POLICY ====================

  describe('/POST policies/:id/cancel', () => {
    it('should cancel policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/policy-123/cancel')
        .set('Authorization', authToken)
        .send({
          cancellationDate: new Date().toISOString(),
          reason: 'Customer request',
          refundAmount: 100
        })
        .expect(200)
        .expect(res => {
          expect(res.body.status).toBe(PolicyStatus.CANCELLED);
        });
    });
  });

  // ==================== SUSPEND/REACTIVATE ====================

  describe('/POST policies/:id/suspend', () => {
    it('should suspend active policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/policy-123/suspend')
        .set('Authorization', authToken)
        .send({ reason: 'Non-payment' })
        .expect(200);
    });
  });

  describe('/POST policies/:id/reactivate', () => {
    it('should reactivate suspended policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/suspended-policy/reactivate')
        .set('Authorization', authToken)
        .expect(200);
    });
  });

  // ==================== COVERAGES ====================

  describe('/POST policies/:id/coverages', () => {
    it('should add coverage to policy', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/policy-123/coverages')
        .set('Authorization', authToken)
        .send({
          name: 'Glass Coverage',
          code: 'GLASS',
          sumInsured: 5000,
          premium: 50
        })
        .expect(201);
    });
  });

  describe('/GET policies/:id/coverages', () => {
    it('should list policy coverages', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/policy-123/coverages')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ==================== HISTORY ====================

  describe('/GET policies/:id/history', () => {
    it('should return policy history', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/policy-123/history')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ==================== DOCUMENTS ====================

  describe('/POST policies/:id/documents', () => {
    it('should upload document', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/policy-123/documents')
        .set('Authorization', authToken)
        .attach('file', Buffer.from('test'), 'test.pdf')
        .field('type', 'policy_certificate')
        .expect(201);
    });
  });

  describe('/GET policies/:id/documents', () => {
    it('should list documents', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/policy-123/documents')
        .set('Authorization', authToken)
        .expect(200);
    });
  });

  // ==================== QUOTES ====================

  describe('/POST policies/quote', () => {
    it('should calculate premium quote', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/quote')
        .set('Authorization', authToken)
        .send({
          customerId: 'client-123',
          type: PolicyType.AUTO,
          coverages: [
            {
              name: 'RC',
              code: 'RC_AUTO',
              sumInsured: 50000,
              premium: 350
            }
          ],
          riskData: { vehiclePlate: 'ABC123' }
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('quoteId');
          expect(res.body).toHaveProperty('totalPremium');
          expect(res.body).toHaveProperty('coverageBreakdown');
        });
    });
  });

  // ==================== STATISTICS ====================

  describe('/GET policies/statistics/global', () => {
    it('should return global statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/statistics/global')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('totalPolicies');
          expect(res.body).toHaveProperty('activePolicies');
          expect(res.body).toHaveProperty('totalAnnualPremium');
        });
    });
  });

  describe('/GET policies/statistics/customer/:customerId', () => {
    it('should return customer statistics', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/statistics/customer/client-123')
        .set('Authorization', authToken)
        .expect(200);
    });
  });

  describe('/GET policies/expiring/:days', () => {
    it('should return expiring policies', () => {
      return request(app.getHttpServer())
        .get('/api/v1/policies/expiring/30')
        .set('Authorization', authToken)
        .expect(200)
        .expect(res => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ==================== VALIDATIONS ====================

  describe('/POST policies/validate', () => {
    it('should validate policy without creating', () => {
      return request(app.getHttpServer())
        .post('/api/v1/policies/validate')
        .set('Authorization', authToken)
        .send({
          clientId: 'client-123',
          productId: 'product-auto-basic',
          type: PolicyType.AUTO,
          effectiveDate: '2026-02-01T00:00:00Z',
          expirationDate: '2027-02-01T00:00:00Z',
          totalPremium: 850,
          agentId: 'agent-456',
          coverages: []
        })
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('isValid');
          expect(res.body).toHaveProperty('issues');
        });
    });
  });
});
