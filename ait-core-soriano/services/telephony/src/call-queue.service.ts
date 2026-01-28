/**
 * Call Queue Service
 * Manage call queues and agent distribution
 */

import { createClient, RedisClientType } from 'redis';
import { config } from './config';

interface QueuedCall {
  callSid: string;
  from: string;
  queuedAt: Date;
  position: number;
}

export class CallQueueService {
  private redis: RedisClientType;

  constructor() {
    this.redis = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });

    this.redis.connect().catch(console.error);
  }

  /**
   * Add call to queue
   */
  async enqueue(queueId: string, call: QueuedCall): Promise<void> {
    const key = `queue:${queueId}`;
    await this.redis.rPush(key, JSON.stringify(call));

    console.log(`[Queue] Added call ${call.callSid} to ${queueId}`);
  }

  /**
   * Remove call from queue (when answered)
   */
  async dequeue(queueId: string): Promise<QueuedCall | null> {
    const key = `queue:${queueId}`;
    const data = await this.redis.lPop(key);

    if (!data) return null;

    const call = JSON.parse(data);
    console.log(`[Queue] Removed call ${call.callSid} from ${queueId}`);

    return call;
  }

  /**
   * Get queue status
   */
  async getQueueStatus(queueId: string) {
    const key = `queue:${queueId}`;
    const length = await this.redis.lLen(key);
    const calls = await this.redis.lRange(key, 0, -1);

    const queuedCalls = calls.map((data, index) => {
      const call = JSON.parse(data);
      return {
        ...call,
        position: index + 1,
        estimatedWaitTime: (index + 1) * 60, // 1 minute per position (example)
      };
    });

    return {
      id: queueId,
      name: queueId,
      currentSize: length,
      maxSize: 100, // Configurable
      averageWaitTime: length * 60, // Example calculation
      calls: queuedCalls,
    };
  }

  /**
   * Get available agents
   */
  async getAvailableAgents(queueId: string): Promise<string[]> {
    // TODO: Implement agent availability logic
    // For now, return mock data
    return ['+34912345678', '+34912345679'];
  }

  /**
   * Distribute call to next available agent
   */
  async distributeCall(queueId: string): Promise<string | null> {
    const agents = await this.getAvailableAgents(queueId);

    if (agents.length === 0) {
      console.log(`[Queue] No available agents for ${queueId}`);
      return null;
    }

    // Simple round-robin distribution
    const agent = agents[0];
    console.log(`[Queue] Distributing call to agent ${agent}`);

    return agent;
  }
}
