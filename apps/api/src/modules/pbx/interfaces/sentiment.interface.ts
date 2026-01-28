export enum SentimentScore {
  VERY_NEGATIVE = 'very_negative',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral',
  POSITIVE = 'positive',
  VERY_POSITIVE = 'very_positive',
}

export enum EmotionType {
  ANGRY = 'angry',
  FRUSTRATED = 'frustrated',
  CONFUSED = 'confused',
  SATISFIED = 'satisfied',
  HAPPY = 'happy',
  ANXIOUS = 'anxious',
  NEUTRAL = 'neutral',
  URGENT = 'urgent',
}

export interface ISentimentAnalysis {
  id: string;
  callId: string;
  transcriptionId: string;
  overallScore: number; // 0-1
  overallSentiment: SentimentScore;
  emotions: EmotionType[];
  frustrationLevel: number; // 0-1
  urgencyLevel: number; // 0-1
  satisfactionScore: number; // 0-1
  keyPhrases: string[];
  escalationRequired: boolean;
  escalationReason?: string;
  timeline: ISentimentTimeline[];
  createdAt: Date;
}

export interface ISentimentTimeline {
  timestamp: number;
  score: number;
  sentiment: SentimentScore;
  text: string;
}

export interface ISentimentAlert {
  callId: string;
  agentId: string;
  type: 'frustration' | 'escalation' | 'negative_trend';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
}
