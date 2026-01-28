-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "policyId" TEXT,
    "claimId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "assignedTo" TEXT,
    "priority" TEXT NOT NULL,
    "resolutionDueDate" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "customerSatisfaction" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_responses" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "respondedBy" TEXT NOT NULL,
    "responseType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_escalations" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "escalatedFrom" TEXT NOT NULL,
    "escalatedTo" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "escalatedBy" TEXT NOT NULL,
    "escalatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_escalations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_complaintNumber_key" ON "complaints"("complaintNumber");

-- CreateIndex
CREATE INDEX "complaints_customerId_idx" ON "complaints"("customerId");

-- CreateIndex
CREATE INDEX "complaints_policyId_idx" ON "complaints"("policyId");

-- CreateIndex
CREATE INDEX "complaints_status_idx" ON "complaints"("status");

-- CreateIndex
CREATE INDEX "complaints_severity_idx" ON "complaints"("severity");

-- CreateIndex
CREATE INDEX "complaints_assignedTo_idx" ON "complaints"("assignedTo");

-- CreateIndex
CREATE INDEX "complaint_responses_complaintId_idx" ON "complaint_responses"("complaintId");

-- CreateIndex
CREATE INDEX "complaint_escalations_complaintId_idx" ON "complaint_escalations"("complaintId");

-- AddForeignKey
ALTER TABLE "complaint_responses" ADD CONSTRAINT "complaint_responses_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_escalations" ADD CONSTRAINT "complaint_escalations_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
