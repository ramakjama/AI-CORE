export interface CreateReportDto {
  name: string;
  description?: string;
  templateId?: string;
  parameters?: ReportParameters;
  schedule?: CronExpression;
  recipients?: string[];
  format?: ReportFormat;
}

export interface UpdateReportDto {
  name?: string;
  description?: string;
  parameters?: ReportParameters;
  schedule?: CronExpression;
  recipients?: string[];
  isActive?: boolean;
}

export interface FilterReportDto {
  type?: string;
  status?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface ReportParameters {
  period?: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    productType?: string[];
    region?: string[];
    channel?: string[];
    agentId?: string[];
    status?: string[];
  };
  groupBy?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface ReportOutput {
  reportId: string;
  name: string;
  generatedAt: Date;
  data: any;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  recordCount: number;
  executionTime: number;
  parameters: ReportParameters;
  format?: ReportFormat;
  fileSize?: number;
}

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'html';

export type CronExpression = string; // e.g., '0 0 * * *' for daily at midnight

export interface ScheduledReport {
  id: string;
  reportId: string;
  schedule: CronExpression;
  lastRun?: Date;
  nextRun: Date;
  isActive: boolean;
  recipients: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PolicyFilters {
  status?: string[];
  productType?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  agentId?: string[];
  region?: string[];
}

export interface ClaimFilters {
  status?: string[];
  claimType?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export interface CustomerFilters {
  segment?: string[];
  status?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  region?: string[];
}
