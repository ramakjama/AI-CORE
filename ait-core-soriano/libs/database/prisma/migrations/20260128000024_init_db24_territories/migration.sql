-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" TEXT,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "province" TEXT,
    "postalCodes" TEXT[],
    "riskLevel" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territory_risks" (
    "id" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "probability" DECIMAL(5,4) NOT NULL,
    "impact" TEXT NOT NULL,
    "description" TEXT,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territory_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territory_statistics" (
    "id" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "population" INTEGER,
    "gdpPerCapita" DECIMAL(10,2),
    "crimeRate" DECIMAL(5,2),
    "accidentRate" DECIMAL(5,2),
    "weatherEvents" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territory_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "territories_code_key" ON "territories"("code");

-- CreateIndex
CREATE INDEX "territories_type_idx" ON "territories"("type");

-- CreateIndex
CREATE INDEX "territories_parentId_idx" ON "territories"("parentId");

-- CreateIndex
CREATE INDEX "territories_country_idx" ON "territories"("country");

-- CreateIndex
CREATE INDEX "territory_risks_territoryId_idx" ON "territory_risks"("territoryId");

-- CreateIndex
CREATE INDEX "territory_risks_riskType_idx" ON "territory_risks"("riskType");

-- CreateIndex
CREATE INDEX "territory_statistics_territoryId_idx" ON "territory_statistics"("territoryId");

-- CreateIndex
CREATE INDEX "territory_statistics_year_idx" ON "territory_statistics"("year");

-- AddForeignKey
ALTER TABLE "territories" ADD CONSTRAINT "territories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territory_risks" ADD CONSTRAINT "territory_risks_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "territory_statistics" ADD CONSTRAINT "territory_statistics_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
