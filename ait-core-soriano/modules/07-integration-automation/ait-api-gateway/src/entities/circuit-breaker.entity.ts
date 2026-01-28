import { ApiProperty } from '@nestjs/swagger';

export enum CircuitBreakerState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
  @ApiProperty({ description: 'Circuit breaker unique identifier' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  serviceName: string;

  @ApiProperty({ description: 'Service URL' })
  serviceUrl: string;

  @ApiProperty({ enum: CircuitBreakerState, description: 'Circuit state' })
  state: CircuitBreakerState;

  @ApiProperty({ description: 'Failure count' })
  failureCount: number;

  @ApiProperty({ description: 'Success count' })
  successCount: number;

  @ApiProperty({ description: 'Failure threshold', default: 5 })
  failureThreshold: number;

  @ApiProperty({ description: 'Success threshold for half-open', default: 2 })
  successThreshold: number;

  @ApiProperty({ description: 'Timeout in milliseconds', default: 60000 })
  timeout: number;

  @ApiProperty({ description: 'Last failure timestamp', nullable: true })
  lastFailureAt?: Date;

  @ApiProperty({ description: 'Last success timestamp', nullable: true })
  lastSuccessAt?: Date;

  @ApiProperty({ description: 'Next attempt timestamp', nullable: true })
  nextAttemptAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
