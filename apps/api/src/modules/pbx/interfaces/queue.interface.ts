export enum QueueStrategy {
  RING_ALL = 'ringall',
  LEAST_RECENT = 'leastrecent',
  FEWEST_CALLS = 'fewestcalls',
  RANDOM = 'random',
  ROUND_ROBIN = 'rrmemory',
  LINEAR = 'linear',
  WEIGHTED_RANDOM = 'wrandom',
}

export interface IQueue {
  id: string;
  name: string;
  extension: string;
  strategy: QueueStrategy;
  maxWaitTime: number;
  maxCallers: number;
  announceFrequency: number;
  announceHoldTime: boolean;
  musicOnHold: string;
  priority: number;
  requiredSkills: string[];
  serviceLevel: number;
  active: boolean;
}

export interface IQueueMember {
  queueId: string;
  agentId: string;
  penalty: number;
  paused: boolean;
}

export interface IQueueStats {
  queueId: string;
  callsInQueue: number;
  longestWaitTime: number;
  averageWaitTime: number;
  serviceLevel: number;
  abandonmentRate: number;
  answeredCalls: number;
  abandonedCalls: number;
  availableAgents: number;
  busyAgents: number;
  totalAgents: number;
}
