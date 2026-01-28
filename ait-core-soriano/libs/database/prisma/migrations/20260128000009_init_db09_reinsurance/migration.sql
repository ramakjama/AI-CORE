-- CreateTable
CREATE TABLE "reinsurance_contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "reinsurerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3) NOT NULL,
    "retentionLimit" DECIMAL(15,2) NOT NULL,
    "premium" DECIMAL(12,2) NOT NULL,
    "commissionRate" DECIMAL(5,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reinsurance_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reinsurance_cessions" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "cessionType" TEXT NOT NULL,
    "cededAmount" DECIMAL(12,2) NOT NULL,
    "cededPremium" DECIMAL(10,2) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reinsurance_cessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reinsurance_claims" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "cessionId" TEXT NOT NULL,
    "recoveredAmount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recoveredAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reinsurance_claims_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reinsurance_contracts_contractNumber_key" ON "reinsurance_contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "reinsurance_contracts_reinsurerId_idx" ON "reinsurance_contracts"("reinsurerId");

-- CreateIndex
CREATE INDEX "reinsurance_contracts_status_idx" ON "reinsurance_contracts"("status");

-- CreateIndex
CREATE INDEX "reinsurance_cessions_contractId_idx" ON "reinsurance_cessions"("contractId");

-- CreateIndex
CREATE INDEX "reinsurance_cessions_policyId_idx" ON "reinsurance_cessions"("policyId");

-- CreateIndex
CREATE INDEX "reinsurance_cessions_status_idx" ON "reinsurance_cessions"("status");

-- CreateIndex
CREATE INDEX "reinsurance_claims_claimId_idx" ON "reinsurance_claims"("claimId");

-- CreateIndex
CREATE INDEX "reinsurance_claims_cessionId_idx" ON "reinsurance_claims"("cessionId");

-- CreateIndex
CREATE INDEX "reinsurance_claims_status_idx" ON "reinsurance_claims"("status");

-- AddForeignKey
ALTER TABLE "reinsurance_cessions" ADD CONSTRAINT "reinsurance_cessions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "reinsurance_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reinsurance_claims" ADD CONSTRAINT "reinsurance_claims_cessionId_fkey" FOREIGN KEY ("cessionId") REFERENCES "reinsurance_cessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
