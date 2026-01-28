-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "sumInsured" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "paymentFrequency" TEXT NOT NULL,
    "deductible" DECIMAL(10,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coverages" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "limit" DECIMAL(12,2) NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsements" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "premiumChange" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "policies_policyNumber_key" ON "policies"("policyNumber");

-- CreateIndex
CREATE INDEX "policies_customerId_idx" ON "policies"("customerId");

-- CreateIndex
CREATE INDEX "policies_agentId_idx" ON "policies"("agentId");

-- CreateIndex
CREATE INDEX "policies_status_idx" ON "policies"("status");

-- CreateIndex
CREATE INDEX "policies_type_idx" ON "policies"("type");

-- CreateIndex
CREATE INDEX "coverages_policyId_idx" ON "coverages"("policyId");

-- CreateIndex
CREATE INDEX "endorsements_policyId_idx" ON "endorsements"("policyId");

-- CreateIndex
CREATE INDEX "endorsements_status_idx" ON "endorsements"("status");

-- AddForeignKey
ALTER TABLE "coverages" ADD CONSTRAINT "coverages_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
