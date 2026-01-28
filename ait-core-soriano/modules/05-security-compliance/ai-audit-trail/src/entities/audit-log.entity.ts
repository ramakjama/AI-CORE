import { ApiProperty } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXECUTE = 'EXECUTE',
  CONFIGURE = 'CONFIGURE',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  CONFIGURATION = 'CONFIGURATION',
  SECURITY = 'SECURITY',
  COMPLIANCE = 'COMPLIANCE',
  SYSTEM = 'SYSTEM',
}

export class AuditLog {
  @ApiProperty({ description: 'Unique audit log ID' })
  id: string;

  @ApiProperty({ description: 'Timestamp of the event' })
  timestamp: Date;

  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  action: AuditAction;

  @ApiProperty({ enum: AuditCategory, description: 'Category of the audit event' })
  category: AuditCategory;

  @ApiProperty({ enum: AuditSeverity, description: 'Severity level' })
  severity: AuditSeverity;

  @ApiProperty({ description: 'User ID who performed the action' })
  userId: string;

  @ApiProperty({ description: 'Username who performed the action' })
  username: string;

  @ApiProperty({ description: 'User email' })
  userEmail?: string;

  @ApiProperty({ description: 'User role at the time of action' })
  userRole: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'IP address of the user' })
  ipAddress: string;

  @ApiProperty({ description: 'User agent (browser/device info)' })
  userAgent: string;

  @ApiProperty({ description: 'Geographic location (city, country)' })
  geolocation?: string;

  @ApiProperty({ description: 'Resource type being accessed' })
  resourceType: string;

  @ApiProperty({ description: 'Resource ID being accessed' })
  resourceId: string;

  @ApiProperty({ description: 'Module or service name' })
  module: string;

  @ApiProperty({ description: 'API endpoint or function called' })
  endpoint: string;

  @ApiProperty({ description: 'HTTP method or operation type' })
  method: string;

  @ApiProperty({ description: 'Request parameters (sanitized)' })
  requestParams?: any;

  @ApiProperty({ description: 'Response status code' })
  responseStatus: number;

  @ApiProperty({ description: 'Previous state of the resource (for updates)' })
  oldValue?: any;

  @ApiProperty({ description: 'New state of the resource (for updates)' })
  newValue?: any;

  @ApiProperty({ description: 'Changes made (diff)' })
  changes?: any;

  @ApiProperty({ description: 'Execution duration in milliseconds' })
  duration?: number;

  @ApiProperty({ description: 'Error message if action failed' })
  errorMessage?: string;

  @ApiProperty({ description: 'Stack trace if error occurred' })
  stackTrace?: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: any;

  @ApiProperty({ description: 'Compliance tags (GDPR, SOX, etc.)' })
  complianceTags?: string[];

  @ApiProperty({ description: 'Checksum for tamper detection' })
  checksum: string;

  @ApiProperty({ description: 'Is the log encrypted' })
  encrypted: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;
}
