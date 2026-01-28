-- CreateTable
CREATE TABLE "underwriting_cases" (
    "id" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "assignedTo" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "decisionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "underwriting_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "underwriting_documents" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "underwriting_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "assessedBy" TEXT NOT NULL,
    "riskScore" DECIMAL(5,2) NOT NULL,
    "factors" JSONB NOT NULL,
    "recommendations" TEXT,
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "underwriting_cases_caseNumber_key" ON "underwriting_cases"("caseNumber");

-- CreateIndex
CREATE INDEX "underwriting_cases_quoteId_idx" ON "underwriting_cases"("quoteId");

-- CreateIndex
CREATE INDEX "underwriting_cases_customerId_idx" ON "underwriting_cases"("customerId");

-- CreateIndex
CREATE INDEX "underwriting_cases_status_idx" ON "underwriting_cases"("status");

-- CreateIndex
CREATE INDEX "underwriting_cases_assignedTo_idx" ON "underwriting_cases"("assignedTo");

-- CreateIndex
CREATE INDEX "underwriting_documents_caseId_idx" ON "underwriting_documents"("caseId");

-- CreateIndex
CREATE INDEX "underwriting_documents_status_idx" ON "underwriting_documents"("status");

-- CreateIndex
CREATE INDEX "risk_assessments_caseId_idx" ON "risk_assessments"("caseId");

-- AddForeignKey
ALTER TABLE "underwriting_documents" ADD CONSTRAINT "underwriting_documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "underwriting_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "underwriting_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
