-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "companyId" TEXT,
    "avatar" TEXT,
    "preferences" JSONB,
    "settings" JSONB,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "deviceInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Party" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "partyType" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "legalName" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "primaryPhone" TEXT,
    "primaryEmail" TEXT,
    "primaryAddress" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "maritalStatus" TEXT,
    "nationality" TEXT,
    "educationLevel" TEXT,
    "profession" TEXT,
    "monthlyIncome" DOUBLE PRECISION,
    "incomeLevel" TEXT,
    "employmentStatus" TEXT,
    "healthScore" INTEGER,
    "riskScore" INTEGER,
    "loyaltyScore" INTEGER,
    "segment" TEXT,
    "aiPsychographicProfile" JSONB,
    "aiPaymentCapacity" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Party_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "policyNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "premium" DOUBLE PRECISION,
    "companyId" TEXT,
    "holderPartyId" TEXT,
    "insurer" TEXT,
    "riskLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "policyId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "companyId" TEXT,
    "fraudScore" INTEGER,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "agentName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "input" TEXT NOT NULL,
    "output" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "eventType" TEXT NOT NULL,
    "source" TEXT,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "participationPct" DOUBLE PRECISION,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ES',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "fiscalYearStart" TEXT NOT NULL DEFAULT '01-01',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "accountingPlan" TEXT NOT NULL DEFAULT 'PGC_2007',
    "taxRegime" TEXT,
    "logo" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "theme" JSONB,
    "settings" JSONB,
    "features" TEXT[],
    "tenantId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "sourceCompanyId" TEXT,
    "targetCompanyId" TEXT,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "automatic" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intercompany_transactions" (
    "id" TEXT NOT NULL,
    "sourceCompanyId" TEXT NOT NULL,
    "targetCompanyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "date" TIMESTAMP(3) NOT NULL,
    "sourceAccountId" TEXT,
    "targetAccountId" TEXT,
    "eliminated" BOOLEAN NOT NULL DEFAULT false,
    "eliminationDate" TIMESTAMP(3),
    "eliminationNote" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intercompany_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consolidation_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "companies" JSONB NOT NULL,
    "consolidatedBalance" JSONB NOT NULL,
    "consolidatedPL" JSONB NOT NULL,
    "eliminations" JSONB NOT NULL,
    "adjustments" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "auditedBy" TEXT,
    "auditDate" TIMESTAMP(3),
    "auditReport" TEXT,
    "pdfUrl" TEXT,
    "xlsxUrl" TEXT,
    "xbrlUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "consolidation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactInformation" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EconomicSituation" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "monthlyIncome" DOUBLE PRECISION,
    "annualIncome" DOUBLE PRECISION,
    "incomeSource" TEXT,
    "incomeLevel" TEXT,
    "economicCapacity" TEXT,
    "incomeBreakdown" JSONB,
    "estimatedExpenses" JSONB,
    "debts" JSONB,
    "creditScore" INTEGER,
    "creditRiskLevel" TEXT,
    "paymentBehavior" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EconomicSituation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaborSituation" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "employmentStatus" TEXT,
    "profession" TEXT,
    "company" TEXT,
    "position" TEXT,
    "sector" TEXT,
    "startDate" TIMESTAMP(3),
    "seniority" INTEGER,
    "contractType" TEXT,
    "workSchedule" TEXT,
    "workLocation" TEXT,
    "previousJobs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaborSituation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialData" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "bankAccounts" JSONB,
    "creditCards" JSONB,
    "preferredPaymentMethod" TEXT,
    "paymentHistory" JSONB,
    "creditLimit" DOUBLE PRECISION,
    "currentBalance" DOUBLE PRECISION,
    "sorisBalance" DOUBLE PRECISION,
    "averagePaymentDelay" INTEGER,
    "defaultRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "age" INTEGER,
    "gender" TEXT,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "isDependant" BOOLEAN NOT NULL DEFAULT false,
    "dependencyLevel" TEXT,
    "sharedPolicies" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hobby" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "interestLevel" TEXT,
    "frequency" TEXT,
    "practicing" BOOLEAN NOT NULL DEFAULT true,
    "since" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "policyId" TEXT,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "licensePlate" TEXT,
    "vin" TEXT,
    "fuelType" TEXT,
    "color" TEXT,
    "kilometers" INTEGER,
    "transmission" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "lastValuationDate" TIMESTAMP(3),
    "financedBy" TEXT,
    "remainingDebt" DOUBLE PRECISION,
    "monthlyPayment" DOUBLE PRECISION,
    "usage" TEXT,
    "parkingLocation" TEXT,
    "photos" TEXT[],
    "documents" JSONB,
    "maintenanceHistory" JSONB,
    "nextMaintenanceDate" TIMESTAMP(3),
    "nextItvDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "policyId" TEXT,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "postalCode" TEXT,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'ES',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cadastralReference" TEXT,
    "registryNumber" TEXT,
    "surface" DOUBLE PRECISION,
    "rooms" INTEGER,
    "bathrooms" INTEGER,
    "floor" TEXT,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "hasGarage" BOOLEAN NOT NULL DEFAULT false,
    "hasTerrace" BOOLEAN NOT NULL DEFAULT false,
    "hasGarden" BOOLEAN NOT NULL DEFAULT false,
    "hasPool" BOOLEAN NOT NULL DEFAULT false,
    "hasHeating" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
    "energyCertificate" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "estimatedValue" DOUBLE PRECISION,
    "cadastralValue" DOUBLE PRECISION,
    "lastValuationDate" TIMESTAMP(3),
    "ibiValue" DOUBLE PRECISION,
    "ownershipType" TEXT,
    "ownershipPercentage" DOUBLE PRECISION,
    "isMortgaged" BOOLEAN NOT NULL DEFAULT false,
    "mortgageDetails" JSONB,
    "usage" TEXT,
    "isRented" BOOLEAN NOT NULL DEFAULT false,
    "rentalIncome" DOUBLE PRECISION,
    "tenants" JSONB,
    "photos" TEXT[],
    "documents" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Valuable" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "policyId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "certificateNumber" TEXT,
    "origin" TEXT,
    "manufacturer" TEXT,
    "year" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "purchaseLocation" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "lastAppraisalDate" TIMESTAMP(3),
    "appraisedBy" TEXT,
    "appraisalDocument" TEXT,
    "location" TEXT,
    "material" TEXT,
    "weight" DOUBLE PRECISION,
    "dimensions" TEXT,
    "condition" TEXT,
    "photos" TEXT[],
    "certificates" TEXT[],
    "documents" JSONB,
    "notes" TEXT,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Valuable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investment" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isin" TEXT,
    "ticker" TEXT,
    "entity" TEXT,
    "accountNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "lastUpdateDate" TIMESTAMP(3),
    "performance" DOUBLE PRECISION,
    "annualReturn" DOUBLE PRECISION,
    "dividends" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "riskCategory" TEXT,
    "maturityDate" TIMESTAMP(3),
    "liquidity" TEXT,
    "documents" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherAsset" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "photos" TEXT[],
    "documents" JSONB,
    "metadata" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isSymmetric" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelationshipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "fromPartyId" TEXT NOT NULL,
    "toPartyId" TEXT NOT NULL,
    "relationshipTypeId" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "degree" INTEGER,
    "sharedPolicies" JSONB,
    "sharedProducts" JSONB,
    "influenceScore" DOUBLE PRECISION,
    "description" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "since" TIMESTAMP(3),
    "until" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDocument" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "aiClassification" JSONB,
    "metadata" JSONB,
    "tags" TEXT[],
    "documentDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "sessionId" TEXT,
    "callerNumber" TEXT NOT NULL,
    "callerId" TEXT,
    "callerName" TEXT,
    "calledNumber" TEXT NOT NULL,
    "partyId" TEXT,
    "agentId" TEXT,
    "queueId" TEXT,
    "campaignId" TEXT,
    "direction" TEXT NOT NULL,
    "callType" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "answerTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "talkTime" INTEGER,
    "holdTime" INTEGER,
    "ringTime" INTEGER,
    "waitTime" INTEGER,
    "status" TEXT NOT NULL,
    "disposition" TEXT,
    "hangupCause" TEXT,
    "recordingUrl" TEXT,
    "recordingId" TEXT,
    "transcriptionId" TEXT,
    "summary" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "sentiment" TEXT,
    "aiTags" TEXT[],
    "aiInsights" JSONB,
    "ivrPath" JSONB,
    "transferredFrom" TEXT,
    "transferredTo" TEXT,
    "transferType" TEXT,
    "qualityScore" INTEGER,
    "qualityNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "companyId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_queues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "extension" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "agents" JSONB NOT NULL,
    "maxAgents" INTEGER NOT NULL DEFAULT 0,
    "maxWaitTime" INTEGER NOT NULL DEFAULT 300,
    "maxCallers" INTEGER NOT NULL DEFAULT 50,
    "memberTimeout" INTEGER NOT NULL DEFAULT 15,
    "retryDelay" INTEGER NOT NULL DEFAULT 5,
    "musicOnHold" TEXT,
    "announceFreq" INTEGER NOT NULL DEFAULT 30,
    "announceMessage" TEXT,
    "callbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "callbackThreshold" INTEGER NOT NULL DEFAULT 180,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "schedule" JSONB,
    "companyId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_statuses" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentCallId" TEXT,
    "extension" TEXT,
    "device" TEXT,
    "callsToday" INTEGER NOT NULL DEFAULT 0,
    "talkTimeToday" INTEGER NOT NULL DEFAULT 0,
    "lastCallAt" TIMESTAMP(3),
    "companyId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "contactListId" TEXT,
    "contacts" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '20:00',
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "retryInterval" INTEGER NOT NULL DEFAULT 60,
    "agents" TEXT[],
    "script" TEXT,
    "status" TEXT NOT NULL,
    "contactsTotal" INTEGER NOT NULL DEFAULT 0,
    "contactsCalled" INTEGER NOT NULL DEFAULT 0,
    "contactsReached" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ivr_menus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "greeting" TEXT NOT NULL,
    "timeout" INTEGER NOT NULL DEFAULT 5,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "options" JSONB NOT NULL,
    "audioUrl" TEXT,
    "ttsText" TEXT,
    "ttsVoice" TEXT,
    "defaultAction" TEXT,
    "defaultTarget" TEXT,
    "companyId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ivr_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voicemails" (
    "id" TEXT NOT NULL,
    "mailbox" TEXT NOT NULL,
    "callerNumber" TEXT NOT NULL,
    "callerName" TEXT,
    "duration" INTEGER NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "transcription" TEXT,
    "userId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "smsSent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voicemails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_recordings" (
    "id" TEXT NOT NULL,
    "callId" TEXT,
    "externalCallId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER,
    "duration" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'wav',
    "codec" TEXT,
    "channels" INTEGER NOT NULL DEFAULT 1,
    "sampleRate" INTEGER NOT NULL DEFAULT 8000,
    "callerNumber" TEXT,
    "calledNumber" TEXT,
    "agentId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storagePath" TEXT,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "retentionDays" INTEGER NOT NULL DEFAULT 365,
    "expiresAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_transcriptions" (
    "id" TEXT NOT NULL,
    "callId" TEXT,
    "recordingId" TEXT,
    "text" TEXT NOT NULL,
    "segments" JSONB,
    "language" TEXT NOT NULL DEFAULT 'es-ES',
    "confidence" DOUBLE PRECISION,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processingTime" INTEGER,
    "errorMessage" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "sentiment" TEXT,
    "emotions" JSONB,
    "keywords" TEXT[],
    "topics" TEXT[],
    "speakers" JSONB,
    "summary" TEXT,
    "actionItems" TEXT[],
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_transcriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "totalCalls" INTEGER NOT NULL DEFAULT 0,
    "inboundCalls" INTEGER NOT NULL DEFAULT 0,
    "outboundCalls" INTEGER NOT NULL DEFAULT 0,
    "answeredCalls" INTEGER NOT NULL DEFAULT 0,
    "missedCalls" INTEGER NOT NULL DEFAULT 0,
    "abandonedCalls" INTEGER NOT NULL DEFAULT 0,
    "totalTalkTime" INTEGER NOT NULL DEFAULT 0,
    "avgTalkTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalWaitTime" INTEGER NOT NULL DEFAULT 0,
    "avgWaitTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalHoldTime" INTEGER NOT NULL DEFAULT 0,
    "avgHoldTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "serviceLevel" DOUBLE PRECISION,
    "firstCallResolution" DOUBLE PRECISION,
    "avgSpeedAnswer" DOUBLE PRECISION,
    "avgHandleTime" DOUBLE PRECISION,
    "abandonRate" DOUBLE PRECISION,
    "avgQualityScore" DOUBLE PRECISION,
    "avgSentiment" DOUBLE PRECISION,
    "activeAgents" INTEGER DEFAULT 0,
    "avgOccupancy" DOUBLE PRECISION,
    "csat" DOUBLE PRECISION,
    "nps" DOUBLE PRECISION,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dialer_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "schedule" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "retryInterval" INTEGER NOT NULL DEFAULT 60,
    "retryOnBusy" BOOLEAN NOT NULL DEFAULT true,
    "retryOnNoAnswer" BOOLEAN NOT NULL DEFAULT true,
    "callsPerAgent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "minCallGap" INTEGER NOT NULL DEFAULT 1,
    "maxCallGap" INTEGER NOT NULL DEFAULT 10,
    "amdEnabled" BOOLEAN NOT NULL DEFAULT true,
    "amdSensitivity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "amdAction" TEXT NOT NULL DEFAULT 'HANGUP',
    "maxAbandonRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "autoAdjust" BOOLEAN NOT NULL DEFAULT true,
    "callbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "callbackOnNoAnswer" BOOLEAN NOT NULL DEFAULT false,
    "callbackOnBusy" BOOLEAN NOT NULL DEFAULT false,
    "excludeNumbers" TEXT[],
    "excludePrefixes" TEXT[],
    "onlyPrefixes" TEXT[],
    "dnc" BOOLEAN NOT NULL DEFAULT true,
    "tcpaCompliant" BOOLEAN NOT NULL DEFAULT true,
    "gdprCompliant" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "dialer_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "topic" TEXT,
    "intent" TEXT,
    "expertDomain" TEXT,
    "productType" TEXT,
    "occidentProduct" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "contextData" JSONB,
    "satisfactionScore" INTEGER,
    "wasHelpful" BOOLEAN,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "tokenCount" INTEGER,
    "model" TEXT,
    "detectedIntent" TEXT,
    "entities" JSONB,
    "sentiment" TEXT,
    "confidence" DOUBLE PRECISION,
    "knowledgeSources" JSONB,
    "citationCount" INTEGER NOT NULL DEFAULT 0,
    "contextUsed" JSONB,
    "wasAccurate" BOOLEAN,
    "needsClarification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base_articles" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "occidentProducts" TEXT[],
    "insuranceTypes" TEXT[],
    "erpModules" TEXT[],
    "erpFeatures" TEXT[],
    "keywords" TEXT[],
    "tags" TEXT[],
    "embedding" JSONB,
    "embeddingModel" TEXT,
    "isRegulatory" BOOLEAN NOT NULL DEFAULT false,
    "regulationRef" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "authorId" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_base_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_feedbacks" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "category" TEXT,
    "expectedAnswer" TEXT,
    "actuallyNeeded" TEXT,
    "suggestion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_intents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "patterns" TEXT[],
    "keywords" TEXT[],
    "requiredEntities" TEXT[],
    "optionalEntities" TEXT[],
    "hasAutoResponse" BOOLEAN NOT NULL DEFAULT false,
    "responseTemplate" TEXT,
    "actions" JSONB,
    "knowledgeArticles" TEXT[],
    "detectCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "avgConfidence" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_analytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "totalConversations" INTEGER NOT NULL DEFAULT 0,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "activeUsers" INTEGER NOT NULL DEFAULT 0,
    "segurosQueries" INTEGER NOT NULL DEFAULT 0,
    "occidentQueries" INTEGER NOT NULL DEFAULT 0,
    "erpQueries" INTEGER NOT NULL DEFAULT 0,
    "generalQueries" INTEGER NOT NULL DEFAULT 0,
    "topIntents" JSONB,
    "avgSatisfaction" DOUBLE PRECISION,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "notHelpfulCount" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTime" DOUBLE PRECISION,
    "avgTokensUsed" DOUBLE PRECISION,
    "resolvedCount" INTEGER NOT NULL DEFAULT 0,
    "unresolvedCount" INTEGER NOT NULL DEFAULT 0,
    "resolutionRate" DOUBLE PRECISION,
    "articlesUsed" INTEGER NOT NULL DEFAULT 0,
    "avgArticlesPerResponse" DOUBLE PRECISION,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SORIS',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "frozenBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxBalance" DOUBLE PRECISION,
    "minBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "lastConversionUpdate" TIMESTAMP(3),
    "pointsExpire" BOOLEAN NOT NULL DEFAULT false,
    "expirationDays" INTEGER,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpired" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "suspendedReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "transferToWalletId" TEXT,
    "transferFromWalletId" TEXT,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "expiredAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT true,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" TIMESTAMP(3),
    "reversalTransactionId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversion_rates" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL DEFAULT 'SORIS',
    "toCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "rate" DOUBLE PRECISION NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'GLOBAL',
    "scopeId" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "setBy" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversion_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" TEXT NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "partyId" TEXT,
    "clientWalletId" TEXT,
    "clientAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "agencyWalletId" TEXT,
    "agencyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occidentWalletId" TEXT,
    "occidentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSoris" DOUBLE PRECISION NOT NULL,
    "totalEuros" DOUBLE PRECISION NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "discountedAmount" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "cancelledBy" TEXT,
    "refundedBy" TEXT,
    "cancellationReason" TEXT,
    "refundReason" TEXT,
    "transactionIds" TEXT[],
    "metadata" JSONB,
    "notes" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "badge" TEXT,
    "rewardType" TEXT NOT NULL DEFAULT 'SORIS',
    "rewardAmount" DOUBLE PRECISION,
    "conditions" JSONB NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "requiresPrevious" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "unlockedCount" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievement_tiers" (
    "id" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "conditions" JSONB NOT NULL,
    "threshold" DOUBLE PRECISION,
    "icon" TEXT,
    "badge" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievement_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partyId" TEXT,
    "achievementId" TEXT NOT NULL,
    "currentTier" INTEGER NOT NULL DEFAULT 1,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxProgress" DOUBLE PRECISION,
    "progressPercent" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "unlockedAt" TIMESTAMP(3),
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" TIMESTAMP(3),
    "rewardAmount" DOUBLE PRECISION,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "rewardType" TEXT NOT NULL DEFAULT 'SORIS',
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "bonusReward" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "targetUserIds" TEXT[],
    "targetRoles" TEXT[],
    "icon" TEXT,
    "image" TEXT,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "participantsCount" INTEGER NOT NULL DEFAULT 0,
    "completedCount" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_missions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partyId" TEXT,
    "missionId" TEXT NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetProgress" DOUBLE PRECISION NOT NULL,
    "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rewardAmount" DOUBLE PRECISION NOT NULL,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "rewardClaimedAt" TIMESTAMP(3),
    "events" JSONB,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "partyId" TEXT,
    "userName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "secondaryScore" DOUBLE PRECISION,
    "rank" INTEGER NOT NULL,
    "previousRank" INTEGER,
    "rankChange" INTEGER,
    "metadata" JSONB,
    "badge" TEXT,
    "reward" DOUBLE PRECISION,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gamification_settings" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultConversionRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxDailyEarnings" DOUBLE PRECISION,
    "maxMonthlyEarnings" DOUBLE PRECISION,
    "maxWalletBalance" DOUBLE PRECISION,
    "pointsExpire" BOOLEAN NOT NULL DEFAULT false,
    "expirationDays" INTEGER NOT NULL DEFAULT 365,
    "commissionToClientPercent" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "commissionToAgencyPercent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "commissionToOccidentPercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "achievementsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "missionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "leaderboardsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "discountsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnEarn" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSpend" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnExpire" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnAchievement" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "gamification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_consultations" (
    "id" TEXT NOT NULL,
    "partyId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "consultationType" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "context" JSONB,
    "aiResponse" TEXT NOT NULL,
    "aiAnalysis" JSONB,
    "aiModel" TEXT,
    "legalBases" JSONB,
    "regulations" TEXT[],
    "riskLevel" TEXT,
    "riskFactors" JSONB,
    "recommendations" TEXT[],
    "nextSteps" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "caseId" TEXT,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "parties" JSONB NOT NULL,
    "counterparty" TEXT,
    "content" TEXT NOT NULL,
    "clauses" JSONB,
    "annexes" JSONB,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "riskScore" INTEGER,
    "riskLevel" TEXT,
    "riskFactors" JSONB,
    "problematicClauses" JSONB,
    "suggestions" JSONB,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "signedDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "renewalPeriod" INTEGER,
    "renewalNotice" INTEGER,
    "nextRenewalDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentTerms" JSONB,
    "deadlines" JSONB,
    "obligations" JSONB,
    "terminationClauses" JSONB,
    "canTerminate" BOOLEAN NOT NULL DEFAULT true,
    "terminationNotice" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "statusReason" TEXT,
    "approvals" JSONB,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "signedBy" JSONB,
    "signatureMethod" TEXT,
    "fileUrl" TEXT,
    "signedFileUrl" TEXT,
    "attachments" TEXT[],
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertDays" INTEGER[] DEFAULT ARRAY[30, 15, 7, 1]::INTEGER[],
    "caseId" TEXT,
    "createdBy" TEXT,
    "modifiedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_reviews" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "reviewType" TEXT NOT NULL,
    "aiAnalysis" JSONB NOT NULL,
    "aiModel" TEXT,
    "overallScore" INTEGER NOT NULL,
    "recommendation" TEXT NOT NULL,
    "risks" JSONB NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "criticalIssues" TEXT[],
    "compliance" JSONB,
    "nonCompliant" TEXT[],
    "missingClauses" TEXT[],
    "ambiguousClauses" TEXT[],
    "favorableClauses" TEXT[],
    "unfavorableClauses" TEXT[],
    "recommendations" JSONB NOT NULL,
    "suggestedChanges" JSONB,
    "benchmarkScore" DOUBLE PRECISION,
    "marketAnalysis" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "legalArea" TEXT NOT NULL,
    "plaintiff" JSONB,
    "defendant" JSONB,
    "otherParties" JSONB,
    "ourRole" TEXT,
    "internalLawyer" TEXT,
    "externalLawyer" JSONB,
    "lawFirm" TEXT,
    "court" TEXT,
    "jurisdiction" TEXT,
    "judge" TEXT,
    "filingDate" TIMESTAMP(3),
    "trialDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "deadlines" JSONB NOT NULL,
    "nextDeadline" TIMESTAMP(3),
    "claimAmount" DOUBLE PRECISION,
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "successProbability" DOUBLE PRECISION,
    "riskAssessment" JSONB,
    "aiAnalysis" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "phase" TEXT,
    "outcome" TEXT,
    "settlement" JSONB,
    "judgment" TEXT,
    "documents" TEXT[],
    "evidence" JSONB,
    "strategy" TEXT,
    "keyArguments" TEXT[],
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "legal_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_advices" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "summary" TEXT,
    "analysis" JSONB,
    "legalBasis" JSONB,
    "references" TEXT[],
    "relatedCases" TEXT[],
    "jurisprudence" JSONB,
    "aiModel" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "helpful" BOOLEAN,
    "rating" INTEGER,
    "feedback" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_advices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_models" (
    "id" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "modelType" TEXT,
    "modelName" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "taxId" TEXT NOT NULL,
    "nif" TEXT,
    "declarantName" TEXT NOT NULL,
    "companyName" TEXT,
    "data" JSONB,
    "modelData" JSONB,
    "xmlContent" TEXT,
    "taxableBase" DOUBLE PRECISION,
    "taxRate" DOUBLE PRECISION,
    "taxAmount" DOUBLE PRECISION,
    "deductions" DOUBLE PRECISION,
    "result" DOUBLE PRECISION,
    "outputVAT" JSONB,
    "inputVAT" JSONB,
    "retentions" JSONB,
    "operations" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submissionId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validatedAt" TIMESTAMP(3),
    "validationErrors" JSONB,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT,
    "aiSuggestions" JSONB,
    "xmlFile" TEXT,
    "pdfFile" TEXT,
    "createdBy" TEXT,
    "reviewedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_submissions" (
    "id" TEXT NOT NULL,
    "modelNumbers" TEXT[],
    "fiscalYear" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "certificateId" TEXT,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "csv" TEXT,
    "receiptNumber" TEXT,
    "aeAtResponse" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusMessage" TEXT,
    "errors" JSONB,
    "warnings" JSONB,
    "signedXml" TEXT,
    "receiptPdf" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastRetryAt" TIMESTAMP(3),
    "totalAmount" DOUBLE PRECISION,
    "paymentReference" TEXT,
    "paymentDeadline" TIMESTAMP(3),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_certificates" (
    "id" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerTaxId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FNMT',
    "usage" TEXT NOT NULL DEFAULT 'SIGNATURE',
    "p12File" TEXT,
    "p12FileSize" INTEGER,
    "p12Hash" TEXT,
    "passwordHash" TEXT NOT NULL,
    "passwordSalt" TEXT NOT NULL,
    "pemCertificate" TEXT,
    "pemPrivateKey" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "daysToExpire" INTEGER,
    "alertDays" INTEGER[] DEFAULT ARRAY[60, 30, 15, 7, 1]::INTEGER[],
    "lastAlertSent" TIMESTAMP(3),
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verificationMethod" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "fingerprint" TEXT,
    "algorithm" TEXT,
    "keySize" INTEGER,
    "uploadedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vat_reports" (
    "id" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "outputVATBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "outputVATAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inputVATBase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inputVATAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat21Base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat21Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat10Base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat10Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat4Base" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat4Amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "result" DOUBLE PRECISION NOT NULL,
    "toPayOrRefund" DOUBLE PRECISION NOT NULL,
    "operations" JSONB NOT NULL,
    "model303Id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generatedBy" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vat_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sii_records" (
    "id" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "operationDate" TIMESTAMP(3),
    "counterpartyTaxId" TEXT NOT NULL,
    "counterpartyName" TEXT NOT NULL,
    "counterpartyCountry" TEXT NOT NULL DEFAULT 'ES',
    "baseAmount" DOUBLE PRECISION NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "vatAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "operationType" TEXT NOT NULL,
    "description" TEXT,
    "siiStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "csv" TEXT,
    "aeAtResponse" JSONB,
    "errors" JSONB,
    "isModification" BOOLEAN NOT NULL DEFAULT false,
    "modifiesRecordId" TEXT,
    "createdBy" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sii_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_records" (
    "id" TEXT NOT NULL,
    "policyId" TEXT,
    "receiptId" TEXT,
    "agentId" TEXT,
    "partyId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "sorisGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sorisAmount" DOUBLE PRECISION,
    "sorisDistributed" JSONB,
    "metadata" JSONB,
    "notes" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_analyses" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "healthTrend" TEXT,
    "healthFactors" JSONB,
    "segment" TEXT NOT NULL,
    "segmentReason" TEXT,
    "previousSegment" TEXT,
    "ltv" DOUBLE PRECISION,
    "predictedLtv" DOUBLE PRECISION,
    "avgPolicyValue" DOUBLE PRECISION,
    "engagementScore" INTEGER,
    "loyaltyIndex" DOUBLE PRECISION,
    "lastInteraction" TIMESTAMP(3),
    "interactionFrequency" TEXT,
    "aiInsights" JSONB NOT NULL,
    "aiRecommendations" JSONB,
    "aiSummary" TEXT,
    "aiModel" TEXT,
    "riskFactors" TEXT[],
    "riskScore" INTEGER,
    "opportunityCount" INTEGER NOT NULL DEFAULT 0,
    "crossSellPotential" DOUBLE PRECISION,
    "upsellPotential" DOUBLE PRECISION,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisVersion" INTEGER NOT NULL DEFAULT 1,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opportunity_recommendations" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "productCode" TEXT,
    "productName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "priorityScore" INTEGER NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "expectedValue" DOUBLE PRECISION,
    "closeProbability" DOUBLE PRECISION NOT NULL,
    "closeReason" TEXT,
    "reasoning" TEXT NOT NULL,
    "insights" JSONB,
    "aiModel" TEXT,
    "bestContactTime" TEXT,
    "urgency" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "assignedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "statusReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "actualValue" DOUBLE PRECISION,
    "conversionRate" DOUBLE PRECISION,
    "contactAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverage_gaps" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "gapType" TEXT NOT NULL,
    "coverageType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "currentCoverage" JSONB,
    "recommendedCoverage" JSONB NOT NULL,
    "gap" JSONB NOT NULL,
    "potentialLoss" DOUBLE PRECISION,
    "recommendedValue" DOUBLE PRECISION,
    "priority" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL,
    "aiAnalysis" JSONB,
    "aiModel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "opportunityId" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverage_gaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churn_predictions" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "churnScore" INTEGER NOT NULL,
    "churnRisk" TEXT NOT NULL,
    "churnProbability" DOUBLE PRECISION NOT NULL,
    "trend" TEXT NOT NULL,
    "previousScore" INTEGER,
    "signals" JSONB NOT NULL,
    "signalCount" INTEGER NOT NULL DEFAULT 0,
    "topFactors" TEXT[],
    "factorsAnalysis" JSONB,
    "predictedChurnDate" TIMESTAMP(3),
    "timeToChurn" INTEGER,
    "confidenceLevel" DOUBLE PRECISION,
    "retentionStrategy" JSONB,
    "recommendedActions" TEXT[],
    "retentionPriority" TEXT NOT NULL,
    "aiAnalysis" JSONB NOT NULL,
    "aiModel" TEXT,
    "actionsStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "actionsTaken" JSONB,
    "actionsResult" TEXT,
    "wasRetained" BOOLEAN,
    "retainedAt" TIMESTAMP(3),
    "churned" BOOLEAN NOT NULL DEFAULT false,
    "churnedAt" TIMESTAMP(3),
    "alertSent" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" TIMESTAMP(3),
    "alertRecipients" TEXT[],
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "churn_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_proposals" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT,
    "partyId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "productCode" TEXT,
    "productName" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "currentSituation" TEXT NOT NULL,
    "proposedSolution" TEXT NOT NULL,
    "valueProposition" TEXT NOT NULL,
    "premium" DOUBLE PRECISION,
    "coverage" JSONB,
    "pricing" JSONB NOT NULL,
    "discounts" JSONB,
    "comparison" JSONB,
    "benefits" TEXT[],
    "differentiators" TEXT[],
    "terms" JSONB,
    "validity" TIMESTAMP(3),
    "personalization" JSONB,
    "tone" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT true,
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "generationTime" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "pdfUrl" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "viewedAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "feedback" TEXT,
    "assignedToId" TEXT,
    "createdBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_intelligence_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT,
    "clientsAnalyzed" INTEGER NOT NULL DEFAULT 0,
    "avgHealthScore" DOUBLE PRECISION,
    "clientsBySegment" JSONB,
    "opportunitiesGenerated" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesWon" INTEGER NOT NULL DEFAULT 0,
    "opportunitiesLost" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION,
    "avgCloseProbability" DOUBLE PRECISION,
    "totalOpportunityValue" DOUBLE PRECISION,
    "actualRevenue" DOUBLE PRECISION,
    "gapsIdentified" INTEGER NOT NULL DEFAULT 0,
    "gapsResolved" INTEGER NOT NULL DEFAULT 0,
    "criticalGaps" INTEGER NOT NULL DEFAULT 0,
    "clientsAtRisk" INTEGER NOT NULL DEFAULT 0,
    "criticalChurnRisk" INTEGER NOT NULL DEFAULT 0,
    "clientsRetained" INTEGER NOT NULL DEFAULT 0,
    "clientsChurned" INTEGER NOT NULL DEFAULT 0,
    "retentionRate" DOUBLE PRECISION,
    "proposalsGenerated" INTEGER NOT NULL DEFAULT 0,
    "proposalsSent" INTEGER NOT NULL DEFAULT 0,
    "proposalsAccepted" INTEGER NOT NULL DEFAULT 0,
    "proposalAcceptanceRate" DOUBLE PRECISION,
    "avgAiResponseTime" DOUBLE PRECISION,
    "aiApiCalls" INTEGER NOT NULL DEFAULT 0,
    "aiTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "aiCost" DOUBLE PRECISION,
    "crossSellRate" DOUBLE PRECISION,
    "upsellRate" DOUBLE PRECISION,
    "avgDealSize" DOUBLE PRECISION,
    "avgSalesCycle" INTEGER,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_intelligence_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "taxBase" DOUBLE PRECISION NOT NULL,
    "taxRate" DOUBLE PRECISION NOT NULL,
    "taxAmount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "siiSent" BOOLEAN NOT NULL DEFAULT false,
    "siiStatus" TEXT,
    "siiCsv" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payrollMonth" TIMESTAMP(3) NOT NULL,
    "grossSalary" DOUBLE PRECISION NOT NULL,
    "retentionAmount" DOUBLE PRECISION NOT NULL,
    "retentionRate" DOUBLE PRECISION NOT NULL,
    "netSalary" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sii_submissions" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "submissionType" TEXT NOT NULL,
    "invoiceIds" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "csv" TEXT,
    "responseData" JSONB,
    "errorMessage" TEXT,
    "submittedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sii_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Party_companyId_idx" ON "Party"("companyId");

-- CreateIndex
CREATE INDEX "Party_documentNumber_idx" ON "Party"("documentNumber");

-- CreateIndex
CREATE INDEX "Party_primaryEmail_idx" ON "Party"("primaryEmail");

-- CreateIndex
CREATE INDEX "Party_segment_idx" ON "Party"("segment");

-- CreateIndex
CREATE INDEX "Policy_companyId_idx" ON "Policy"("companyId");

-- CreateIndex
CREATE INDEX "Policy_policyNumber_idx" ON "Policy"("policyNumber");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Claim_companyId_idx" ON "Claim"("companyId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_fraudScore_idx" ON "Claim"("fraudScore");

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_taxId_key" ON "companies"("taxId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_tenantId_key" ON "companies"("tenantId");

-- CreateIndex
CREATE INDEX "companies_parentId_idx" ON "companies"("parentId");

-- CreateIndex
CREATE INDEX "companies_tenantId_idx" ON "companies"("tenantId");

-- CreateIndex
CREATE INDEX "companies_taxId_idx" ON "companies"("taxId");

-- CreateIndex
CREATE INDEX "consolidation_rules_sourceCompanyId_idx" ON "consolidation_rules"("sourceCompanyId");

-- CreateIndex
CREATE INDEX "consolidation_rules_targetCompanyId_idx" ON "consolidation_rules"("targetCompanyId");

-- CreateIndex
CREATE INDEX "intercompany_transactions_sourceCompanyId_idx" ON "intercompany_transactions"("sourceCompanyId");

-- CreateIndex
CREATE INDEX "intercompany_transactions_targetCompanyId_idx" ON "intercompany_transactions"("targetCompanyId");

-- CreateIndex
CREATE INDEX "intercompany_transactions_date_idx" ON "intercompany_transactions"("date");

-- CreateIndex
CREATE INDEX "intercompany_transactions_eliminated_idx" ON "intercompany_transactions"("eliminated");

-- CreateIndex
CREATE INDEX "consolidation_reports_period_idx" ON "consolidation_reports"("period");

-- CreateIndex
CREATE INDEX "consolidation_reports_status_idx" ON "consolidation_reports"("status");

-- CreateIndex
CREATE INDEX "ContactInformation_partyId_idx" ON "ContactInformation"("partyId");

-- CreateIndex
CREATE INDEX "ContactInformation_type_idx" ON "ContactInformation"("type");

-- CreateIndex
CREATE INDEX "ContactInformation_isPrimary_idx" ON "ContactInformation"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "EconomicSituation_partyId_key" ON "EconomicSituation"("partyId");

-- CreateIndex
CREATE INDEX "EconomicSituation_partyId_idx" ON "EconomicSituation"("partyId");

-- CreateIndex
CREATE INDEX "EconomicSituation_incomeLevel_idx" ON "EconomicSituation"("incomeLevel");

-- CreateIndex
CREATE INDEX "EconomicSituation_creditRiskLevel_idx" ON "EconomicSituation"("creditRiskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "LaborSituation_partyId_key" ON "LaborSituation"("partyId");

-- CreateIndex
CREATE INDEX "LaborSituation_partyId_idx" ON "LaborSituation"("partyId");

-- CreateIndex
CREATE INDEX "LaborSituation_employmentStatus_idx" ON "LaborSituation"("employmentStatus");

-- CreateIndex
CREATE INDEX "LaborSituation_profession_idx" ON "LaborSituation"("profession");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialData_partyId_key" ON "FinancialData"("partyId");

-- CreateIndex
CREATE INDEX "FinancialData_partyId_idx" ON "FinancialData"("partyId");

-- CreateIndex
CREATE INDEX "FamilyMember_partyId_idx" ON "FamilyMember"("partyId");

-- CreateIndex
CREATE INDEX "FamilyMember_relationshipType_idx" ON "FamilyMember"("relationshipType");

-- CreateIndex
CREATE INDEX "Preference_partyId_idx" ON "Preference"("partyId");

-- CreateIndex
CREATE INDEX "Preference_category_idx" ON "Preference"("category");

-- CreateIndex
CREATE INDEX "Preference_key_idx" ON "Preference"("key");

-- CreateIndex
CREATE INDEX "Hobby_partyId_idx" ON "Hobby"("partyId");

-- CreateIndex
CREATE INDEX "Hobby_category_idx" ON "Hobby"("category");

-- CreateIndex
CREATE INDEX "Vehicle_partyId_idx" ON "Vehicle"("partyId");

-- CreateIndex
CREATE INDEX "Vehicle_policyId_idx" ON "Vehicle"("policyId");

-- CreateIndex
CREATE INDEX "Vehicle_licensePlate_idx" ON "Vehicle"("licensePlate");

-- CreateIndex
CREATE INDEX "Vehicle_status_idx" ON "Vehicle"("status");

-- CreateIndex
CREATE INDEX "Property_partyId_idx" ON "Property"("partyId");

-- CreateIndex
CREATE INDEX "Property_policyId_idx" ON "Property"("policyId");

-- CreateIndex
CREATE INDEX "Property_cadastralReference_idx" ON "Property"("cadastralReference");

-- CreateIndex
CREATE INDEX "Property_type_idx" ON "Property"("type");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Valuable_partyId_idx" ON "Valuable"("partyId");

-- CreateIndex
CREATE INDEX "Valuable_policyId_idx" ON "Valuable"("policyId");

-- CreateIndex
CREATE INDEX "Valuable_type_idx" ON "Valuable"("type");

-- CreateIndex
CREATE INDEX "Valuable_status_idx" ON "Valuable"("status");

-- CreateIndex
CREATE INDEX "Investment_partyId_idx" ON "Investment"("partyId");

-- CreateIndex
CREATE INDEX "Investment_type_idx" ON "Investment"("type");

-- CreateIndex
CREATE INDEX "Investment_status_idx" ON "Investment"("status");

-- CreateIndex
CREATE INDEX "OtherAsset_partyId_idx" ON "OtherAsset"("partyId");

-- CreateIndex
CREATE INDEX "OtherAsset_type_idx" ON "OtherAsset"("type");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipType_code_key" ON "RelationshipType"("code");

-- CreateIndex
CREATE INDEX "RelationshipType_category_idx" ON "RelationshipType"("category");

-- CreateIndex
CREATE INDEX "Relationship_fromPartyId_idx" ON "Relationship"("fromPartyId");

-- CreateIndex
CREATE INDEX "Relationship_toPartyId_idx" ON "Relationship"("toPartyId");

-- CreateIndex
CREATE INDEX "Relationship_relationshipTypeId_idx" ON "Relationship"("relationshipTypeId");

-- CreateIndex
CREATE INDEX "Relationship_strength_idx" ON "Relationship"("strength");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_fromPartyId_toPartyId_relationshipTypeId_key" ON "Relationship"("fromPartyId", "toPartyId", "relationshipTypeId");

-- CreateIndex
CREATE INDEX "ClientDocument_partyId_idx" ON "ClientDocument"("partyId");

-- CreateIndex
CREATE INDEX "ClientDocument_type_idx" ON "ClientDocument"("type");

-- CreateIndex
CREATE INDEX "ClientDocument_status_idx" ON "ClientDocument"("status");

-- CreateIndex
CREATE UNIQUE INDEX "calls_callId_key" ON "calls"("callId");

-- CreateIndex
CREATE INDEX "calls_partyId_idx" ON "calls"("partyId");

-- CreateIndex
CREATE INDEX "calls_agentId_idx" ON "calls"("agentId");

-- CreateIndex
CREATE INDEX "calls_queueId_idx" ON "calls"("queueId");

-- CreateIndex
CREATE INDEX "calls_campaignId_idx" ON "calls"("campaignId");

-- CreateIndex
CREATE INDEX "calls_companyId_idx" ON "calls"("companyId");

-- CreateIndex
CREATE INDEX "calls_startTime_idx" ON "calls"("startTime");

-- CreateIndex
CREATE INDEX "calls_status_idx" ON "calls"("status");

-- CreateIndex
CREATE INDEX "calls_direction_idx" ON "calls"("direction");

-- CreateIndex
CREATE INDEX "calls_callType_idx" ON "calls"("callType");

-- CreateIndex
CREATE INDEX "calls_recordingId_idx" ON "calls"("recordingId");

-- CreateIndex
CREATE INDEX "calls_transcriptionId_idx" ON "calls"("transcriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "call_queues_extension_key" ON "call_queues"("extension");

-- CreateIndex
CREATE INDEX "call_queues_companyId_idx" ON "call_queues"("companyId");

-- CreateIndex
CREATE INDEX "call_queues_extension_idx" ON "call_queues"("extension");

-- CreateIndex
CREATE INDEX "call_queues_active_idx" ON "call_queues"("active");

-- CreateIndex
CREATE UNIQUE INDEX "agent_statuses_agentId_key" ON "agent_statuses"("agentId");

-- CreateIndex
CREATE INDEX "agent_statuses_agentId_idx" ON "agent_statuses"("agentId");

-- CreateIndex
CREATE INDEX "agent_statuses_status_idx" ON "agent_statuses"("status");

-- CreateIndex
CREATE INDEX "agent_statuses_companyId_idx" ON "agent_statuses"("companyId");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_companyId_idx" ON "campaigns"("companyId");

-- CreateIndex
CREATE INDEX "campaigns_startDate_idx" ON "campaigns"("startDate");

-- CreateIndex
CREATE INDEX "campaigns_endDate_idx" ON "campaigns"("endDate");

-- CreateIndex
CREATE INDEX "ivr_menus_companyId_idx" ON "ivr_menus"("companyId");

-- CreateIndex
CREATE INDEX "ivr_menus_active_idx" ON "ivr_menus"("active");

-- CreateIndex
CREATE INDEX "voicemails_mailbox_idx" ON "voicemails"("mailbox");

-- CreateIndex
CREATE INDEX "voicemails_userId_idx" ON "voicemails"("userId");

-- CreateIndex
CREATE INDEX "voicemails_read_idx" ON "voicemails"("read");

-- CreateIndex
CREATE INDEX "voicemails_companyId_idx" ON "voicemails"("companyId");

-- CreateIndex
CREATE INDEX "voicemails_createdAt_idx" ON "voicemails"("createdAt");

-- CreateIndex
CREATE INDEX "call_recordings_callId_idx" ON "call_recordings"("callId");

-- CreateIndex
CREATE INDEX "call_recordings_externalCallId_idx" ON "call_recordings"("externalCallId");

-- CreateIndex
CREATE INDEX "call_recordings_agentId_idx" ON "call_recordings"("agentId");

-- CreateIndex
CREATE INDEX "call_recordings_companyId_idx" ON "call_recordings"("companyId");

-- CreateIndex
CREATE INDEX "call_recordings_startTime_idx" ON "call_recordings"("startTime");

-- CreateIndex
CREATE INDEX "call_recordings_expiresAt_idx" ON "call_recordings"("expiresAt");

-- CreateIndex
CREATE INDEX "call_recordings_archived_idx" ON "call_recordings"("archived");

-- CreateIndex
CREATE INDEX "call_transcriptions_callId_idx" ON "call_transcriptions"("callId");

-- CreateIndex
CREATE INDEX "call_transcriptions_recordingId_idx" ON "call_transcriptions"("recordingId");

-- CreateIndex
CREATE INDEX "call_transcriptions_companyId_idx" ON "call_transcriptions"("companyId");

-- CreateIndex
CREATE INDEX "call_transcriptions_status_idx" ON "call_transcriptions"("status");

-- CreateIndex
CREATE INDEX "call_transcriptions_createdAt_idx" ON "call_transcriptions"("createdAt");

-- CreateIndex
CREATE INDEX "call_metrics_date_idx" ON "call_metrics"("date");

-- CreateIndex
CREATE INDEX "call_metrics_period_idx" ON "call_metrics"("period");

-- CreateIndex
CREATE INDEX "call_metrics_scope_idx" ON "call_metrics"("scope");

-- CreateIndex
CREATE INDEX "call_metrics_scopeId_idx" ON "call_metrics"("scopeId");

-- CreateIndex
CREATE INDEX "call_metrics_companyId_idx" ON "call_metrics"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "call_metrics_date_period_scope_scopeId_companyId_key" ON "call_metrics"("date", "period", "scope", "scopeId", "companyId");

-- CreateIndex
CREATE INDEX "dialer_configurations_type_idx" ON "dialer_configurations"("type");

-- CreateIndex
CREATE INDEX "dialer_configurations_enabled_idx" ON "dialer_configurations"("enabled");

-- CreateIndex
CREATE INDEX "dialer_configurations_companyId_idx" ON "dialer_configurations"("companyId");

-- CreateIndex
CREATE INDEX "chat_conversations_userId_idx" ON "chat_conversations"("userId");

-- CreateIndex
CREATE INDEX "chat_conversations_companyId_idx" ON "chat_conversations"("companyId");

-- CreateIndex
CREATE INDEX "chat_conversations_status_idx" ON "chat_conversations"("status");

-- CreateIndex
CREATE INDEX "chat_conversations_intent_idx" ON "chat_conversations"("intent");

-- CreateIndex
CREATE INDEX "chat_conversations_expertDomain_idx" ON "chat_conversations"("expertDomain");

-- CreateIndex
CREATE INDEX "chat_conversations_lastMessageAt_idx" ON "chat_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chat_messages_role_idx" ON "chat_messages"("role");

-- CreateIndex
CREATE INDEX "chat_messages_detectedIntent_idx" ON "chat_messages"("detectedIntent");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_base_articles_slug_key" ON "knowledge_base_articles"("slug");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_category_idx" ON "knowledge_base_articles"("category");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_domain_idx" ON "knowledge_base_articles"("domain");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_status_idx" ON "knowledge_base_articles"("status");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_companyId_idx" ON "knowledge_base_articles"("companyId");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_slug_idx" ON "knowledge_base_articles"("slug");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_occidentProducts_idx" ON "knowledge_base_articles"("occidentProducts");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_insuranceTypes_idx" ON "knowledge_base_articles"("insuranceTypes");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_erpModules_idx" ON "knowledge_base_articles"("erpModules");

-- CreateIndex
CREATE INDEX "knowledge_base_articles_keywords_idx" ON "knowledge_base_articles"("keywords");

-- CreateIndex
CREATE INDEX "chat_feedbacks_conversationId_idx" ON "chat_feedbacks"("conversationId");

-- CreateIndex
CREATE INDEX "chat_feedbacks_messageId_idx" ON "chat_feedbacks"("messageId");

-- CreateIndex
CREATE INDEX "chat_feedbacks_userId_idx" ON "chat_feedbacks"("userId");

-- CreateIndex
CREATE INDEX "chat_feedbacks_type_idx" ON "chat_feedbacks"("type");

-- CreateIndex
CREATE INDEX "chat_feedbacks_rating_idx" ON "chat_feedbacks"("rating");

-- CreateIndex
CREATE INDEX "chat_feedbacks_createdAt_idx" ON "chat_feedbacks"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "chat_intents_name_key" ON "chat_intents"("name");

-- CreateIndex
CREATE INDEX "chat_intents_category_idx" ON "chat_intents"("category");

-- CreateIndex
CREATE INDEX "chat_intents_domain_idx" ON "chat_intents"("domain");

-- CreateIndex
CREATE INDEX "chat_intents_active_idx" ON "chat_intents"("active");

-- CreateIndex
CREATE INDEX "chat_intents_name_idx" ON "chat_intents"("name");

-- CreateIndex
CREATE INDEX "chat_analytics_date_idx" ON "chat_analytics"("date");

-- CreateIndex
CREATE INDEX "chat_analytics_period_idx" ON "chat_analytics"("period");

-- CreateIndex
CREATE INDEX "chat_analytics_scope_idx" ON "chat_analytics"("scope");

-- CreateIndex
CREATE INDEX "chat_analytics_companyId_idx" ON "chat_analytics"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_analytics_date_period_scope_scopeId_companyId_key" ON "chat_analytics"("date", "period", "scope", "scopeId", "companyId");

-- CreateIndex
CREATE INDEX "wallets_ownerType_idx" ON "wallets"("ownerType");

-- CreateIndex
CREATE INDEX "wallets_ownerId_idx" ON "wallets"("ownerId");

-- CreateIndex
CREATE INDEX "wallets_companyId_idx" ON "wallets"("companyId");

-- CreateIndex
CREATE INDEX "wallets_status_idx" ON "wallets"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_ownerType_ownerId_type_key" ON "wallets"("ownerType", "ownerId", "type");

-- CreateIndex
CREATE INDEX "transactions_walletId_idx" ON "transactions"("walletId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_sourceType_idx" ON "transactions"("sourceType");

-- CreateIndex
CREATE INDEX "transactions_sourceId_idx" ON "transactions"("sourceId");

-- CreateIndex
CREATE INDEX "transactions_companyId_idx" ON "transactions"("companyId");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "transactions_expiresAt_idx" ON "transactions"("expiresAt");

-- CreateIndex
CREATE INDEX "conversion_rates_fromCurrency_toCurrency_idx" ON "conversion_rates"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "conversion_rates_scope_scopeId_idx" ON "conversion_rates"("scope", "scopeId");

-- CreateIndex
CREATE INDEX "conversion_rates_effectiveFrom_idx" ON "conversion_rates"("effectiveFrom");

-- CreateIndex
CREATE INDEX "conversion_rates_companyId_idx" ON "conversion_rates"("companyId");

-- CreateIndex
CREATE INDEX "conversion_rates_isActive_idx" ON "conversion_rates"("isActive");

-- CreateIndex
CREATE INDEX "discounts_referenceType_referenceId_idx" ON "discounts"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "discounts_partyId_idx" ON "discounts"("partyId");

-- CreateIndex
CREATE INDEX "discounts_clientWalletId_idx" ON "discounts"("clientWalletId");

-- CreateIndex
CREATE INDEX "discounts_status_idx" ON "discounts"("status");

-- CreateIndex
CREATE INDEX "discounts_companyId_idx" ON "discounts"("companyId");

-- CreateIndex
CREATE INDEX "discounts_createdAt_idx" ON "discounts"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "achievements_category_idx" ON "achievements"("category");

-- CreateIndex
CREATE INDEX "achievements_type_idx" ON "achievements"("type");

-- CreateIndex
CREATE INDEX "achievements_active_idx" ON "achievements"("active");

-- CreateIndex
CREATE INDEX "achievements_companyId_idx" ON "achievements"("companyId");

-- CreateIndex
CREATE INDEX "achievement_tiers_achievementId_idx" ON "achievement_tiers"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "achievement_tiers_achievementId_tier_key" ON "achievement_tiers"("achievementId", "tier");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_partyId_idx" ON "user_achievements"("partyId");

-- CreateIndex
CREATE INDEX "user_achievements_achievementId_idx" ON "user_achievements"("achievementId");

-- CreateIndex
CREATE INDEX "user_achievements_status_idx" ON "user_achievements"("status");

-- CreateIndex
CREATE INDEX "user_achievements_companyId_idx" ON "user_achievements"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "missions_code_key" ON "missions"("code");

-- CreateIndex
CREATE INDEX "missions_type_idx" ON "missions"("type");

-- CreateIndex
CREATE INDEX "missions_category_idx" ON "missions"("category");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_startDate_idx" ON "missions"("startDate");

-- CreateIndex
CREATE INDEX "missions_endDate_idx" ON "missions"("endDate");

-- CreateIndex
CREATE INDEX "missions_companyId_idx" ON "missions"("companyId");

-- CreateIndex
CREATE INDEX "user_missions_userId_idx" ON "user_missions"("userId");

-- CreateIndex
CREATE INDEX "user_missions_partyId_idx" ON "user_missions"("partyId");

-- CreateIndex
CREATE INDEX "user_missions_missionId_idx" ON "user_missions"("missionId");

-- CreateIndex
CREATE INDEX "user_missions_status_idx" ON "user_missions"("status");

-- CreateIndex
CREATE INDEX "user_missions_companyId_idx" ON "user_missions"("companyId");

-- CreateIndex
CREATE INDEX "user_missions_expiresAt_idx" ON "user_missions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_missions_userId_missionId_key" ON "user_missions"("userId", "missionId");

-- CreateIndex
CREATE INDEX "leaderboard_entries_period_idx" ON "leaderboard_entries"("period");

-- CreateIndex
CREATE INDEX "leaderboard_entries_category_idx" ON "leaderboard_entries"("category");

-- CreateIndex
CREATE INDEX "leaderboard_entries_userId_idx" ON "leaderboard_entries"("userId");

-- CreateIndex
CREATE INDEX "leaderboard_entries_rank_idx" ON "leaderboard_entries"("rank");

-- CreateIndex
CREATE INDEX "leaderboard_entries_periodStart_idx" ON "leaderboard_entries"("periodStart");

-- CreateIndex
CREATE INDEX "leaderboard_entries_companyId_idx" ON "leaderboard_entries"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_period_periodStart_category_userId_comp_key" ON "leaderboard_entries"("period", "periodStart", "category", "userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "gamification_settings_companyId_key" ON "gamification_settings"("companyId");

-- CreateIndex
CREATE INDEX "gamification_settings_companyId_idx" ON "gamification_settings"("companyId");

-- CreateIndex
CREATE INDEX "legal_consultations_partyId_idx" ON "legal_consultations"("partyId");

-- CreateIndex
CREATE INDEX "legal_consultations_consultationType_idx" ON "legal_consultations"("consultationType");

-- CreateIndex
CREATE INDEX "legal_consultations_status_idx" ON "legal_consultations"("status");

-- CreateIndex
CREATE INDEX "legal_consultations_caseId_idx" ON "legal_consultations"("caseId");

-- CreateIndex
CREATE INDEX "legal_consultations_companyId_idx" ON "legal_consultations"("companyId");

-- CreateIndex
CREATE INDEX "legal_consultations_urgency_idx" ON "legal_consultations"("urgency");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_contractNumber_key" ON "contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "contracts_type_idx" ON "contracts"("type");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_caseId_idx" ON "contracts"("caseId");

-- CreateIndex
CREATE INDEX "contracts_companyId_idx" ON "contracts"("companyId");

-- CreateIndex
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- CreateIndex
CREATE INDEX "contracts_nextRenewalDate_idx" ON "contracts"("nextRenewalDate");

-- CreateIndex
CREATE INDEX "contract_reviews_contractId_idx" ON "contract_reviews"("contractId");

-- CreateIndex
CREATE INDEX "contract_reviews_reviewType_idx" ON "contract_reviews"("reviewType");

-- CreateIndex
CREATE INDEX "contract_reviews_overallScore_idx" ON "contract_reviews"("overallScore");

-- CreateIndex
CREATE UNIQUE INDEX "legal_cases_caseNumber_key" ON "legal_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "legal_cases_caseType_idx" ON "legal_cases"("caseType");

-- CreateIndex
CREATE INDEX "legal_cases_legalArea_idx" ON "legal_cases"("legalArea");

-- CreateIndex
CREATE INDEX "legal_cases_status_idx" ON "legal_cases"("status");

-- CreateIndex
CREATE INDEX "legal_cases_companyId_idx" ON "legal_cases"("companyId");

-- CreateIndex
CREATE INDEX "legal_cases_nextDeadline_idx" ON "legal_cases"("nextDeadline");

-- CreateIndex
CREATE INDEX "legal_advices_category_idx" ON "legal_advices"("category");

-- CreateIndex
CREATE INDEX "legal_advices_isPublic_idx" ON "legal_advices"("isPublic");

-- CreateIndex
CREATE INDEX "legal_advices_companyId_idx" ON "legal_advices"("companyId");

-- CreateIndex
CREATE INDEX "tax_models_modelNumber_idx" ON "tax_models"("modelNumber");

-- CreateIndex
CREATE INDEX "tax_models_fiscalYear_idx" ON "tax_models"("fiscalYear");

-- CreateIndex
CREATE INDEX "tax_models_status_idx" ON "tax_models"("status");

-- CreateIndex
CREATE INDEX "tax_models_companyId_idx" ON "tax_models"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tax_models_companyId_modelNumber_fiscalYear_period_key" ON "tax_models"("companyId", "modelNumber", "fiscalYear", "period");

-- CreateIndex
CREATE INDEX "tax_submissions_status_idx" ON "tax_submissions"("status");

-- CreateIndex
CREATE INDEX "tax_submissions_fiscalYear_idx" ON "tax_submissions"("fiscalYear");

-- CreateIndex
CREATE INDEX "tax_submissions_certificateId_idx" ON "tax_submissions"("certificateId");

-- CreateIndex
CREATE INDEX "tax_submissions_companyId_idx" ON "tax_submissions"("companyId");

-- CreateIndex
CREATE INDEX "tax_submissions_submissionDate_idx" ON "tax_submissions"("submissionDate");

-- CreateIndex
CREATE UNIQUE INDEX "digital_certificates_serialNumber_key" ON "digital_certificates"("serialNumber");

-- CreateIndex
CREATE INDEX "digital_certificates_ownerTaxId_idx" ON "digital_certificates"("ownerTaxId");

-- CreateIndex
CREATE INDEX "digital_certificates_status_idx" ON "digital_certificates"("status");

-- CreateIndex
CREATE INDEX "digital_certificates_validTo_idx" ON "digital_certificates"("validTo");

-- CreateIndex
CREATE INDEX "digital_certificates_companyId_idx" ON "digital_certificates"("companyId");

-- CreateIndex
CREATE INDEX "vat_reports_fiscalYear_idx" ON "vat_reports"("fiscalYear");

-- CreateIndex
CREATE INDEX "vat_reports_status_idx" ON "vat_reports"("status");

-- CreateIndex
CREATE INDEX "vat_reports_companyId_idx" ON "vat_reports"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "vat_reports_companyId_fiscalYear_quarter_key" ON "vat_reports"("companyId", "fiscalYear", "quarter");

-- CreateIndex
CREATE INDEX "sii_records_recordType_idx" ON "sii_records"("recordType");

-- CreateIndex
CREATE INDEX "sii_records_siiStatus_idx" ON "sii_records"("siiStatus");

-- CreateIndex
CREATE INDEX "sii_records_invoiceDate_idx" ON "sii_records"("invoiceDate");

-- CreateIndex
CREATE INDEX "sii_records_companyId_idx" ON "sii_records"("companyId");

-- CreateIndex
CREATE INDEX "commission_records_policyId_idx" ON "commission_records"("policyId");

-- CreateIndex
CREATE INDEX "commission_records_receiptId_idx" ON "commission_records"("receiptId");

-- CreateIndex
CREATE INDEX "commission_records_agentId_idx" ON "commission_records"("agentId");

-- CreateIndex
CREATE INDEX "commission_records_partyId_idx" ON "commission_records"("partyId");

-- CreateIndex
CREATE INDEX "commission_records_status_idx" ON "commission_records"("status");

-- CreateIndex
CREATE INDEX "commission_records_companyId_idx" ON "commission_records"("companyId");

-- CreateIndex
CREATE INDEX "commission_records_paidAt_idx" ON "commission_records"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "client_analyses_partyId_key" ON "client_analyses"("partyId");

-- CreateIndex
CREATE INDEX "client_analyses_partyId_idx" ON "client_analyses"("partyId");

-- CreateIndex
CREATE INDEX "client_analyses_healthScore_idx" ON "client_analyses"("healthScore");

-- CreateIndex
CREATE INDEX "client_analyses_segment_idx" ON "client_analyses"("segment");

-- CreateIndex
CREATE INDEX "client_analyses_companyId_idx" ON "client_analyses"("companyId");

-- CreateIndex
CREATE INDEX "client_analyses_lastAnalyzedAt_idx" ON "client_analyses"("lastAnalyzedAt");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_partyId_idx" ON "opportunity_recommendations"("partyId");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_type_idx" ON "opportunity_recommendations"("type");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_priority_idx" ON "opportunity_recommendations"("priority");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_status_idx" ON "opportunity_recommendations"("status");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_assignedToId_idx" ON "opportunity_recommendations"("assignedToId");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_companyId_idx" ON "opportunity_recommendations"("companyId");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_closeProbability_idx" ON "opportunity_recommendations"("closeProbability");

-- CreateIndex
CREATE INDEX "opportunity_recommendations_createdAt_idx" ON "opportunity_recommendations"("createdAt");

-- CreateIndex
CREATE INDEX "coverage_gaps_partyId_idx" ON "coverage_gaps"("partyId");

-- CreateIndex
CREATE INDEX "coverage_gaps_gapType_idx" ON "coverage_gaps"("gapType");

-- CreateIndex
CREATE INDEX "coverage_gaps_riskLevel_idx" ON "coverage_gaps"("riskLevel");

-- CreateIndex
CREATE INDEX "coverage_gaps_status_idx" ON "coverage_gaps"("status");

-- CreateIndex
CREATE INDEX "coverage_gaps_companyId_idx" ON "coverage_gaps"("companyId");

-- CreateIndex
CREATE INDEX "coverage_gaps_priority_idx" ON "coverage_gaps"("priority");

-- CreateIndex
CREATE INDEX "churn_predictions_partyId_idx" ON "churn_predictions"("partyId");

-- CreateIndex
CREATE INDEX "churn_predictions_churnRisk_idx" ON "churn_predictions"("churnRisk");

-- CreateIndex
CREATE INDEX "churn_predictions_churnScore_idx" ON "churn_predictions"("churnScore");

-- CreateIndex
CREATE INDEX "churn_predictions_companyId_idx" ON "churn_predictions"("companyId");

-- CreateIndex
CREATE INDEX "churn_predictions_actionsStatus_idx" ON "churn_predictions"("actionsStatus");

-- CreateIndex
CREATE INDEX "churn_predictions_createdAt_idx" ON "churn_predictions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_proposals_opportunityId_key" ON "ai_proposals"("opportunityId");

-- CreateIndex
CREATE INDEX "ai_proposals_opportunityId_idx" ON "ai_proposals"("opportunityId");

-- CreateIndex
CREATE INDEX "ai_proposals_partyId_idx" ON "ai_proposals"("partyId");

-- CreateIndex
CREATE INDEX "ai_proposals_status_idx" ON "ai_proposals"("status");

-- CreateIndex
CREATE INDEX "ai_proposals_companyId_idx" ON "ai_proposals"("companyId");

-- CreateIndex
CREATE INDEX "ai_proposals_createdAt_idx" ON "ai_proposals"("createdAt");

-- CreateIndex
CREATE INDEX "ai_proposals_assignedToId_idx" ON "ai_proposals"("assignedToId");

-- CreateIndex
CREATE INDEX "sales_intelligence_metrics_date_idx" ON "sales_intelligence_metrics"("date");

-- CreateIndex
CREATE INDEX "sales_intelligence_metrics_period_idx" ON "sales_intelligence_metrics"("period");

-- CreateIndex
CREATE INDEX "sales_intelligence_metrics_scope_idx" ON "sales_intelligence_metrics"("scope");

-- CreateIndex
CREATE INDEX "sales_intelligence_metrics_companyId_idx" ON "sales_intelligence_metrics"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_intelligence_metrics_date_period_scope_scopeId_compan_key" ON "sales_intelligence_metrics"("date", "period", "scope", "scopeId", "companyId");

-- CreateIndex
CREATE INDEX "invoices_companyId_idx" ON "invoices"("companyId");

-- CreateIndex
CREATE INDEX "invoices_invoiceDate_idx" ON "invoices"("invoiceDate");

-- CreateIndex
CREATE INDEX "invoices_type_idx" ON "invoices"("type");

-- CreateIndex
CREATE INDEX "payrolls_companyId_idx" ON "payrolls"("companyId");

-- CreateIndex
CREATE INDEX "payrolls_payrollMonth_idx" ON "payrolls"("payrollMonth");

-- CreateIndex
CREATE INDEX "payrolls_employeeId_idx" ON "payrolls"("employeeId");

-- CreateIndex
CREATE INDEX "sii_submissions_certificateId_idx" ON "sii_submissions"("certificateId");

-- CreateIndex
CREATE INDEX "sii_submissions_status_idx" ON "sii_submissions"("status");

-- CreateIndex
CREATE INDEX "sii_submissions_submissionType_idx" ON "sii_submissions"("submissionType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Party" ADD CONSTRAINT "Party_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercompany_transactions" ADD CONSTRAINT "intercompany_transactions_sourceCompanyId_fkey" FOREIGN KEY ("sourceCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intercompany_transactions" ADD CONSTRAINT "intercompany_transactions_targetCompanyId_fkey" FOREIGN KEY ("targetCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Valuable" ADD CONSTRAINT "Valuable_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "call_queues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "call_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_transcriptionId_fkey" FOREIGN KEY ("transcriptionId") REFERENCES "call_transcriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_queues" ADD CONSTRAINT "call_queues_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_statuses" ADD CONSTRAINT "agent_statuses_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_statuses" ADD CONSTRAINT "agent_statuses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ivr_menus" ADD CONSTRAINT "ivr_menus_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voicemails" ADD CONSTRAINT "voicemails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voicemails" ADD CONSTRAINT "voicemails_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_recordings" ADD CONSTRAINT "call_recordings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_transcriptions" ADD CONSTRAINT "call_transcriptions_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "call_recordings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_transcriptions" ADD CONSTRAINT "call_transcriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_metrics" ADD CONSTRAINT "call_metrics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dialer_configurations" ADD CONSTRAINT "dialer_configurations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_conversations" ADD CONSTRAINT "chat_conversations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base_articles" ADD CONSTRAINT "knowledge_base_articles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_feedbacks" ADD CONSTRAINT "chat_feedbacks_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_feedbacks" ADD CONSTRAINT "chat_feedbacks_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "chat_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_feedbacks" ADD CONSTRAINT "chat_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_analytics" ADD CONSTRAINT "chat_analytics_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discounts" ADD CONSTRAINT "discounts_clientWalletId_fkey" FOREIGN KEY ("clientWalletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achievement_tiers" ADD CONSTRAINT "achievement_tiers_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_consultations" ADD CONSTRAINT "legal_consultations_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "legal_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "legal_cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_reviews" ADD CONSTRAINT "contract_reviews_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_models" ADD CONSTRAINT "tax_models_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "tax_submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_submissions" ADD CONSTRAINT "tax_submissions_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "digital_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sii_submissions" ADD CONSTRAINT "sii_submissions_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "digital_certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
