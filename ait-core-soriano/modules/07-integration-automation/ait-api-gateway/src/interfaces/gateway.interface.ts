export interface IGatewayConfig {
  defaultTimeout: number;
  defaultRetries: number;
  maxConcurrentRequests: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface IProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  cached: boolean;
  responseTime: number;
}

export interface IRouteMatch {
  route: any;
  params: Record<string, string>;
  score: number;
}

export interface IRequestContext {
  requestId: string;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  route?: any;
}
