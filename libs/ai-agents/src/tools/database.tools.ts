// AI-Agents Database Tools - Connect to all 38 databases

import type { ToolDefinition, AgentContext } from '../types';

// Database connection mapping
const DATABASE_CONNECTIONS: Record<string, string> = {
  // Core
  sm_global: 'SM_GLOBAL_DATABASE_URL',
  // Insurance
  ss_insurance: 'SS_INSURANCE_DATABASE_URL',
  ss_commissions: 'SS_COMMISSIONS_DATABASE_URL',
  ss_endorsements: 'SS_ENDORSEMENTS_DATABASE_URL',
  ss_retention: 'SS_RETENTION_DATABASE_URL',
  ss_vigilance: 'SS_VIGILANCE_DATABASE_URL',
  // Utilities
  se_energy: 'SE_ENERGY_DATABASE_URL',
  st_telecom: 'ST_TELECOM_DATABASE_URL',
  sf_finance: 'SF_FINANCE_DATABASE_URL',
  // Services
  sr_repairs: 'SR_REPAIRS_DATABASE_URL',
  sw_workshops: 'SW_WORKSHOPS_DATABASE_URL',
  // Operations
  sm_analytics: 'SM_ANALYTICS_DATABASE_URL',
  sm_communications: 'SM_COMMUNICATIONS_DATABASE_URL',
  sm_documents: 'SM_DOCUMENTS_DATABASE_URL',
  sm_compliance: 'SM_COMPLIANCE_DATABASE_URL',
  sm_leads: 'SM_LEADS_DATABASE_URL',
  sm_marketing: 'SM_MARKETING_DATABASE_URL',
  sm_hr: 'SM_HR_DATABASE_URL',
  sm_inventory: 'SM_INVENTORY_DATABASE_URL',
  sm_integrations: 'SM_INTEGRATIONS_DATABASE_URL',
  sm_projects: 'SM_PROJECTS_DATABASE_URL',
  sm_strategy: 'SM_STRATEGY_DATABASE_URL',
  sm_ai_agents: 'SM_AI_AGENTS_DATABASE_URL',
  sm_accounting: 'SM_ACCOUNTING_DATABASE_URL',
  sm_techteam: 'SM_TECHTEAM_DATABASE_URL',
  sm_commercial: 'SM_COMMERCIAL_DATABASE_URL',
  sm_products: 'SM_PRODUCTS_DATABASE_URL',
  sm_objectives: 'SM_OBJECTIVES_DATABASE_URL',
  sm_notifications: 'SM_NOTIFICATIONS_DATABASE_URL',
  sm_scheduling: 'SM_SCHEDULING_DATABASE_URL',
  sm_audit: 'SM_AUDIT_DATABASE_URL',
  sm_workflows: 'SM_WORKFLOWS_DATABASE_URL',
  sm_data_quality: 'SM_DATA_QUALITY_DATABASE_URL',
  sm_tickets: 'SM_TICKETS_DATABASE_URL',
  sm_quality: 'SM_QUALITY_DATABASE_URL',
  sm_legal: 'SM_LEGAL_DATABASE_URL',
  // Portals
  soriano_ecliente: 'SORIANO_ECLIENTE_DATABASE_URL',
  soriano_web_premium: 'SORIANO_WEB_PREMIUM_DATABASE_URL',
};

// Party/Client Tools
export const getPartyTool: ToolDefinition = {
  name: 'get_party',
  description: 'Retrieve party (customer/company) information from the master data',
  inputSchema: {
    type: 'object',
    properties: {
      partyId: { type: 'string', description: 'Party ID' },
      nif: { type: 'string', description: 'NIF/CIF/NIE of the party' },
      email: { type: 'string', description: 'Email address' },
    },
    anyOf: [
      { required: ['partyId'] },
      { required: ['nif'] },
      { required: ['email'] },
    ],
  },
  databases: ['sm_global'],
  async handler(input, context) {
    // TODO: Query sm_global.Party
    return { partyId: input['partyId'], name: 'Demo Party', type: 'PERSON' };
  },
};

export const searchPartiesTool: ToolDefinition = {
  name: 'search_parties',
  description: 'Search for parties by name, NIF, or other criteria',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      type: { type: 'string', enum: ['PERSON', 'COMPANY', 'ALL'] },
      limit: { type: 'number', default: 10 },
    },
    required: ['query'],
  },
  databases: ['sm_global'],
  async handler(input, context) {
    // TODO: Query sm_global.Party with fuzzy search
    return { results: [], total: 0 };
  },
};

// Policy Tools
export const getPolicyTool: ToolDefinition = {
  name: 'get_policy',
  description: 'Retrieve policy details including coverages, receipts, and status',
  inputSchema: {
    type: 'object',
    properties: {
      policyNumber: { type: 'string', description: 'Policy number' },
      policyId: { type: 'string', description: 'Policy ID' },
    },
    anyOf: [{ required: ['policyNumber'] }, { required: ['policyId'] }],
  },
  databases: ['ss_insurance'],
  async handler(input, context) {
    // TODO: Query ss_insurance.Policy
    return { policyNumber: input['policyNumber'], status: 'ACTIVE' };
  },
};

export const searchPoliciesTool: ToolDefinition = {
  name: 'search_policies',
  description: 'Search policies by party, product, status, or date range',
  inputSchema: {
    type: 'object',
    properties: {
      partyId: { type: 'string' },
      productCode: { type: 'string' },
      status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'CANCELLED', 'EXPIRED'] },
      startDateFrom: { type: 'string', format: 'date' },
      startDateTo: { type: 'string', format: 'date' },
      limit: { type: 'number', default: 20 },
    },
  },
  databases: ['ss_insurance'],
  async handler(input, context) {
    return { results: [], total: 0 };
  },
};

export const createQuoteTool: ToolDefinition = {
  name: 'create_quote',
  description: 'Create a new insurance quote for a party',
  inputSchema: {
    type: 'object',
    properties: {
      partyId: { type: 'string', description: 'Party ID' },
      productCode: { type: 'string', description: 'Product code' },
      riskData: { type: 'object', description: 'Risk details (vehicle, property, etc.)' },
      coverages: { type: 'array', items: { type: 'string' } },
    },
    required: ['partyId', 'productCode', 'riskData'],
  },
  databases: ['ss_insurance', 'sm_products'],
  async handler(input, context) {
    // TODO: Calculate premium using tarification engine
    return { quoteId: 'QUO-12345', premium: 450.00, coverages: input['coverages'] };
  },
};

// Claims Tools
export const getClaimTool: ToolDefinition = {
  name: 'get_claim',
  description: 'Retrieve claim details including timeline and documents',
  inputSchema: {
    type: 'object',
    properties: {
      claimNumber: { type: 'string' },
      claimId: { type: 'string' },
    },
    anyOf: [{ required: ['claimNumber'] }, { required: ['claimId'] }],
  },
  databases: ['ss_insurance'],
  async handler(input, context) {
    return { claimNumber: input['claimNumber'], status: 'IN_PROGRESS' };
  },
};

export const createClaimTool: ToolDefinition = {
  name: 'create_claim',
  description: 'Open a new claim for a policy',
  inputSchema: {
    type: 'object',
    properties: {
      policyNumber: { type: 'string' },
      incidentDate: { type: 'string', format: 'date-time' },
      description: { type: 'string' },
      claimType: { type: 'string' },
      estimatedAmount: { type: 'number' },
    },
    required: ['policyNumber', 'incidentDate', 'description', 'claimType'],
  },
  databases: ['ss_insurance'],
  async handler(input, context) {
    return { claimNumber: 'SIN-2026-00001', status: 'OPENED' };
  },
};

export const updateClaimStatusTool: ToolDefinition = {
  name: 'update_claim_status',
  description: 'Update the status of an existing claim',
  inputSchema: {
    type: 'object',
    properties: {
      claimNumber: { type: 'string' },
      newStatus: { type: 'string', enum: ['DOCUMENTING', 'REVIEWING', 'APPROVED', 'REJECTED', 'CLOSED'] },
      comment: { type: 'string' },
    },
    required: ['claimNumber', 'newStatus'],
  },
  databases: ['ss_insurance'],
  async handler(input, context) {
    return { success: true, claimNumber: input['claimNumber'], newStatus: input['newStatus'] };
  },
};

// Communication Tools
export const sendEmailTool: ToolDefinition = {
  name: 'send_email',
  description: 'Send an email to a party or internal user',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', format: 'email' },
      subject: { type: 'string' },
      body: { type: 'string' },
      templateCode: { type: 'string' },
      templateData: { type: 'object' },
      attachments: { type: 'array', items: { type: 'string' } },
    },
    required: ['to', 'subject'],
    anyOf: [{ required: ['body'] }, { required: ['templateCode'] }],
  },
  databases: ['sm_communications'],
  async handler(input, context) {
    return { messageId: 'MSG-12345', status: 'QUEUED' };
  },
};

export const sendSmsTool: ToolDefinition = {
  name: 'send_sms',
  description: 'Send an SMS to a party',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Phone number' },
      message: { type: 'string', maxLength: 160 },
    },
    required: ['to', 'message'],
  },
  databases: ['sm_communications'],
  async handler(input, context) {
    return { messageId: 'SMS-12345', status: 'SENT' };
  },
};

export const sendWhatsAppTool: ToolDefinition = {
  name: 'send_whatsapp',
  description: 'Send a WhatsApp message using templates',
  inputSchema: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'WhatsApp phone number' },
      templateName: { type: 'string' },
      templateParams: { type: 'object' },
    },
    required: ['to', 'templateName'],
  },
  databases: ['sm_communications'],
  async handler(input, context) {
    return { messageId: 'WA-12345', status: 'SENT' };
  },
};

// Document Tools
export const getDocumentTool: ToolDefinition = {
  name: 'get_document',
  description: 'Retrieve a document by ID',
  inputSchema: {
    type: 'object',
    properties: {
      documentId: { type: 'string' },
    },
    required: ['documentId'],
  },
  databases: ['sm_documents'],
  async handler(input, context) {
    return { documentId: input['documentId'], name: 'Document.pdf', url: 'https://...' };
  },
};

export const searchDocumentsTool: ToolDefinition = {
  name: 'search_documents',
  description: 'Search documents by entity, type, or content',
  inputSchema: {
    type: 'object',
    properties: {
      entityType: { type: 'string', enum: ['policy', 'claim', 'party'] },
      entityId: { type: 'string' },
      documentType: { type: 'string' },
      query: { type: 'string', description: 'Full-text search' },
    },
  },
  databases: ['sm_documents'],
  async handler(input, context) {
    return { results: [], total: 0 };
  },
};

export const generateDocumentTool: ToolDefinition = {
  name: 'generate_document',
  description: 'Generate a document from a template',
  inputSchema: {
    type: 'object',
    properties: {
      templateCode: { type: 'string' },
      data: { type: 'object' },
      format: { type: 'string', enum: ['PDF', 'DOCX', 'HTML'] },
    },
    required: ['templateCode', 'data'],
  },
  databases: ['sm_documents'],
  async handler(input, context) {
    return { documentId: 'DOC-12345', url: 'https://...' };
  },
};

// Workflow Tools
export const startWorkflowTool: ToolDefinition = {
  name: 'start_workflow',
  description: 'Start a new workflow instance',
  inputSchema: {
    type: 'object',
    properties: {
      workflowCode: { type: 'string' },
      title: { type: 'string' },
      entityType: { type: 'string' },
      entityId: { type: 'string' },
      variables: { type: 'object' },
    },
    required: ['workflowCode', 'title'],
  },
  databases: ['sm_workflows'],
  async handler(input, context) {
    return { instanceId: 'WF-12345', caseNumber: 'CASE-2026-00001' };
  },
};

export const getWorkflowStatusTool: ToolDefinition = {
  name: 'get_workflow_status',
  description: 'Get the current status of a workflow instance',
  inputSchema: {
    type: 'object',
    properties: {
      instanceId: { type: 'string' },
      caseNumber: { type: 'string' },
    },
    anyOf: [{ required: ['instanceId'] }, { required: ['caseNumber'] }],
  },
  databases: ['sm_workflows'],
  async handler(input, context) {
    return { status: 'RUNNING', currentStep: 'review', progress: 50 };
  },
};

// Analytics Tools
export const getCustomerScoreTool: ToolDefinition = {
  name: 'get_customer_score',
  description: 'Get ML-based scores for a customer (churn, LTV, cross-sell)',
  inputSchema: {
    type: 'object',
    properties: {
      partyId: { type: 'string' },
      scoreTypes: { type: 'array', items: { type: 'string', enum: ['CHURN', 'LTV', 'CROSS_SELL', 'FRAUD'] } },
    },
    required: ['partyId'],
  },
  databases: ['sm_analytics'],
  async handler(input, context) {
    return {
      partyId: input['partyId'],
      scores: {
        churn: { value: 0.15, risk: 'LOW' },
        ltv: { value: 12500, tier: 'GOLD' },
        crossSell: { value: 0.72, recommendedProduct: 'HOME' },
      },
    };
  },
};

export const getSegmentTool: ToolDefinition = {
  name: 'get_segment',
  description: 'Get customer segment assignment',
  inputSchema: {
    type: 'object',
    properties: {
      partyId: { type: 'string' },
      segmentationModel: { type: 'string', default: 'RFM' },
    },
    required: ['partyId'],
  },
  databases: ['sm_analytics'],
  async handler(input, context) {
    return {
      partyId: input['partyId'],
      segment: 'CHAMPIONS',
      rfmScore: '544',
      recommendations: ['Exclusive offers', 'Priority support'],
    };
  },
};

// Leads Tools
export const createLeadTool: ToolDefinition = {
  name: 'create_lead',
  description: 'Create a new sales lead',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' },
      phone: { type: 'string' },
      source: { type: 'string' },
      productInterest: { type: 'string' },
      notes: { type: 'string' },
    },
    required: ['name'],
    anyOf: [{ required: ['email'] }, { required: ['phone'] }],
  },
  databases: ['sm_leads'],
  async handler(input, context) {
    return { leadId: 'LEAD-12345', status: 'NEW' };
  },
};

export const qualifyLeadTool: ToolDefinition = {
  name: 'qualify_lead',
  description: 'Qualify a lead and assign score',
  inputSchema: {
    type: 'object',
    properties: {
      leadId: { type: 'string' },
      budget: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      authority: { type: 'boolean' },
      need: { type: 'string' },
      timeline: { type: 'string', enum: ['IMMEDIATE', '1_MONTH', '3_MONTHS', '6_MONTHS', 'UNKNOWN'] },
    },
    required: ['leadId'],
  },
  databases: ['sm_leads'],
  async handler(input, context) {
    return { leadId: input['leadId'], score: 85, qualified: true };
  },
};

// HR Tools
export const getEmployeeTool: ToolDefinition = {
  name: 'get_employee',
  description: 'Get employee information',
  inputSchema: {
    type: 'object',
    properties: {
      employeeId: { type: 'string' },
      email: { type: 'string' },
    },
    anyOf: [{ required: ['employeeId'] }, { required: ['email'] }],
  },
  databases: ['sm_hr'],
  async handler(input, context) {
    return { employeeId: input['employeeId'], name: 'John Doe', department: 'Sales' };
  },
};

export const requestLeaveTool: ToolDefinition = {
  name: 'request_leave',
  description: 'Submit a leave request for an employee',
  inputSchema: {
    type: 'object',
    properties: {
      employeeId: { type: 'string' },
      leaveType: { type: 'string', enum: ['VACATION', 'SICK', 'PERSONAL', 'OTHER'] },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      reason: { type: 'string' },
    },
    required: ['employeeId', 'leaveType', 'startDate', 'endDate'],
  },
  databases: ['sm_hr'],
  async handler(input, context) {
    return { requestId: 'LR-12345', status: 'PENDING_APPROVAL' };
  },
};

// Tickets/Support Tools
export const createTicketTool: ToolDefinition = {
  name: 'create_ticket',
  description: 'Create a support ticket',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      category: { type: 'string' },
      requesterId: { type: 'string' },
    },
    required: ['title', 'description', 'priority'],
  },
  databases: ['sm_tickets'],
  async handler(input, context) {
    return { ticketId: 'TKT-12345', status: 'OPEN' };
  },
};

export const getTicketTool: ToolDefinition = {
  name: 'get_ticket',
  description: 'Get ticket details by ID',
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: { type: 'string', description: 'Ticket ID' },
    },
    required: ['ticketId'],
  },
  databases: ['sm_tickets'],
  async handler(input, context) {
    return { ticketId: input['ticketId'], status: 'OPEN', priority: 'MEDIUM', assignee: 'IT_SUPPORT' };
  },
};

export const assignTicketTool: ToolDefinition = {
  name: 'assign_ticket',
  description: 'Assign or reassign a ticket to a technician',
  inputSchema: {
    type: 'object',
    properties: {
      ticketId: { type: 'string' },
      assignee: { type: 'string' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
      escalationReason: { type: 'string' },
    },
    required: ['ticketId', 'assignee'],
  },
  databases: ['sm_tickets'],
  async handler(input, context) {
    return { ticketId: input['ticketId'], assignee: input['assignee'], status: 'ASSIGNED' };
  },
};

export const getUserDevicesTool: ToolDefinition = {
  name: 'get_user_devices',
  description: 'Get devices assigned to an employee',
  inputSchema: {
    type: 'object',
    properties: {
      employeeId: { type: 'string' },
    },
    required: ['employeeId'],
  },
  databases: ['sm_inventory', 'sm_techteam'],
  async handler(input, context) {
    return {
      employeeId: input['employeeId'],
      devices: [
        { type: 'LAPTOP', model: 'Dell Latitude', serialNumber: 'DL123456' },
        { type: 'MONITOR', model: 'Dell 27"', serialNumber: 'DM789012' },
      ]
    };
  },
};

export const resetPasswordTool: ToolDefinition = {
  name: 'reset_password',
  description: 'Reset user password (requires verification)',
  inputSchema: {
    type: 'object',
    properties: {
      employeeId: { type: 'string' },
      verificationMethod: { type: 'string', enum: ['SMS', 'EMAIL', 'SECURITY_QUESTION'] },
    },
    required: ['employeeId'],
  },
  databases: ['sm_global', 'sm_techteam'],
  async handler(input, context) {
    return { success: true, temporaryPassword: '[GENERATED]', expiresIn: '24h' };
  },
};

// HR Additional Tools
export const searchEmployeesTool: ToolDefinition = {
  name: 'search_employees',
  description: 'Search employees by name, department, or role',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      department: { type: 'string' },
      role: { type: 'string' },
      limit: { type: 'number', default: 20 },
    },
    required: ['query'],
  },
  databases: ['sm_hr'],
  async handler(input, context) {
    return { results: [], total: 0 };
  },
};

export const getPayslipTool: ToolDefinition = {
  name: 'get_payslip',
  description: 'Get employee payslip for a specific period',
  inputSchema: {
    type: 'object',
    properties: {
      employeeId: { type: 'string' },
      period: { type: 'string', description: 'YYYY-MM format' },
    },
    required: ['employeeId', 'period'],
  },
  databases: ['sm_hr'],
  async handler(input, context) {
    return {
      employeeId: input['employeeId'],
      period: input['period'],
      grossSalary: 3500,
      netSalary: 2800,
      deductions: { irpf: 500, ss: 200 }
    };
  },
};

export const getBenefitsTool: ToolDefinition = {
  name: 'get_benefits',
  description: 'Get employee benefits information',
  inputSchema: {
    type: 'object',
    properties: {
      employeeId: { type: 'string' },
    },
    required: ['employeeId'],
  },
  databases: ['sm_hr'],
  async handler(input, context) {
    return {
      employeeId: input['employeeId'],
      benefits: [
        { type: 'HEALTH_INSURANCE', status: 'ACTIVE' },
        { type: 'PENSION_PLAN', status: 'ACTIVE', contribution: 3 },
        { type: 'MEAL_VOUCHERS', status: 'ACTIVE', monthlyAmount: 150 },
      ]
    };
  },
};

// Finance Tools
export const getAccountTool: ToolDefinition = {
  name: 'get_account',
  description: 'Get accounting account details and balance',
  inputSchema: {
    type: 'object',
    properties: {
      accountCode: { type: 'string', description: 'Account code (e.g., 4300)' },
      period: { type: 'string', description: 'Period in YYYY-MM format' },
    },
    required: ['accountCode'],
  },
  databases: ['sm_accounting'],
  async handler(input, context) {
    return {
      accountCode: input['accountCode'],
      name: 'Clientes',
      balance: 125000.00,
      currency: 'EUR'
    };
  },
};

export const getBalanceTool: ToolDefinition = {
  name: 'get_balance',
  description: 'Get balance sheet or account balance',
  inputSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['TREASURY', 'ACCOUNT', 'BALANCE_SHEET'] },
      accountCode: { type: 'string' },
      date: { type: 'string', format: 'date' },
    },
    required: ['type'],
  },
  databases: ['sm_accounting', 'sf_finance'],
  async handler(input, context) {
    return { type: input['type'], balance: 500000.00, date: new Date().toISOString() };
  },
};

export const getInvoiceTool: ToolDefinition = {
  name: 'get_invoice',
  description: 'Get invoice details',
  inputSchema: {
    type: 'object',
    properties: {
      invoiceNumber: { type: 'string' },
      invoiceId: { type: 'string' },
    },
    anyOf: [{ required: ['invoiceNumber'] }, { required: ['invoiceId'] }],
  },
  databases: ['sm_accounting'],
  async handler(input, context) {
    return {
      invoiceNumber: input['invoiceNumber'] || 'FAC-2026-0001',
      amount: 1500.00,
      status: 'PENDING',
      dueDate: '2026-02-15'
    };
  },
};

export const createPaymentTool: ToolDefinition = {
  name: 'create_payment',
  description: 'Create a payment order',
  inputSchema: {
    type: 'object',
    properties: {
      beneficiary: { type: 'string' },
      amount: { type: 'number' },
      concept: { type: 'string' },
      invoiceNumber: { type: 'string' },
      executionDate: { type: 'string', format: 'date' },
    },
    required: ['beneficiary', 'amount', 'concept'],
  },
  databases: ['sm_accounting', 'sf_finance'],
  async handler(input, context) {
    return { paymentId: 'PAY-2026-0001', status: 'PENDING_APPROVAL', amount: input['amount'] };
  },
};

export const getCashFlowTool: ToolDefinition = {
  name: 'get_cash_flow',
  description: 'Get cash flow forecast',
  inputSchema: {
    type: 'object',
    properties: {
      forecastDays: { type: 'number', default: 30 },
    },
  },
  databases: ['sf_finance', 'sm_accounting'],
  async handler(input, context) {
    return {
      currentBalance: 850000.00,
      expectedInflows: 120000.00,
      expectedOutflows: 95000.00,
      forecastDays: input['forecastDays'] || 30
    };
  },
};

// Compliance Tools
export const checkConsentTool: ToolDefinition = {
  name: 'check_consent',
  description: 'Check consent status for a client',
  inputSchema: {
    type: 'object',
    properties: {
      clientId: { type: 'string' },
      consentType: { type: 'string', enum: ['MARKETING', 'THIRD_PARTY', 'PROFILING', 'ALL'] },
    },
    required: ['clientId'],
  },
  databases: ['sm_compliance', 'sm_global'],
  async handler(input, context) {
    return {
      clientId: input['clientId'],
      consents: [
        { type: 'MARKETING', granted: true, date: '2025-06-15' },
        { type: 'THIRD_PARTY', granted: false, date: null },
        { type: 'PROFILING', granted: true, date: '2025-06-15' },
      ]
    };
  },
};

export const getDataSubjectTool: ToolDefinition = {
  name: 'get_data_subject',
  description: 'Get data subject information for GDPR requests',
  inputSchema: {
    type: 'object',
    properties: {
      identifier: { type: 'string', description: 'NIF, email, or client ID' },
    },
    required: ['identifier'],
  },
  databases: ['sm_compliance', 'sm_global'],
  async handler(input, context) {
    return {
      identifier: input['identifier'],
      dataCategories: ['IDENTITY', 'CONTACT', 'FINANCIAL', 'INSURANCE'],
      processingActivities: ['CONTRACT_EXECUTION', 'LEGAL_OBLIGATION', 'MARKETING'],
      retentionPeriods: { general: '10 years', marketing: '3 years' }
    };
  },
};

export const logAuditTool: ToolDefinition = {
  name: 'log_audit',
  description: 'Log an audit event',
  inputSchema: {
    type: 'object',
    properties: {
      eventType: { type: 'string' },
      severity: { type: 'string', enum: ['INFO', 'WARNING', 'CRITICAL'] },
      details: { type: 'object' },
      timestamp: { type: 'string' },
      agentId: { type: 'string' },
    },
    required: ['eventType', 'details'],
  },
  databases: ['sm_audit'],
  async handler(input, context) {
    return { auditId: 'AUD-2026-0001', logged: true };
  },
};

export const getComplianceStatusTool: ToolDefinition = {
  name: 'get_compliance_status',
  description: 'Get compliance status for an entity or process',
  inputSchema: {
    type: 'object',
    properties: {
      entityType: { type: 'string', enum: ['CLIENT', 'MEDIATOR', 'PROCESS', 'SYSTEM'] },
      entityId: { type: 'string' },
      complianceArea: { type: 'string', enum: ['GDPR', 'IDD', 'PBC', 'ALL'] },
    },
    required: ['entityType', 'entityId'],
  },
  databases: ['sm_compliance'],
  async handler(input, context) {
    return {
      entityType: input['entityType'],
      entityId: input['entityId'],
      status: 'COMPLIANT',
      lastAudit: '2025-12-01',
      nextAudit: '2026-06-01',
      openIssues: 0
    };
  },
};

// Legal Tools
export const getContractTool: ToolDefinition = {
  name: 'get_contract',
  description: 'Get contract details',
  inputSchema: {
    type: 'object',
    properties: {
      contractId: { type: 'string' },
      contractNumber: { type: 'string' },
    },
    anyOf: [{ required: ['contractId'] }, { required: ['contractNumber'] }],
  },
  databases: ['sm_legal'],
  async handler(input, context) {
    return {
      contractId: input['contractId'] || 'CTR-001',
      type: 'MEDIATION',
      counterparty: 'Aseguradora XYZ',
      status: 'ACTIVE',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      autoRenewal: true
    };
  },
};

export const searchLegalDocsTool: ToolDefinition = {
  name: 'search_legal_docs',
  description: 'Search legal documents',
  inputSchema: {
    type: 'object',
    properties: {
      documentType: { type: 'string', enum: ['CONTRACT', 'POWER', 'LAWSUIT', 'DEED', 'ALL'] },
      counterparty: { type: 'string' },
      dateFrom: { type: 'string', format: 'date' },
      dateTo: { type: 'string', format: 'date' },
      query: { type: 'string' },
    },
  },
  databases: ['sm_legal', 'sm_documents'],
  async handler(input, context) {
    return { results: [], total: 0 };
  },
};

export const createLegalCaseTool: ToolDefinition = {
  name: 'create_legal_case',
  description: 'Create a new legal case',
  inputSchema: {
    type: 'object',
    properties: {
      caseType: { type: 'string', enum: ['CLAIM', 'LAWSUIT', 'ARBITRATION', 'MEDIATION', 'CONSULTATION'] },
      title: { type: 'string' },
      description: { type: 'string' },
      counterparty: { type: 'string' },
      amount: { type: 'number' },
      priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
    },
    required: ['caseType', 'title', 'description'],
  },
  databases: ['sm_legal'],
  async handler(input, context) {
    return {
      caseId: 'CASE-2026-0001',
      caseNumber: 'LEG-2026-0001',
      status: 'OPEN',
      assignedTo: 'LEGAL_TEAM'
    };
  },
};

// Export all tools
export const databaseTools: ToolDefinition[] = [
  // Party/Client Tools
  getPartyTool,
  searchPartiesTool,
  // Policy Tools
  getPolicyTool,
  searchPoliciesTool,
  createQuoteTool,
  // Claims Tools
  getClaimTool,
  createClaimTool,
  updateClaimStatusTool,
  // Communication Tools
  sendEmailTool,
  sendSmsTool,
  sendWhatsAppTool,
  // Document Tools
  getDocumentTool,
  searchDocumentsTool,
  generateDocumentTool,
  // Workflow Tools
  startWorkflowTool,
  getWorkflowStatusTool,
  // Analytics Tools
  getCustomerScoreTool,
  getSegmentTool,
  // Leads Tools
  createLeadTool,
  qualifyLeadTool,
  // HR Tools
  getEmployeeTool,
  searchEmployeesTool,
  getPayslipTool,
  getBenefitsTool,
  requestLeaveTool,
  // IT Support Tools
  createTicketTool,
  getTicketTool,
  assignTicketTool,
  getUserDevicesTool,
  resetPasswordTool,
  // Finance Tools
  getAccountTool,
  getBalanceTool,
  getInvoiceTool,
  createPaymentTool,
  getCashFlowTool,
  // Compliance Tools
  checkConsentTool,
  getDataSubjectTool,
  logAuditTool,
  getComplianceStatusTool,
  // Legal Tools
  getContractTool,
  searchLegalDocsTool,
  createLegalCaseTool,
];
