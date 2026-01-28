import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import { Queue } from '../entities/queue.entity';
import { QueueMember } from '../entities/queue-member.entity';
import { Call } from '../entities/call.entity';
import { AgentStatus } from '../interfaces/agent.interface';
import { ICall } from '../interfaces/call.interface';

interface IRoutingContext {
  callId: string;
  clientId?: string;
  queueId?: string;
  requiredSkills?: string[];
  preferredLanguage?: string;
  priority: number;
  clientTier?: 'VIP' | 'GOLD' | 'SILVER' | 'BRONZE';
}

interface IAgentScore {
  agent: Agent;
  score: number;
  reason: string[];
}

@Injectable()
export class CallRoutingService {
  private readonly logger = new Logger(CallRoutingService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>,
    @InjectRepository(QueueMember)
    private readonly queueMemberRepository: Repository<QueueMember>,
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
  ) {}

  async routeCall(context: IRoutingContext): Promise<Agent | null> {
    this.logger.log(`Routing call ${context.callId} with context:`, context);

    let availableAgents = await this.getAvailableAgents(context.requiredSkills);

    if (availableAgents.length === 0) {
      this.logger.warn(`No available agents found for call ${context.callId}`);
      return null;
    }

    if (context.queueId) {
      availableAgents = await this.filterAgentsByQueue(availableAgents, context.queueId);
    }

    if (availableAgents.length === 0) {
      this.logger.warn(`No available agents in queue for call ${context.callId}`);
      return null;
    }

    const scoredAgents = await this.scoreAgents(availableAgents, context);

    scoredAgents.sort((a, b) => b.score - a.score);

    const selectedAgent = scoredAgents[0];

    this.logger.log(
      `Selected agent ${selectedAgent.agent.id} with score ${selectedAgent.score} for call ${context.callId}`,
      { reasons: selectedAgent.reason },
    );

    return selectedAgent.agent;
  }

  async getAvailableAgents(requiredSkills?: string[]): Promise<Agent[]> {
    const queryBuilder = this.agentRepository
      .createQueryBuilder('agent')
      .where('agent.isOnline = :isOnline', { isOnline: true })
      .andWhere('agent.status = :status', { status: AgentStatus.AVAILABLE })
      .andWhere('agent.currentCalls < agent.maxConcurrentCalls');

    if (requiredSkills && requiredSkills.length > 0) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM jsonb_array_elements(agent.skills) AS skill
          WHERE skill->>'skill' IN (:...requiredSkills)
        )`,
        { requiredSkills },
      );
    }

    const agents = await queryBuilder.getMany();

    this.logger.debug(`Found ${agents.length} available agents`, {
      requiredSkills,
    });

    return agents;
  }

  async calculatePriority(clientId?: string, clientTier?: string): Promise<number> {
    let priority = 1;

    if (clientTier) {
      switch (clientTier) {
        case 'VIP':
          priority = 10;
          break;
        case 'GOLD':
          priority = 7;
          break;
        case 'SILVER':
          priority = 4;
          break;
        case 'BRONZE':
          priority = 2;
          break;
        default:
          priority = 1;
      }
    }

    if (clientId) {
      const recentCalls = await this.callRepository
        .createQueryBuilder('call')
        .where('call.clientId = :clientId', { clientId })
        .andWhere('call.createdAt > :date', {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        })
        .getCount();

      if (recentCalls > 3) {
        priority += 2;
      }
    }

    return priority;
  }

  private async filterAgentsByQueue(agents: Agent[], queueId: string): Promise<Agent[]> {
    const queueMembers = await this.queueMemberRepository
      .createQueryBuilder('qm')
      .where('qm.queueId = :queueId', { queueId })
      .andWhere('qm.paused = :paused', { paused: false })
      .andWhere('qm.agentId IN (:...agentIds)', {
        agentIds: agents.map((a) => a.id),
      })
      .getMany();

    const queueAgentIds = new Set(queueMembers.map((qm) => qm.agentId));

    return agents.filter((agent) => queueAgentIds.has(agent.id));
  }

  private async scoreAgents(agents: Agent[], context: IRoutingContext): Promise<IAgentScore[]> {
    const scoredAgents: IAgentScore[] = [];

    for (const agent of agents) {
      const score = await this.calculateAgentScore(agent, context);
      scoredAgents.push(score);
    }

    return scoredAgents;
  }

  private async calculateAgentScore(agent: Agent, context: IRoutingContext): Promise<IAgentScore> {
    let score = 0;
    const reasons: string[] = [];

    score += agent.priority * 10;
    reasons.push(`Base priority: ${agent.priority * 10}`);

    const workloadScore = this.calculateWorkloadScore(agent);
    score += workloadScore;
    reasons.push(`Workload score: ${workloadScore}`);

    if (context.requiredSkills && context.requiredSkills.length > 0) {
      const skillScore = this.calculateSkillScore(agent, context.requiredSkills);
      score += skillScore;
      reasons.push(`Skill match score: ${skillScore}`);
    }

    if (context.preferredLanguage) {
      const languageScore = this.calculateLanguageScore(agent, context.preferredLanguage);
      score += languageScore;
      reasons.push(`Language match score: ${languageScore}`);
    }

    if (context.clientId) {
      const historyScore = await this.calculateHistoryScore(agent, context.clientId);
      score += historyScore;
      if (historyScore > 0) {
        reasons.push(`Previous interaction bonus: ${historyScore}`);
      }
    }

    const performanceScore = this.calculatePerformanceScore(agent);
    score += performanceScore;
    reasons.push(`Performance score: ${performanceScore}`);

    if (context.clientTier === 'VIP') {
      score *= 1.5;
      reasons.push('VIP client multiplier: 1.5x');
    } else if (context.clientTier === 'GOLD') {
      score *= 1.3;
      reasons.push('GOLD client multiplier: 1.3x');
    }

    return {
      agent,
      score: Math.round(score),
      reason: reasons,
    };
  }

  private calculateWorkloadScore(agent: Agent): number {
    const utilizationRate = agent.currentCalls / agent.maxConcurrentCalls;

    const availableCapacity = 1 - utilizationRate;

    return Math.round(availableCapacity * 30);
  }

  private calculateSkillScore(agent: Agent, requiredSkills: string[]): number {
    if (!agent.skills || agent.skills.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let matchedSkills = 0;

    for (const requiredSkill of requiredSkills) {
      const agentSkill = agent.skills.find((s) => s.skill === requiredSkill);
      if (agentSkill) {
        totalScore += agentSkill.level * 5;
        matchedSkills++;
      }
    }

    const matchRate = matchedSkills / requiredSkills.length;
    totalScore *= matchRate;

    return Math.round(totalScore);
  }

  private calculateLanguageScore(agent: Agent, preferredLanguage: string): number {
    if (!agent.languages || agent.languages.length === 0) {
      return 0;
    }

    if (agent.languages.includes(preferredLanguage)) {
      return 20;
    }

    if (agent.languages.includes('en')) {
      return 5;
    }

    return 0;
  }

  private async calculateHistoryScore(agent: Agent, clientId: string): Promise<number> {
    const previousCalls = await this.callRepository
      .createQueryBuilder('call')
      .where('call.clientId = :clientId', { clientId })
      .andWhere('call.agentId = :agentId', { agentId: agent.id })
      .andWhere('call.createdAt > :date', {
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    if (previousCalls > 0) {
      return 25 + previousCalls * 5;
    }

    return 0;
  }

  private calculatePerformanceScore(agent: Agent): number {
    let score = 0;

    if (agent.customerSatisfactionScore) {
      score += agent.customerSatisfactionScore * 10;
    }

    if (agent.averageHandleTime && agent.averageHandleTime > 0) {
      const ahtScore = Math.max(0, 20 - agent.averageHandleTime / 60);
      score += ahtScore;
    }

    return Math.round(score);
  }

  async getAgentsByQueue(queueId: string, availableOnly = true): Promise<Agent[]> {
    const queryBuilder = this.agentRepository
      .createQueryBuilder('agent')
      .innerJoin(
        QueueMember,
        'qm',
        'qm.agentId = agent.id AND qm.queueId = :queueId AND qm.paused = false',
        { queueId },
      );

    if (availableOnly) {
      queryBuilder
        .where('agent.isOnline = :isOnline', { isOnline: true })
        .andWhere('agent.status = :status', { status: AgentStatus.AVAILABLE })
        .andWhere('agent.currentCalls < agent.maxConcurrentCalls');
    }

    return queryBuilder.getMany();
  }

  async getQueueWithMostAvailableAgents(requiredSkills?: string[]): Promise<Queue | null> {
    const queues = await this.queueRepository.find({
      where: { active: true },
    });

    let bestQueue: Queue | null = null;
    let maxAvailableAgents = 0;

    for (const queue of queues) {
      const agents = await this.getAgentsByQueue(queue.id, true);

      let filteredAgents = agents;
      if (requiredSkills && requiredSkills.length > 0) {
        filteredAgents = agents.filter((agent) => {
          return requiredSkills.every((skill) =>
            agent.skills?.some((s) => s.skill === skill),
          );
        });
      }

      if (filteredAgents.length > maxAvailableAgents) {
        maxAvailableAgents = filteredAgents.length;
        bestQueue = queue;
      }
    }

    return bestQueue;
  }
}
