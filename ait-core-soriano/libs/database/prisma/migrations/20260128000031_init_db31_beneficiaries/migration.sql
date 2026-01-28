-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "identityType" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_changes" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiary_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiary_payouts" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beneficiary_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beneficiaries_policyId_idx" ON "beneficiaries"("policyId");

-- CreateIndex
CREATE INDEX "beneficiaries_identityNumber_idx" ON "beneficiaries"("identityNumber");

-- CreateIndex
CREATE INDEX "beneficiaries_status_idx" ON "beneficiaries"("status");

-- CreateIndex
CREATE INDEX "beneficiary_changes_policyId_idx" ON "beneficiary_changes"("policyId");

-- CreateIndex
CREATE INDEX "beneficiary_changes_beneficiaryId_idx" ON "beneficiary_changes"("beneficiaryId");

-- CreateIndex
CREATE INDEX "beneficiary_changes_status_idx" ON "beneficiary_changes"("status");

-- CreateIndex
CREATE INDEX "beneficiary_payouts_claimId_idx" ON "beneficiary_payouts"("claimId");

-- CreateIndex
CREATE INDEX "beneficiary_payouts_beneficiaryId_idx" ON "beneficiary_payouts"("beneficiaryId");

-- CreateIndex
CREATE INDEX "beneficiary_payouts_status_idx" ON "beneficiary_payouts"("status");
