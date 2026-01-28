/**
 * Estados posibles de un siniestro/claim en el sistema
 */
export enum ClaimState {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  PENDING_DOCUMENTS = 'PENDING_DOCUMENTS',
  INVESTIGATING = 'INVESTIGATING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
}

/**
 * Tipos de siniestros soportados
 */
export enum ClaimType {
  AUTO_ACCIDENT = 'AUTO_ACCIDENT',
  PROPERTY_DAMAGE = 'PROPERTY_DAMAGE',
  THEFT = 'THEFT',
  FIRE = 'FIRE',
  WATER_DAMAGE = 'WATER_DAMAGE',
  HEALTH = 'HEALTH',
  LIFE = 'LIFE',
  LIABILITY = 'LIABILITY',
  OTHER = 'OTHER',
}

/**
 * Tipos de documentos adjuntos
 */
export enum DocumentType {
  INVOICE = 'INVOICE',
  MEDICAL_REPORT = 'MEDICAL_REPORT',
  POLICE_REPORT = 'POLICE_REPORT',
  PHOTO_DAMAGE = 'PHOTO_DAMAGE',
  REPAIR_ESTIMATE = 'REPAIR_ESTIMATE',
  WITNESS_STATEMENT = 'WITNESS_STATEMENT',
  INSURANCE_CARD = 'INSURANCE_CARD',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  OTHER = 'OTHER',
}

/**
 * Prioridades de siniestros
 */
export enum ClaimPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL',
}

/**
 * Resultados de detección de fraude
 */
export enum FraudRiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
