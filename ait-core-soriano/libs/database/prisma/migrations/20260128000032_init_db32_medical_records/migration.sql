-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "medications" TEXT[],
    "doctorName" TEXT,
    "facilityName" TEXT,
    "notes" TEXT,
    "isPreexisting" BOOLEAN NOT NULL DEFAULT false,
    "affectsCoverage" BOOLEAN NOT NULL DEFAULT false,
    "confidential" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_questionnaires" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quoteId" TEXT,
    "policyId" TEXT,
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "riskScore" DECIMAL(5,2),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_questionnaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_examinations" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "policyId" TEXT,
    "examinationType" TEXT NOT NULL,
    "examinationDate" TIMESTAMP(3) NOT NULL,
    "doctorName" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "conclusion" TEXT,
    "recommendedActions" TEXT,
    "reportUrl" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_examinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_records_customerId_idx" ON "medical_records"("customerId");

-- CreateIndex
CREATE INDEX "medical_records_recordType_idx" ON "medical_records"("recordType");

-- CreateIndex
CREATE INDEX "medical_records_recordDate_idx" ON "medical_records"("recordDate");

-- CreateIndex
CREATE INDEX "medical_questionnaires_customerId_idx" ON "medical_questionnaires"("customerId");

-- CreateIndex
CREATE INDEX "medical_questionnaires_quoteId_idx" ON "medical_questionnaires"("quoteId");

-- CreateIndex
CREATE INDEX "medical_questionnaires_policyId_idx" ON "medical_questionnaires"("policyId");

-- CreateIndex
CREATE INDEX "medical_questionnaires_status_idx" ON "medical_questionnaires"("status");

-- CreateIndex
CREATE INDEX "medical_examinations_customerId_idx" ON "medical_examinations"("customerId");

-- CreateIndex
CREATE INDEX "medical_examinations_policyId_idx" ON "medical_examinations"("policyId");

-- CreateIndex
CREATE INDEX "medical_examinations_status_idx" ON "medical_examinations"("status");
