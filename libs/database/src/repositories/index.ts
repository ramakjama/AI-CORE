/**
 * Repositories Index
 * Exports all repository classes and factory functions
 */

// Base Repository
export {
  BaseRepository,
  createRepository,
  CrossDatabaseRepository,
} from './base.repository';

// Party Repository
export {
  PartyRepository,
  getPartyRepository,
  type PartyCreateInput,
  type PartyUpdateInput,
  type PartySearchCriteria,
} from './party.repository';

// Policy Repository
export {
  PolicyRepository,
  getPolicyRepository,
  type PolicyStatus,
  type PolicyCreateInput,
  type PolicyUpdateInput,
  type PolicySearchCriteria,
  type CoverageInput,
} from './policy.repository';

// Claim Repository
export {
  ClaimRepository,
  getClaimRepository,
  type ClaimStatus,
  type ClaimCreateInput,
  type ClaimUpdateInput,
  type ClaimSearchCriteria,
  type ClaimStatusUpdate,
} from './claim.repository';

// Document Repository
export {
  DocumentRepository,
  getDocumentRepository,
  type DocumentType,
  type DocumentCreateInput,
  type DocumentUpdateInput,
  type DocumentSearchCriteria,
} from './document.repository';

// Workflow Repository
export {
  WorkflowRepository,
  getWorkflowRepository,
  type WorkflowStatus,
  type StepStatus,
  type WorkflowCreateInput,
  type WorkflowStepInput,
  type WorkflowUpdateInput,
  type WorkflowSearchCriteria,
  type StepTransition,
} from './workflow.repository';
