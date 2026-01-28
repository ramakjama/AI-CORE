-- CreateTable
CREATE TABLE "loyalty_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pointsPerEuro" DECIMAL(5,2) NOT NULL,
    "tierLevels" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_accounts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "lifetimePoints" INTEGER NOT NULL DEFAULT 0,
    "tierLevel" TEXT NOT NULL,
    "tierStartDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loyalty_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_redemptions" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "pointsRedeemed" INTEGER NOT NULL,
    "rewardValue" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "loyalty_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loyalty_programs_isActive_idx" ON "loyalty_programs"("isActive");

-- CreateIndex
CREATE INDEX "loyalty_accounts_customerId_idx" ON "loyalty_accounts"("customerId");

-- CreateIndex
CREATE INDEX "loyalty_accounts_programId_idx" ON "loyalty_accounts"("programId");

-- CreateIndex
CREATE INDEX "loyalty_accounts_status_idx" ON "loyalty_accounts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_accounts_customerId_programId_key" ON "loyalty_accounts"("customerId", "programId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_accountId_idx" ON "loyalty_transactions"("accountId");

-- CreateIndex
CREATE INDEX "loyalty_transactions_type_idx" ON "loyalty_transactions"("type");

-- CreateIndex
CREATE INDEX "loyalty_transactions_createdAt_idx" ON "loyalty_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "loyalty_redemptions_accountId_idx" ON "loyalty_redemptions"("accountId");

-- CreateIndex
CREATE INDEX "loyalty_redemptions_status_idx" ON "loyalty_redemptions"("status");

-- AddForeignKey
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_programId_fkey" FOREIGN KEY ("programId") REFERENCES "loyalty_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "loyalty_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
