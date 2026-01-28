-- CreateTable
CREATE TABLE "fraud_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "threshold" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_alerts" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "riskScore" DECIMAL(5,2) NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "indicators" JSONB NOT NULL,
    "assignedTo" TEXT,
    "investigatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fraud_investigations" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "investigator" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "findings" TEXT,
    "evidence" JSONB,
    "recommendation" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fraud_investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blacklist" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "addedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fraud_rules_category_idx" ON "fraud_rules"("category");

-- CreateIndex
CREATE INDEX "fraud_rules_isActive_idx" ON "fraud_rules"("isActive");

-- CreateIndex
CREATE INDEX "fraud_alerts_ruleId_idx" ON "fraud_alerts"("ruleId");

-- CreateIndex
CREATE INDEX "fraud_alerts_entityType_entityId_idx" ON "fraud_alerts"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "fraud_alerts_status_idx" ON "fraud_alerts"("status");

-- CreateIndex
CREATE INDEX "fraud_alerts_severity_idx" ON "fraud_alerts"("severity");

-- CreateIndex
CREATE INDEX "fraud_investigations_alertId_idx" ON "fraud_investigations"("alertId");

-- CreateIndex
CREATE INDEX "fraud_investigations_status_idx" ON "fraud_investigations"("status");

-- CreateIndex
CREATE INDEX "blacklist_entityType_entityId_idx" ON "blacklist"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "blacklist_expiresAt_idx" ON "blacklist"("expiresAt");

-- AddForeignKey
ALTER TABLE "fraud_alerts" ADD CONSTRAINT "fraud_alerts_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "fraud_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fraud_investigations" ADD CONSTRAINT "fraud_investigations_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "fraud_alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
