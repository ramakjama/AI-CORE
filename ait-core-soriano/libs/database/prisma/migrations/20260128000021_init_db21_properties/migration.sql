-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "propertyNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "usage" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'ES',
    "cadastralReference" TEXT,
    "constructionYear" INTEGER,
    "totalArea" INTEGER NOT NULL,
    "builtArea" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "floors" INTEGER,
    "hasGarage" BOOLEAN DEFAULT false,
    "hasPool" BOOLEAN DEFAULT false,
    "hasGarden" BOOLEAN DEFAULT false,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2),
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_valuations" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "valuationType" TEXT NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL,
    "valuedAmount" DECIMAL(12,2) NOT NULL,
    "valuerId" TEXT NOT NULL,
    "valuerCompany" TEXT,
    "methodology" TEXT,
    "notes" TEXT,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_risks" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mitigationMeasures" TEXT,
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_risks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "properties_propertyNumber_key" ON "properties"("propertyNumber");

-- CreateIndex
CREATE INDEX "properties_customerId_idx" ON "properties"("customerId");

-- CreateIndex
CREATE INDEX "properties_type_idx" ON "properties"("type");

-- CreateIndex
CREATE INDEX "properties_status_idx" ON "properties"("status");

-- CreateIndex
CREATE INDEX "properties_postalCode_idx" ON "properties"("postalCode");

-- CreateIndex
CREATE INDEX "property_valuations_propertyId_idx" ON "property_valuations"("propertyId");

-- CreateIndex
CREATE INDEX "property_valuations_valuationDate_idx" ON "property_valuations"("valuationDate");

-- CreateIndex
CREATE INDEX "property_risks_propertyId_idx" ON "property_risks"("propertyId");

-- CreateIndex
CREATE INDEX "property_risks_severity_idx" ON "property_risks"("severity");

-- AddForeignKey
ALTER TABLE "property_valuations" ADD CONSTRAINT "property_valuations_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_risks" ADD CONSTRAINT "property_risks_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
