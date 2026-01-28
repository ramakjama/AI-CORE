-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "adjustment" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "valueType" TEXT NOT NULL,
    "applicableTo" TEXT[],
    "conditions" JSONB,
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surcharge_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "valueType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surcharge_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_calculations" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "discounts" JSONB NOT NULL,
    "surcharges" JSONB NOT NULL,
    "taxes" JSONB NOT NULL,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_rules_productId_idx" ON "pricing_rules"("productId");

-- CreateIndex
CREATE INDEX "pricing_rules_isActive_idx" ON "pricing_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "discount_rules_code_key" ON "discount_rules"("code");

-- CreateIndex
CREATE INDEX "discount_rules_isActive_idx" ON "discount_rules"("isActive");

-- CreateIndex
CREATE INDEX "discount_rules_validFrom_validTo_idx" ON "discount_rules"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "surcharge_rules_productId_idx" ON "surcharge_rules"("productId");

-- CreateIndex
CREATE INDEX "surcharge_rules_isActive_idx" ON "surcharge_rules"("isActive");

-- CreateIndex
CREATE INDEX "price_calculations_quoteId_idx" ON "price_calculations"("quoteId");
