-- CreateTable
CREATE TABLE "mortality_tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mortality_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loss_ratios" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "earnedPremium" DECIMAL(15,2) NOT NULL,
    "incurredClaims" DECIMAL(15,2) NOT NULL,
    "lossRatio" DECIMAL(5,4) NOT NULL,
    "claimCount" INTEGER NOT NULL,
    "policyCount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loss_ratios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserve_calculations" (
    "id" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "outstandingClaims" DECIMAL(15,2) NOT NULL,
    "ibnrReserve" DECIMAL(15,2) NOT NULL,
    "unearmedPremium" DECIMAL(15,2) NOT NULL,
    "totalReserve" DECIMAL(15,2) NOT NULL,
    "methodology" TEXT NOT NULL,
    "assumptions" JSONB,
    "calculatedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserve_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_models" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "baseRate" DECIMAL(10,4) NOT NULL,
    "factors" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mortality_tables_country_gender_year_idx" ON "mortality_tables"("country", "gender", "year");

-- CreateIndex
CREATE INDEX "loss_ratios_productId_idx" ON "loss_ratios"("productId");

-- CreateIndex
CREATE INDEX "loss_ratios_periodStart_periodEnd_idx" ON "loss_ratios"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "reserve_calculations_referenceDate_idx" ON "reserve_calculations"("referenceDate");

-- CreateIndex
CREATE INDEX "reserve_calculations_productId_idx" ON "reserve_calculations"("productId");

-- CreateIndex
CREATE INDEX "pricing_models_productId_idx" ON "pricing_models"("productId");

-- CreateIndex
CREATE INDEX "pricing_models_isActive_idx" ON "pricing_models"("isActive");
