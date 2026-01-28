-- CreateTable
CREATE TABLE "renewal_processes" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "currentPremium" DECIMAL(10,2) NOT NULL,
    "proposedPremium" DECIMAL(10,2) NOT NULL,
    "adjustmentReason" TEXT,
    "notificationSentAt" TIMESTAMP(3),
    "customerResponseAt" TIMESTAMP(3),
    "customerResponse" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renewal_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewal_reminders" (
    "id" TEXT NOT NULL,
    "renewalId" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renewal_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renewal_quotes" (
    "id" TEXT NOT NULL,
    "renewalId" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "coverageChanges" JSONB,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "accepted" BOOLEAN,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "renewal_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "renewal_processes_policyId_idx" ON "renewal_processes"("policyId");

-- CreateIndex
CREATE INDEX "renewal_processes_status_idx" ON "renewal_processes"("status");

-- CreateIndex
CREATE INDEX "renewal_processes_renewalDate_idx" ON "renewal_processes"("renewalDate");

-- CreateIndex
CREATE INDEX "renewal_reminders_renewalId_idx" ON "renewal_reminders"("renewalId");

-- CreateIndex
CREATE INDEX "renewal_reminders_scheduledFor_idx" ON "renewal_reminders"("scheduledFor");

-- CreateIndex
CREATE INDEX "renewal_reminders_status_idx" ON "renewal_reminders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "renewal_quotes_quoteNumber_key" ON "renewal_quotes"("quoteNumber");

-- CreateIndex
CREATE INDEX "renewal_quotes_renewalId_idx" ON "renewal_quotes"("renewalId");

-- AddForeignKey
ALTER TABLE "renewal_reminders" ADD CONSTRAINT "renewal_reminders_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "renewal_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renewal_quotes" ADD CONSTRAINT "renewal_quotes_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "renewal_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
