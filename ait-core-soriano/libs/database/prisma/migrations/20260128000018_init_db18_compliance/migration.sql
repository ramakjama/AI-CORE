-- CreateTable
CREATE TABLE "compliance_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "regulation" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_checks" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "violations" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gdpr_requests" (
    "id" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "gdpr_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_retention_policies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "retentionPeriod" INTEGER NOT NULL,
    "retentionUnit" TEXT NOT NULL,
    "archiveAfter" INTEGER,
    "deleteAfter" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_rules_category_idx" ON "compliance_rules"("category");

-- CreateIndex
CREATE INDEX "compliance_rules_regulation_idx" ON "compliance_rules"("regulation");

-- CreateIndex
CREATE INDEX "compliance_rules_isActive_idx" ON "compliance_rules"("isActive");

-- CreateIndex
CREATE INDEX "compliance_checks_ruleId_idx" ON "compliance_checks"("ruleId");

-- CreateIndex
CREATE INDEX "compliance_checks_entityType_entityId_idx" ON "compliance_checks"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "compliance_checks_status_idx" ON "compliance_checks"("status");

-- CreateIndex
CREATE INDEX "gdpr_requests_customerId_idx" ON "gdpr_requests"("customerId");

-- CreateIndex
CREATE INDEX "gdpr_requests_status_idx" ON "gdpr_requests"("status");

-- CreateIndex
CREATE INDEX "gdpr_requests_requestType_idx" ON "gdpr_requests"("requestType");

-- CreateIndex
CREATE INDEX "data_retention_policies_dataType_idx" ON "data_retention_policies"("dataType");

-- AddForeignKey
ALTER TABLE "compliance_checks" ADD CONSTRAINT "compliance_checks_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "compliance_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
