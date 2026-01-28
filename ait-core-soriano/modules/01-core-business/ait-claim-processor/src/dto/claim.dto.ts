import { IsString, IsNumber, IsEnum, IsOptional, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ClaimType, ClaimPriority, DocumentType } from '../enums/claim-state.enum';

/**
 * DTO para crear un claim
 */
export class CreateClaimDto {
  @IsString()
  policyId: string;

  @IsString()
  customerId: string;

  @IsEnum(ClaimType)
  type: ClaimType;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  incidentDate: Date;

  @IsOptional()
  @IsString()
  location?: string;

  @IsNumber()
  @Min(0)
  estimatedAmount: number;

  @IsOptional()
  @IsEnum(ClaimPriority)
  priority?: ClaimPriority;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO para actualizar un claim
 */
export class UpdateClaimDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedAmount?: number;

  @IsOptional()
  @IsEnum(ClaimPriority)
  priority?: ClaimPriority;

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO para revisar un claim
 */
export class ReviewClaimDto {
  @IsString()
  reviewNotes: string;

  @IsOptional()
  @IsString()
  assignTo?: string;

  @IsOptional()
  @IsEnum(ClaimPriority)
  priority?: ClaimPriority;
}

/**
 * DTO para aprobar un claim
 */
export class ApproveClaimDto {
  @IsNumber()
  @Min(0)
  approvedAmount: number;

  @IsString()
  approvalNotes: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

/**
 * DTO para rechazar un claim
 */
export class RejectClaimDto {
  @IsString()
  reason: string;

  @IsString()
  reasonCode: string;

  @IsOptional()
  @IsString()
  detailedExplanation?: string;
}

/**
 * DTO para procesar pago
 */
export class ProcessPaymentDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  paymentNotes?: string;
}

/**
 * DTO para filtrar claims
 */
export class FilterClaimDto {
  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsEnum(ClaimType)
  type?: ClaimType;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  policyId?: string;

  @IsOptional()
  @IsString()
  adjusterId?: string;

  @IsOptional()
  @IsEnum(ClaimPriority)
  priority?: ClaimPriority;

  @IsOptional()
  @IsDateString()
  fromDate?: Date;

  @IsOptional()
  @IsDateString()
  toDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * DTO para solicitar documentos
 */
export class RequestDocumentsDto {
  @IsArray()
  @IsEnum(DocumentType, { each: true })
  documents: DocumentType[];

  @IsString()
  reason: string;

  @IsOptional()
  @IsNumber()
  dueInDays?: number;
}

/**
 * Resultado paginado
 */
export class PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Estadísticas de claims
 */
export class ClaimStatistics {
  totalClaims: number;
  claimsByState: Record<string, number>;
  claimsByType: Record<string, number>;
  averageClaimAmount: number;
  totalApprovedAmount: number;
  totalPaidAmount: number;
  averageProcessingTime: number; // días
  approvalRate: number; // porcentaje
  rejectionRate: number;
  pendingReview: number;
  highValueClaims: number; // > €10,000
}

/**
 * Razón de rechazo
 */
export class RejectReason {
  code: string;
  description: string;
  count: number;
  percentage: number;
}

/**
 * Análisis de fraude
 */
export class FraudAnalysis {
  claimId: string;
  riskLevel: string;
  score: number; // 0-100
  flags: FraudFlagDto[];
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT' | 'INVESTIGATE';
  confidence: number;
  reasons: string[];
}

export class FraudFlagDto {
  type: string;
  severity: string;
  description: string;
}

/**
 * Revisión de fraude
 */
export class FraudReview {
  claimId: string;
  flags: any[];
  allReviewed: boolean;
  activeFlags: number;
  resolvedFlags: number;
}
