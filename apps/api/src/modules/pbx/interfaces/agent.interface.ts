export enum AgentStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_CALL = 'on_call',
  BREAK = 'break',
  LUNCH = 'lunch',
  TRAINING = 'training',
  MEETING = 'meeting',
  OFFLINE = 'offline',
  AWAY = 'away',
}

export interface IAgentSkill {
  skill: string;
  level: number; // 1-5
}

export interface IAgent {
  id: string;
  userId: string;
  extension: string;
  sipUser: string;
  status: AgentStatus;
  skills: IAgentSkill[];
  languages: string[];
  maxConcurrentCalls: number;
  currentCalls: number;
  priority: number;
  isOnline: boolean;
  lastStatusChange: Date;
}

export interface IAgentPerformance {
  agentId: string;
  date: Date;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  averageHandleTime: number;
  averageHoldTime: number;
  firstCallResolution: number;
  customerSatisfaction: number;
  totalTalkTime: number;
  totalWrapTime: number;
}
