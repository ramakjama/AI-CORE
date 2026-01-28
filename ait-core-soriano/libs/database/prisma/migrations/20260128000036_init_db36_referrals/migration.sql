-- CreateTable
CREATE TABLE "referral_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "referrerReward" DECIMAL(10,2) NOT NULL,
    "refereeReward" DECIMAL(10,2),
    "rewardType" TEXT NOT NULL,
    "maxReferrals" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "referrerCustomerId" TEXT NOT NULL,
    "refereeEmail" TEXT NOT NULL,
    "refereeName" TEXT,
    "refereePhone" TEXT,
    "status" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "customerId" TEXT,
    "policyId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_rewards" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardAmount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_programs_code_key" ON "referral_programs"("code");

-- CreateIndex
CREATE INDEX "referral_programs_isActive_idx" ON "referral_programs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referralCode_key" ON "referrals"("referralCode");

-- CreateIndex
CREATE INDEX "referrals_programId_idx" ON "referrals"("programId");

-- CreateIndex
CREATE INDEX "referrals_referrerCustomerId_idx" ON "referrals"("referrerCustomerId");

-- CreateIndex
CREATE INDEX "referrals_status_idx" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "referral_rewards_referralId_idx" ON "referral_rewards"("referralId");

-- CreateIndex
CREATE INDEX "referral_rewards_recipientId_idx" ON "referral_rewards"("recipientId");

-- CreateIndex
CREATE INDEX "referral_rewards_status_idx" ON "referral_rewards"("status");

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_programId_fkey" FOREIGN KEY ("programId") REFERENCES "referral_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "referrals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
