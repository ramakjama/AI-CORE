import { Test, TestingModule } from '@nestjs/testing';
import { OpportunityService } from '../src/services/opportunity.service';
import { PipelineStage } from '../src/dto/opportunity.dto';

describe('OpportunityService', () => {
  let service: OpportunityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpportunityService],
    }).compile();

    service = module.get<OpportunityService>(OpportunityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CRUD Operations', () => {
    it('should create an opportunity', async () => {
      const dto = {
        name: 'Test Opportunity',
        leadId: 'lead_123',
        stage: PipelineStage.QUALIFIED,
        value: 50000,
        probability: 50
      };

      const result = await service.create(dto, 'user_123');
      expect(result).toBeDefined();
      expect(result.name).toBe(dto.name);
      expect(result.value).toBe(dto.value);
    });

    it('should find all opportunities', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should update an opportunity', async () => {
      const opp = await service.create({
        name: 'Update Test',
        stage: PipelineStage.QUALIFIED,
        value: 10000,
        probability: 50
      }, 'user_123');

      const updated = await service.update(opp.id, {
        value: 15000
      }, 'user_123');

      expect(updated.value).toBe(15000);
    });
  });

  describe('Pipeline Management', () => {
    it('should move opportunity to different stage', async () => {
      const opp = await service.create({
        name: 'Pipeline Test',
        stage: PipelineStage.QUALIFIED,
        value: 20000,
        probability: 50
      }, 'user_123');

      const moved = await service.moveToStage(opp.id, PipelineStage.PROPOSAL, 'user_123');
      expect(moved.stage).toBe(PipelineStage.PROPOSAL);
    });

    it('should get opportunities by stage', async () => {
      const opportunities = await service.getByStage(PipelineStage.QUALIFIED);
      expect(opportunities).toBeInstanceOf(Array);
      opportunities.forEach(opp => {
        expect(opp.stage).toBe(PipelineStage.QUALIFIED);
      });
    });

    it('should get pipeline view', async () => {
      const pipeline = await service.getPipeline();
      expect(pipeline).toBeDefined();
      expect(pipeline.stages).toBeDefined();
      expect(pipeline.totalValue).toBeGreaterThanOrEqual(0);
    });

    it('should calculate probability', async () => {
      const opp = await service.create({
        name: 'Probability Test',
        stage: PipelineStage.PROPOSAL,
        value: 30000,
        probability: 60
      }, 'user_123');

      const probability = await service.calculateProbability(opp);
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(100);
    });

    it('should forecast revenue', async () => {
      const forecast = await service.forecastRevenue();
      expect(forecast).toBeDefined();
      expect(forecast.predictedRevenue).toBeGreaterThanOrEqual(0);
      expect(forecast.weightedRevenue).toBeGreaterThanOrEqual(0);
    });

    it('should get stale opportunities', async () => {
      const stale = await service.getStaleOpportunities(30);
      expect(stale).toBeInstanceOf(Array);
    });

    it('should close opportunity as won', async () => {
      const opp = await service.create({
        name: 'Win Test',
        stage: PipelineStage.NEGOTIATION,
        value: 25000,
        probability: 80
      }, 'user_123');

      const won = await service.closeWon(
        opp.id,
        { actualValue: 27000, notes: 'Great deal!' },
        'user_123'
      );

      expect(won.stage).toBe(PipelineStage.CLOSED_WON);
      expect(won.actualValue).toBe(27000);
      expect(won.closedAt).toBeDefined();
    });

    it('should close opportunity as lost', async () => {
      const opp = await service.create({
        name: 'Loss Test',
        stage: PipelineStage.PROPOSAL,
        value: 15000,
        probability: 40
      }, 'user_123');

      const lost = await service.closeLost(
        opp.id,
        { reason: 'Chose competitor', notes: 'Better pricing' },
        'user_123'
      );

      expect(lost.stage).toBe(PipelineStage.CLOSED_LOST);
      expect(lost.lostReason).toBe('Chose competitor');
      expect(lost.closedAt).toBeDefined();
    });

    it('should reopen closed opportunity', async () => {
      const opp = await service.create({
        name: 'Reopen Test',
        stage: PipelineStage.PROPOSAL,
        value: 18000,
        probability: 50
      }, 'user_123');

      await service.closeLost(
        opp.id,
        { reason: 'Budget issues' },
        'user_123'
      );

      const reopened = await service.reopen(
        opp.id,
        'Budget approved',
        'user_123'
      );

      expect(reopened.stage).toBe(PipelineStage.QUALIFIED);
      expect(reopened.closedAt).toBeNull();
    });
  });

  describe('Activities', () => {
    it('should log activity for opportunity', async () => {
      const opp = await service.create({
        name: 'Activity Test',
        stage: PipelineStage.QUALIFIED,
        value: 12000,
        probability: 50
      }, 'user_123');

      const activity = await service.logActivity(
        opp.id,
        {
          type: 'CALL',
          description: 'Discussed pricing options'
        },
        'user_123'
      );

      expect(activity).toBeDefined();
      expect(activity.opportunityId).toBe(opp.id);
    });

    it('should get activities for opportunity', async () => {
      const opp = await service.create({
        name: 'Get Activities Test',
        stage: PipelineStage.QUALIFIED,
        value: 8000,
        probability: 50
      }, 'user_123');

      const activities = await service.getActivities(opp.id);
      expect(activities).toBeInstanceOf(Array);
    });

    it('should schedule follow-up', async () => {
      const opp = await service.create({
        name: 'Follow-up Test',
        stage: PipelineStage.MEETING_SCHEDULED,
        value: 22000,
        probability: 60
      }, 'user_123');

      const followUp = await service.scheduleFollowUp(
        opp.id,
        {
          scheduledFor: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          description: 'Follow up on proposal',
          type: 'CALL'
        },
        'user_123'
      );

      expect(followUp).toBeDefined();
      expect(followUp.scheduledFor).toBeDefined();
    });
  });

  afterAll(async () => {
    await service.onModuleDestroy();
  });
});
