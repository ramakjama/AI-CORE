// Domain Events for MDM
// These events are published to the event bus for cross-system integration

export interface DomainEvent {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  metadata: EventMetadata;
  occurredAt: Date;
}

export interface EventMetadata {
  userId?: string;
  tenantId: string;
  correlationId?: string;
  causationId?: string;
}

export const MDM_EVENTS = {
  PARTY_CREATED: 'mdm.party.created',
  PARTY_UPDATED: 'mdm.party.updated',
  PARTY_MERGED: 'mdm.party.merged',
  PARTY_UNMERGED: 'mdm.party.unmerged',
  PARTY_DELETED: 'mdm.party.deleted',
  
  IDENTIFIER_ADDED: 'mdm.identifier.added',
  IDENTIFIER_VERIFIED: 'mdm.identifier.verified',
  
  CONTACT_ADDED: 'mdm.contact.added',
  CONTACT_VERIFIED: 'mdm.contact.verified',
  CONTACT_OPTED_OUT: 'mdm.contact.opted_out',
  
  ADDRESS_ADDED: 'mdm.address.added',
  ADDRESS_UPDATED: 'mdm.address.updated',
  
  RELATIONSHIP_CREATED: 'mdm.relationship.created',
  RELATIONSHIP_ENDED: 'mdm.relationship.ended',
  
  HOUSEHOLD_CREATED: 'mdm.household.created',
  HOUSEHOLD_MEMBER_ADDED: 'mdm.household.member_added',
  HOUSEHOLD_MEMBER_REMOVED: 'mdm.household.member_removed',
  
  DUPLICATE_DETECTED: 'mdm.duplicate.detected',
  GOLDEN_RECORD_UPDATED: 'mdm.golden_record.updated',
} as const;

export type MDMEventType = typeof MDM_EVENTS[keyof typeof MDM_EVENTS];

export function createEvent(
  type: MDMEventType,
  aggregateType: string,
  aggregateId: string,
  payload: Record<string, unknown>,
  metadata: EventMetadata
): DomainEvent {
  return {
    id: crypto.randomUUID(),
    type,
    aggregateType,
    aggregateId,
    payload,
    metadata,
    occurredAt: new Date(),
  };
}
