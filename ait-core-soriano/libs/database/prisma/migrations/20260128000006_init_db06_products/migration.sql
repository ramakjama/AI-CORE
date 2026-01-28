-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "insurerId" TEXT NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "status" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_coverages" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultLimit" DECIMAL(12,2) NOT NULL,
    "defaultPremium" DECIMAL(10,2) NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_coverages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_rules" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_pricing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "riskProfile" TEXT NOT NULL,
    "ageFrom" INTEGER,
    "ageTo" INTEGER,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "multiplier" DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_type_idx" ON "products"("type");

-- CreateIndex
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex
CREATE INDEX "products_insurerId_idx" ON "products"("insurerId");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "product_coverages_productId_idx" ON "product_coverages"("productId");

-- CreateIndex
CREATE INDEX "product_rules_productId_idx" ON "product_rules"("productId");

-- CreateIndex
CREATE INDEX "product_pricing_productId_idx" ON "product_pricing"("productId");

-- AddForeignKey
ALTER TABLE "product_coverages" ADD CONSTRAINT "product_coverages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_rules" ADD CONSTRAINT "product_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_pricing" ADD CONSTRAINT "product_pricing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
