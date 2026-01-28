import { IsEnum, IsString, IsOptional, IsNumber, IsObject, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction, AuditCategory, AuditSeverity } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  @IsEnum(AuditAction)
  action: AuditAction;

  @ApiProperty({ enum: AuditCategory, description: 'Category of the audit event' })
  @IsEnum(AuditCategory)
  category: AuditCategory;

  @ApiProperty({ enum: AuditSeverity, description: 'Severity level', default: AuditSeverity.INFO })
  @IsEnum(AuditSeverity)
  @IsOptional()
  severity?: AuditSeverity;

  @ApiProperty({ description: 'User ID who performed the action' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Username who performed the action' })
  @IsString()
  username: string;

  @ApiPropertyOptional({ description: 'User email' })
  @IsString()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({ description: 'User role at the time of action' })
  @IsString()
  userRole: string;

  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'IP address of the user' })
  @IsString()
  ipAddress: string;

  @ApiProperty({ description: 'User agent (browser/device info)' })
  @IsString()
  userAgent: string;

  @ApiPropertyOptional({ description: 'Geographic location' })
  @IsString()
  @IsOptional()
  geolocation?: string;

  @ApiProperty({ description: 'Resource type being accessed' })
  @IsString()
  resourceType: string;

  @ApiProperty({ description: 'Resource ID being accessed' })
  @IsString()
  resourceId: string;

  @ApiProperty({ description: 'Module or service name' })
  @IsString()
  module: string;

  @ApiProperty({ description: 'API endpoint or function called' })
  @IsString()
  endpoint: string;

  @ApiProperty({ description: 'HTTP method or operation type' })
  @IsString()
  method: string;

  @ApiPropertyOptional({ description: 'Request parameters (sanitized)' })
  @IsObject()
  @IsOptional()
  requestParams?: any;

  @ApiProperty({ description: 'Response status code' })
  @IsNumber()
  responseStatus: number;

  @ApiPropertyOptional({ description: 'Previous state of the resource' })
  @IsObject()
  @IsOptional()
  oldValue?: any;

  @ApiPropertyOptional({ description: 'New state of the resource' })
  @IsObject()
  @IsOptional()
  newValue?: any;

  @ApiPropertyOptional({ description: 'Changes made (diff)' })
  @IsObject()
  @IsOptional()
  changes?: any;

  @ApiPropertyOptional({ description: 'Execution duration in milliseconds' })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Error message if action failed' })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiPropertyOptional({ description: 'Stack trace if error occurred' })
  @IsString()
  @IsOptional()
  stackTrace?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({ description: 'Compliance tags', type: [String] })
  @IsArray()
  @IsOptional()
  complianceTags?: string[];
}
