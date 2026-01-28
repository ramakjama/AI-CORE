/**
 * ClientContext component - Display client information and CRM data
 */

import React, { useState } from 'react';
import { ClientContextData } from '@/types/pbx';
import {
  User,
  FileText,
  AlertCircle,
  DollarSign,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Shield,
  Receipt,
  MessageSquare,
} from 'lucide-react';

interface ClientContextProps {
  clientData: ClientContextData | null;
  loading?: boolean;
  onViewFullProfile?: () => void;
}

export function ClientContext({
  clientData,
  loading = false,
  onViewFullProfile,
}: ClientContextProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'policies'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <User className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm text-center">No client information available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Client Context</h3>
          {onViewFullProfile && (
            <button
              onClick={onViewFullProfile}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              type="button"
            >
              Full Profile
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* AI Summary */}
        <CollapsibleSection
          title="AI Summary"
          icon={MessageSquare}
          isExpanded={expandedSections.has('summary')}
          onToggle={() => toggleSection('summary')}
        >
          <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
            <p className="text-sm text-gray-700 leading-relaxed">
              {clientData.aiSummary ||
                'AI-generated summary will appear here based on client history and interactions.'}
            </p>
          </div>
        </CollapsibleSection>

        {/* Client Info */}
        <div className="p-4 space-y-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSegmentStyle(clientData.segment)}`}>
              {clientData.segment}
            </span>
            {clientData.sorisBalance > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                {clientData.sorisBalance} SORIS
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            {clientData.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Email:</span>
                <span>{clientData.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">Phone:</span>
              <span className="font-mono">{clientData.phone}</span>
            </div>
          </div>
        </div>

        {/* Active Policies */}
        <CollapsibleSection
          title={`Active Policies (${clientData.activePolicies.length})`}
          icon={Shield}
          isExpanded={expandedSections.has('policies')}
          onToggle={() => toggleSection('policies')}
        >
          <div className="space-y-2">
            {clientData.activePolicies.map((policy) => (
              <PolicyCard key={policy.id} policy={policy} />
            ))}
          </div>
        </CollapsibleSection>

        {/* Pending Receipts */}
        {clientData.pendingReceipts.length > 0 && (
          <CollapsibleSection
            title={`Pending Receipts (${clientData.pendingReceipts.length})`}
            icon={Receipt}
            isExpanded={expandedSections.has('receipts')}
            onToggle={() => toggleSection('receipts')}
            badge={
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                {clientData.pendingReceipts.length}
              </span>
            }
          >
            <div className="space-y-2">
              {clientData.pendingReceipts.map((receipt) => (
                <ReceiptCard key={receipt.id} receipt={receipt} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Open Claims */}
        {clientData.openClaims.length > 0 && (
          <CollapsibleSection
            title={`Open Claims (${clientData.openClaims.length})`}
            icon={AlertCircle}
            isExpanded={expandedSections.has('claims')}
            onToggle={() => toggleSection('claims')}
            badge={
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {clientData.openClaims.length}
              </span>
            }
          >
            <div className="space-y-2">
              {clientData.openClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Last Interaction */}
        {clientData.lastInteraction && (
          <CollapsibleSection
            title="Last Interaction"
            icon={Calendar}
            isExpanded={expandedSections.has('interaction')}
            onToggle={() => toggleSection('interaction')}
          >
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {clientData.lastInteraction.type}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(clientData.lastInteraction.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                {clientData.lastInteraction.summary}
              </p>
            </div>
          </CollapsibleSection>
        )}

        {/* Important Notes */}
        {clientData.importantNotes.length > 0 && (
          <CollapsibleSection
            title="Important Notes"
            icon={FileText}
            isExpanded={expandedSections.has('notes')}
            onToggle={() => toggleSection('notes')}
          >
            <div className="space-y-2">
              {clientData.importantNotes.map((note, index) => (
                <div
                  key={index}
                  className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg"
                >
                  <p className="text-sm text-gray-700">{note}</p>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );
}

// Helper Components

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<any>;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
  badge,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-600" />
          <span className="font-medium text-sm text-gray-900">{title}</span>
          {badge}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function PolicyCard({ policy }: { policy: ClientContextData['activePolicies'][0] }) {
  return (
    <div className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm text-gray-900">{policy.type}</h4>
          <p className="text-xs text-gray-500 font-mono">{policy.number}</p>
        </div>
        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
          {policy.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{policy.insurer}</span>
        <span className="font-semibold">${policy.premium}/mo</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Expires: {new Date(policy.expiryDate).toLocaleDateString()}
      </div>
    </div>
  );
}

function ReceiptCard({ receipt }: { receipt: ClientContextData['pendingReceipts'][0] }) {
  const isOverdue = new Date(receipt.dueDate) < new Date();

  return (
    <div
      className={`p-3 rounded-lg border-l-4 ${
        isOverdue ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900">{receipt.number}</span>
        <span className="text-sm font-bold text-gray-900">${receipt.amount}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className={isOverdue ? 'text-red-700 font-medium' : 'text-gray-600'}>
          Due: {new Date(receipt.dueDate).toLocaleDateString()}
        </span>
        <span className={`px-2 py-0.5 rounded ${isOverdue ? 'bg-red-200 text-red-800' : 'bg-orange-200 text-orange-800'} font-medium`}>
          {receipt.status}
        </span>
      </div>
    </div>
  );
}

function ClaimCard({ claim }: { claim: ClientContextData['openClaims'][0] }) {
  return (
    <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold text-gray-900">{claim.type}</span>
        <span className="px-2 py-0.5 bg-red-200 text-red-800 text-xs font-medium rounded">
          {claim.status}
        </span>
      </div>
      <div className="text-xs text-gray-600">
        Opened: {new Date(claim.openedDate).toLocaleDateString()}
      </div>
      {claim.amount && (
        <div className="mt-1 text-sm font-bold text-gray-900">${claim.amount}</div>
      )}
    </div>
  );
}

function getSegmentStyle(segment: string): string {
  switch (segment.toUpperCase()) {
    case 'VIP':
      return 'bg-purple-600 text-white';
    case 'GOLD':
      return 'bg-amber-500 text-white';
    case 'SILVER':
      return 'bg-gray-400 text-white';
    case 'BRONZE':
      return 'bg-orange-700 text-white';
    default:
      return 'bg-gray-200 text-gray-700';
  }
}
