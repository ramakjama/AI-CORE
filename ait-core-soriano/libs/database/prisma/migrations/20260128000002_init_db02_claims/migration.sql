-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2),
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "settledAt" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_documents" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claim_adjustments" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "adjustedBy" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "adjustedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "claims_claimNumber_key" ON "claims"("claimNumber");

-- CreateIndex
CREATE INDEX "claims_policyId_idx" ON "claims"("policyId");

-- CreateIndex
CREATE INDEX "claims_status_idx" ON "claims"("status");

-- CreateIndex
CREATE INDEX "claims_type_idx" ON "claims"("type");

-- CreateIndex
CREATE INDEX "claim_documents_claimId_idx" ON "claim_documents"("claimId");

-- CreateIndex
CREATE INDEX "claim_adjustments_claimId_idx" ON "claim_adjustments"("claimId");

-- AddForeignKey
ALTER TABLE "claim_documents" ADD CONSTRAINT "claim_documents_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claim_adjustments" ADD CONSTRAINT "claim_adjustments_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
