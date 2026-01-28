import { Test, TestingModule } from '@nestjs/testing';
import { LeadService } from '../src/services/lead.service';
import { LeadStatus, LeadSource } from '../src/dto/lead.dto';

describe('LeadService', () => {
  let service: LeadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LeadService],
    }).compile();

    service = module.get<LeadService>(LeadService);
  });

  describe('CRUD Operations', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create a lead', async () => {
      const dto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phone: '+34612345678',
        company: 'Test Corp',
        source: LeadSource.WEBSITE,
        notes: 'Test lead'
      };

      const result = await service.create(dto, 'user_123');
      expect(result).toBeDefined();
      expect(result.email).toBe(dto.email);
      expect(result.status).toBe(LeadStatus.NEW);
    });

    it('should find all leads', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it('should find one lead by ID', async () => {
      const lead = await service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const result = await service.findOne(lead.id);
      expect(result).toBeDefined();
      expect(result.id).toBe(lead.id);
    });

    it('should update a lead', async () => {
      const lead = await service.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'update@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const updated = await service.update(lead.id, {
        notes: 'Updated notes'
      }, 'user_123');

      expect(updated.notes).toBe('Updated notes');
    });

    it('should delete a lead', async () => {
      const lead = await service.create({
        firstName: 'Delete',
        lastName: 'Me',
        email: 'delete@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      await service.delete(lead.id);
      await expect(service.findOne(lead.id)).rejects.toThrow();
    });
  });

  describe('Lead Scoring', () => {
    it('should calculate lead score', async () => {
      const lead = {
        source: LeadSource.REFERRAL,
        company: 'Test Corp',
        phone: '+34612345678',
        jobTitle: 'CEO'
      };

      const score = await service.calculateScore(lead);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should give higher score to referral leads', async () => {
      const referralLead = {
        source: LeadSource.REFERRAL,
        company: 'Test Corp'
      };

      const websiteLead = {
        source: LeadSource.WEBSITE,
        company: 'Test Corp'
      };

      const referralScore = await service.calculateScore(referralLead);
      const websiteScore = await service.calculateScore(websiteLead);

      expect(referralScore).toBeGreaterThan(websiteScore);
    });

    it('should update lead score', async () => {
      const lead = await service.create({
        firstName: 'Score',
        lastName: 'Test',
        email: 'score@example.com',
        source: LeadSource.REFERRAL,
        company: 'Big Corp'
      }, 'user_123');

      const updated = await service.updateScore(lead.id);
      expect(updated.score).toBeDefined();
    });

    it('should get hot leads', async () => {
      const hotLeads = await service.getHotLeads(70);
      expect(hotLeads).toBeInstanceOf(Array);
      hotLeads.forEach(lead => {
        expect(lead.score).toBeGreaterThanOrEqual(70);
      });
    });

    it('should get cold leads', async () => {
      const coldLeads = await service.getColdLeads(30);
      expect(coldLeads).toBeInstanceOf(Array);
      coldLeads.forEach(lead => {
        expect(lead.score).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('Assignment', () => {
    it('should assign lead to agent', async () => {
      const lead = await service.create({
        firstName: 'Assign',
        lastName: 'Test',
        email: 'assign@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const assigned = await service.assign(lead.id, 'agent_123', 'user_123');
      expect(assigned.assignedToId).toBe('agent_123');
    });

    it('should get unassigned leads', async () => {
      const unassigned = await service.getUnassignedLeads();
      expect(unassigned).toBeInstanceOf(Array);
      unassigned.forEach(lead => {
        expect(lead.assignedToId).toBeNull();
      });
    });

    it('should get leads by agent', async () => {
      const leads = await service.getLeadsByAgent('agent_123');
      expect(leads).toBeInstanceOf(Array);
      leads.forEach(lead => {
        expect(lead.assignedToId).toBe('agent_123');
      });
    });
  });

  describe('Conversion', () => {
    it('should check if lead can be converted', async () => {
      const lead = await service.create({
        firstName: 'Convert',
        lastName: 'Test',
        email: 'convert@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      await service.markAsQualified(lead.id, 'user_123');
      const canConvert = await service.canConvert(lead.id);
      expect(canConvert).toBe(true);
    });

    it('should mark lead as qualified', async () => {
      const lead = await service.create({
        firstName: 'Qualify',
        lastName: 'Test',
        email: 'qualify@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const qualified = await service.markAsQualified(lead.id, 'user_123');
      expect(qualified.status).toBe(LeadStatus.QUALIFIED);
    });

    it('should mark lead as unqualified', async () => {
      const lead = await service.create({
        firstName: 'Unqualify',
        lastName: 'Test',
        email: 'unqualify@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const unqualified = await service.markAsUnqualified(
        lead.id,
        'Not interested',
        'user_123'
      );
      expect(unqualified.status).toBe(LeadStatus.UNQUALIFIED);
    });

    it('should convert lead to customer', async () => {
      const lead = await service.create({
        firstName: 'Convert',
        lastName: 'Customer',
        email: 'convert-customer@example.com',
        source: LeadSource.REFERRAL
      }, 'user_123');

      await service.markAsQualified(lead.id, 'user_123');

      const result = await service.convertToCustomer(
        lead.id,
        { createOpportunity: true, estimatedValue: 5000 },
        'user_123'
      );

      expect(result.customer).toBeDefined();
      expect(result.opportunity).toBeDefined();
    });
  });

  describe('Import/Export', () => {
    it('should bulk update leads', async () => {
      const lead1 = await service.create({
        firstName: 'Bulk1',
        lastName: 'Test',
        email: 'bulk1@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const lead2 = await service.create({
        firstName: 'Bulk2',
        lastName: 'Test',
        email: 'bulk2@example.com',
        source: LeadSource.MANUAL
      }, 'user_123');

      const result = await service.bulkUpdate(
        [lead1.id, lead2.id],
        { notes: 'Bulk updated' },
        'user_123'
      );

      expect(result.updated).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });
});
