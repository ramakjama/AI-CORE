import { ClaimState, ClaimType, ClaimPriority, FraudRiskLevel } from '../enums/claim-state.enum';
import { StateTransitionLog } from '../workflow/claim-state-machine';

/**
 * Entidad principal de Claim/Siniestro
 */
export class Claim {
  id: string;
  claimNumber: string; // Número único de siniestro

  // Información básica
  policyId: string;
  policyNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Tipo y estado
  type: ClaimType;
  state: ClaimState;
  priority: ClaimPriority;

  // Fechas
  incidentDate: Date;
  reportedDate: Date;
  submittedDate?: Date;
  approvedDate?: Date;
  rejectedDate?: Date;
  paidDate?: Date;
  closedDate?: Date;
  lastStateChange?: Date;

  // Descripción
  title: string;
  description: string;
  location?: string;

  // Montos
  estimatedAmount: number; // Monto estimado inicial
  claimedAmount: number; // Monto reclamado por el cliente
  approvedAmount?: number; // Monto aprobado para pago
  paidAmount?: number; // Monto efectivamente pagado
  currency: string; // EUR, USD, etc.

  // Asignación
  adjusterId?: string; // Ajustador asignado
  adjusterName?: string;
  investigatorId?: string;

  // Documentos
  documents: ClaimDocument[];
  hasRequiredDocuments: boolean;
  missingDocuments?: string[];

  // Fraude
  fraudRiskLevel: FraudRiskLevel;
  fraudScore?: number; // 0-100
  fraudFlags?: FraudFlag[];

  // Aprobación
  requiresApproval: boolean;
  approvalLevel?: number;
  approvers?: Approver[];

  // Workflow
  stateHistory: StateTransitionLog[];
  notes: ClaimNote[];

  // Metadata
  metadata?: Record<string, any>;
  tags?: string[];

  // Auditoría
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Documento adjunto a un claim
 */
export class ClaimDocument {
  id: string;
  claimId: string;

  // Información del archivo
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  url: string;

  // Tipo y clasificación
  type: string; // DocumentType
  category?: string;

  // OCR
  ocrProcessed: boolean;
  ocrResult?: OCRResult;
  extractedData?: Record<string, any>;

  // Validación
  validated: boolean;
  validationErrors?: string[];

  // Metadata
  uploadedAt: Date;
  uploadedBy: string;
  processedAt?: Date;
}

/**
 * Resultado de procesamiento OCR
 */
export class OCRResult {
  provider: string; // 'tesseract' | 'google' | 'aws'
  text: string;
  confidence: number;
  language?: string;

  // Datos estructurados extraídos
  amounts?: number[];
  dates?: Date[];
  names?: string[];
  addresses?: string[];

  // Metadata
  processedAt: Date;
  processingTime: number; // ms
}

/**
 * Bandera de fraude
 */
export class FraudFlag {
  id: string;
  claimId: string;

  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  reason: string;

  // Estado
  active: boolean;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;

  // Auditoría
  createdAt: Date;
  createdBy: string;
}

/**
 * Aprobador en workflow
 */
export class Approver {
  userId: string;
  userName: string;
  role: string;
  level: number;

  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: Date;
  rejectedAt?: Date;
  notes?: string;
}

/**
 * Nota en un claim
 */
export class ClaimNote {
  id: string;
  claimId: string;

  content: string;
  type: 'INTERNAL' | 'CUSTOMER_VISIBLE' | 'INSURER_VISIBLE';

  createdAt: Date;
  createdBy: string;
  createdByName: string;
}

/**
 * Evaluación de daños
 */
export class DamageAssessment {
  id: string;
  claimId: string;

  type: 'VEHICLE' | 'PROPERTY' | 'HEALTH';
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS';

  description: string;
  estimatedCost: number;
  repairDuration?: number; // días

  // Items dañados
  items: DamageItem[];

  // Evaluador
  assessorId?: string;
  assessorName?: string;
  assessedAt: Date;

  // Imágenes analizadas
  images?: string[];
  aiAnalysis?: Record<string, any>;
}

/**
 * Item dañado en evaluación
 */
export class DamageItem {
  id: string;
  name: string;
  description?: string;

  quantity: number;
  unitCost: number;
  totalCost: number;

  repairOrReplace: 'REPAIR' | 'REPLACE';
}
