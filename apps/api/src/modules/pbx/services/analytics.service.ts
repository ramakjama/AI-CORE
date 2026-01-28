import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';
import { Queue } from '../entities/queue.entity';
import { CallStatus } from '../interfaces/call.interface';

interface ICallKPIs {
  totalCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  missedCalls: number;
  averageSpeedOfAnswer: number; // ASA in seconds
  averageHandleTime: number; // AHT in seconds
  averageWaitTime: number; // in seconds
  abandonmentRate: number; // percentage
  serviceLevel: number; // percentage (answered within threshold)
  serviceLevelThreshold: number; // seconds
  firstCallResolution: number; // percentage
}

interface IAgentKPIs {
  agentId: string;
  agentName: string;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageHandleTime: number;
  totalTalkTime: number;
  occupancyRate: number; // percentage
  utilizationRate: number; // percentage
  customerSatisfaction: number;
}

interface IQueueKPIs {
  queueId: string;
  queueName: string;
  totalCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  averageWaitTime: number;
  longestWaitTime: number;
  serviceLevel: number;
  abandonmentRate: number;
  availableAgents: number;
  busyAgents: number;
}

interface ITimeSeriesData {
  timestamp: Date;
  calls: number;
  answered: number;
  abandoned: number;
  avgWaitTime: number;
  avgHandleTime: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly serviceLevelThreshold = 30; // 30 seconds

  constructor(
    @InjectRepository(Call)
    private readonly callRepository: Repository<Call>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(Queue)
    private readonly queueRepository: Repository<Queue>,
  ) {}

  async getCallKPIs(startDate: Date, endDate: Date, filters?: {
    queueId?: string;
    agentId?: string;
  }): Promise<ICallKPIs> {
    this.logger.log(`Calculating call KPIs from ${startDate} to ${endDate}`);

    const queryBuilder = this.callRepository
      .createQueryBuilder('call')
      .where('call.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (filters?.queueId) {
      queryBuilder.andWhere('call.queueId = :queueId', { queueId: filters.queueId });
    }

    if (filters?.agentId) {
      queryBuilder.andWhere('call.agentId = :agentId', { agentId: filters.agentId });
    }

    const calls = await queryBuilder.getMany();

    const totalCalls = calls.length;
    const answeredCalls = calls.filter((c) => c.status === CallStatus.ANSWERED || c.answerTime).length;
    const abandonedCalls = calls.filter((c) => c.status === CallStatus.NO_ANSWER && c.waitTime > 0).length;
    const missedCalls = calls.filter((c) => c.status === CallStatus.FAILED || c.status === CallStatus.BUSY).length;

    const answeredCallsData = calls.filter((c) => c.answerTime);
    const totalWaitTime = answeredCallsData.reduce((sum, c) => sum + (c.waitTime || 0), 0);
    const totalHandleTime = answeredCallsData.reduce((sum, c) => sum + (c.duration || 0), 0);

    const averageWaitTime = answeredCallsData.length > 0 ? totalWaitTime / answeredCallsData.length : 0;
    const averageHandleTime = answeredCallsData.length > 0 ? totalHandleTime / answeredCallsData.length : 0;

    const callsAnsweredInThreshold = answeredCallsData.filter((c) => (c.waitTime || 0) <= this.serviceLevelThreshold).length;
    const serviceLevel = totalCalls > 0 ? (callsAnsweredInThreshold / totalCalls) * 100 : 0;

    const abandonmentRate = totalCalls > 0 ? (abandonedCalls / totalCalls) * 100 : 0;

    const averageSpeedOfAnswer = answeredCallsData.length > 0 ? totalWaitTime / answeredCallsData.length : 0;

    const resolvedCalls = calls.filter((c) => c.summaryId).length;
    const firstCallResolution = answeredCalls > 0 ? (resolvedCalls / answeredCalls) * 100 : 0;

    return {
      totalCalls,
      answeredCalls,
      abandonedCalls,
      missedCalls,
      averageSpeedOfAnswer,
      averageHandleTime,
      averageWaitTime,
      abandonmentRate,
      serviceLevel,
      serviceLevelThreshold: this.serviceLevelThreshold,
      firstCallResolution,
    };
  }

  async getAgentPerformance(agentId: string, startDate: Date, endDate: Date): Promise<IAgentKPIs> {
    this.logger.log(`Calculating performance for agent ${agentId}`);

    const agent = await this.agentRepository.findOne({ where: { id: agentId } });
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const calls = await this.callRepository.find({
      where: {
        agentId,
        startTime: Between(startDate, endDate),
      },
    });

    const totalCalls = calls.length;
    const answeredCalls = calls.filter((c) => c.answerTime).length;
    const missedCalls = calls.filter((c) => !c.answerTime).length;

    const answeredCallsData = calls.filter((c) => c.duration);
    const totalTalkTime = answeredCallsData.reduce((sum, c) => sum + (c.duration || 0), 0);
    const averageHandleTime = answeredCallsData.length > 0 ? totalTalkTime / answeredCallsData.length : 0;

    const workingHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const totalWorkingSeconds = workingHours * 3600;

    const occupancyRate = totalWorkingSeconds > 0 ? (totalTalkTime / totalWorkingSeconds) * 100 : 0;

    const availableTime = totalWorkingSeconds - totalTalkTime;
    const utilizationRate = totalWorkingSeconds > 0 ? ((totalTalkTime + availableTime) / totalWorkingSeconds) * 100 : 0;

    return {
      agentId,
      agentName: agent.sipUser,
      totalCalls,
      answeredCalls,
      missedCalls,
      averageHandleTime,
      totalTalkTime,
      occupancyRate,
      utilizationRate,
      customerSatisfaction: agent.customerSatisfactionScore || 0,
    };
  }

  async getQueueStats(queueId: string, startDate: Date, endDate: Date): Promise<IQueueKPIs> {
    this.logger.log(`Calculating stats for queue ${queueId}`);

    const queue = await this.queueRepository.findOne({ where: { id: queueId } });
    if (!queue) {
      throw new Error(`Queue ${queueId} not found`);
    }

    const calls = await this.callRepository.find({
      where: {
        queueId,
        startTime: Between(startDate, endDate),
      },
    });

    const totalCalls = calls.length;
    const answeredCalls = calls.filter((c) => c.answerTime).length;
    const abandonedCalls = calls.filter((c) => c.status === CallStatus.NO_ANSWER && c.waitTime > 0).length;

    const waitTimes = calls.map((c) => c.waitTime || 0);
    const totalWaitTime = waitTimes.reduce((sum, time) => sum + time, 0);
    const averageWaitTime = calls.length > 0 ? totalWaitTime / calls.length : 0;
    const longestWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    const callsAnsweredInThreshold = calls.filter((c) => c.answerTime && (c.waitTime || 0) <= queue.serviceLevel).length;
    const serviceLevel = totalCalls > 0 ? (callsAnsweredInThreshold / totalCalls) * 100 : 0;

    const abandonmentRate = totalCalls > 0 ? (abandonedCalls / totalCalls) * 100 : 0;

    const agents = await this.agentRepository
      .createQueryBuilder('agent')
      .innerJoin('pbx_queue_members', 'qm', 'qm.agentId = agent.id')
      .where('qm.queueId = :queueId', { queueId })
      .getMany();

    const availableAgents = agents.filter((a) => a.isOnline && a.currentCalls < a.maxConcurrentCalls).length;
    const busyAgents = agents.filter((a) => a.isOnline && a.currentCalls >= a.maxConcurrentCalls).length;

    return {
      queueId,
      queueName: queue.name,
      totalCalls,
      answeredCalls,
      abandonedCalls,
      averageWaitTime,
      longestWaitTime,
      serviceLevel,
      abandonmentRate,
      availableAgents,
      busyAgents,
    };
  }

  async getAllQueuesStats(startDate: Date, endDate: Date): Promise<IQueueKPIs[]> {
    const queues = await this.queueRepository.find({ where: { active: true } });

    const stats: IQueueKPIs[] = [];

    for (const queue of queues) {
      try {
        const queueStats = await this.getQueueStats(queue.id, startDate, endDate);
        stats.push(queueStats);
      } catch (error) {
        this.logger.error(`Failed to get stats for queue ${queue.id}`, error);
      }
    }

    return stats;
  }

  async getAllAgentsPerformance(startDate: Date, endDate: Date): Promise<IAgentKPIs[]> {
    const agents = await this.agentRepository.find();

    const performance: IAgentKPIs[] = [];

    for (const agent of agents) {
      try {
        const agentPerf = await this.getAgentPerformance(agent.id, startDate, endDate);
        performance.push(agentPerf);
      } catch (error) {
        this.logger.error(`Failed to get performance for agent ${agent.id}`, error);
      }
    }

    return performance.sort((a, b) => b.totalCalls - a.totalCalls);
  }

  async getTimeSeriesData(
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' | 'month',
    filters?: {
      queueId?: string;
      agentId?: string;
    },
  ): Promise<ITimeSeriesData[]> {
    this.logger.log(`Generating time series data with interval: ${interval}`);

    const queryBuilder = this.callRepository
      .createQueryBuilder('call')
      .where('call.startTime BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (filters?.queueId) {
      queryBuilder.andWhere('call.queueId = :queueId', { queueId: filters.queueId });
    }

    if (filters?.agentId) {
      queryBuilder.andWhere('call.agentId = :agentId', { agentId: filters.agentId });
    }

    const calls = await queryBuilder.getMany();

    const timeSeriesMap = new Map<string, ITimeSeriesData>();

    for (const call of calls) {
      const timestamp = this.normalizeTimestamp(call.startTime, interval);
      const key = timestamp.toISOString();

      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, {
          timestamp,
          calls: 0,
          answered: 0,
          abandoned: 0,
          avgWaitTime: 0,
          avgHandleTime: 0,
        });
      }

      const data = timeSeriesMap.get(key)!;
      data.calls++;

      if (call.answerTime) {
        data.answered++;
        data.avgWaitTime += call.waitTime || 0;
        data.avgHandleTime += call.duration || 0;
      } else if (call.status === CallStatus.NO_ANSWER) {
        data.abandoned++;
      }
    }

    const timeSeries = Array.from(timeSeriesMap.values()).map((data) => ({
      ...data,
      avgWaitTime: data.answered > 0 ? data.avgWaitTime / data.answered : 0,
      avgHandleTime: data.answered > 0 ? data.avgHandleTime / data.answered : 0,
    }));

    return timeSeries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private normalizeTimestamp(date: Date, interval: 'hour' | 'day' | 'week' | 'month'): Date {
    const normalized = new Date(date);

    switch (interval) {
      case 'hour':
        normalized.setMinutes(0, 0, 0);
        break;
      case 'day':
        normalized.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const day = normalized.getDay();
        const diff = normalized.getDate() - day + (day === 0 ? -6 : 1);
        normalized.setDate(diff);
        normalized.setHours(0, 0, 0, 0);
        break;
      case 'month':
        normalized.setDate(1);
        normalized.setHours(0, 0, 0, 0);
        break;
    }

    return normalized;
  }

  async getRealtimeStats(): Promise<{
    activeCalls: number;
    waitingCalls: number;
    availableAgents: number;
    busyAgents: number;
    queues: Array<{
      queueId: string;
      queueName: string;
      callsInQueue: number;
      availableAgents: number;
    }>;
  }> {
    const activeCalls = await this.callRepository.count({
      where: [{ status: CallStatus.RINGING }, { status: CallStatus.ANSWERED }],
    });

    const waitingCalls = await this.callRepository.count({
      where: { status: CallStatus.RINGING },
    });

    const agents = await this.agentRepository.find({ where: { isOnline: true } });
    const availableAgents = agents.filter((a) => a.currentCalls < a.maxConcurrentCalls).length;
    const busyAgents = agents.filter((a) => a.currentCalls >= a.maxConcurrentCalls).length;

    const queues = await this.queueRepository.find({ where: { active: true } });

    const queueStats = await Promise.all(
      queues.map(async (queue) => {
        const callsInQueue = await this.callRepository.count({
          where: {
            queueId: queue.id,
            status: CallStatus.RINGING,
          },
        });

        const queueAgents = await this.agentRepository
          .createQueryBuilder('agent')
          .innerJoin('pbx_queue_members', 'qm', 'qm.agentId = agent.id')
          .where('qm.queueId = :queueId', { queueId: queue.id })
          .andWhere('agent.isOnline = :isOnline', { isOnline: true })
          .andWhere('agent.currentCalls < agent.maxConcurrentCalls')
          .getCount();

        return {
          queueId: queue.id,
          queueName: queue.name,
          callsInQueue,
          availableAgents: queueAgents,
        };
      }),
    );

    return {
      activeCalls,
      waitingCalls,
      availableAgents,
      busyAgents,
      queues: queueStats,
    };
  }

  async getCallDistribution(startDate: Date, endDate: Date, groupBy: 'status' | 'direction' | 'queue' | 'agent'): Promise<
    Array<{
      category: string;
      count: number;
      percentage: number;
    }>
  > {
    const calls = await this.callRepository.find({
      where: {
        startTime: Between(startDate, endDate),
      },
    });

    const distributionMap = new Map<string, number>();
    const total = calls.length;

    for (const call of calls) {
      let category: string;

      switch (groupBy) {
        case 'status':
          category = call.status;
          break;
        case 'direction':
          category = call.direction;
          break;
        case 'queue':
          category = call.queueId || 'No Queue';
          break;
        case 'agent':
          category = call.agentId || 'No Agent';
          break;
        default:
          category = 'Unknown';
      }

      distributionMap.set(category, (distributionMap.get(category) || 0) + 1);
    }

    const distribution = Array.from(distributionMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return distribution;
  }

  async generateDashboardData(startDate: Date, endDate: Date): Promise<{
    kpis: ICallKPIs;
    realtimeStats: any;
    topAgents: IAgentKPIs[];
    queueStats: IQueueKPIs[];
    callDistribution: any;
    timeSeries: ITimeSeriesData[];
  }> {
    this.logger.log('Generating dashboard data');

    const [kpis, realtimeStats, topAgents, queueStats, callDistribution, timeSeries] = await Promise.all([
      this.getCallKPIs(startDate, endDate),
      this.getRealtimeStats(),
      this.getAllAgentsPerformance(startDate, endDate).then((agents) => agents.slice(0, 10)),
      this.getAllQueuesStats(startDate, endDate),
      this.getCallDistribution(startDate, endDate, 'status'),
      this.getTimeSeriesData(startDate, endDate, 'hour'),
    ]);

    return {
      kpis,
      realtimeStats,
      topAgents,
      queueStats,
      callDistribution,
      timeSeries,
    };
  }
}
