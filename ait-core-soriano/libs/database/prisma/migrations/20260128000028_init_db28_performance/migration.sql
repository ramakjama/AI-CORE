-- CreateTable
CREATE TABLE "kpi_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "calculation" JSONB NOT NULL,
    "unit" TEXT NOT NULL,
    "target" DECIMAL(15,2),
    "frequency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpi_values" (
    "id" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "value" DECIMAL(15,2) NOT NULL,
    "target" DECIMAL(15,2),
    "variance" DECIMAL(15,2),
    "dimension1" TEXT,
    "dimension2" TEXT,
    "dimension3" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpi_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_scorecards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "agentId" TEXT,
    "teamId" TEXT,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metrics" JSONB NOT NULL,
    "totalScore" DECIMAL(5,2) NOT NULL,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "performance_scorecards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kpiId" TEXT NOT NULL,
    "targetValue" DECIMAL(15,2) NOT NULL,
    "currentValue" DECIMAL(15,2),
    "progress" DECIMAL(5,2),
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kpi_definitions_name_key" ON "kpi_definitions"("name");

-- CreateIndex
CREATE INDEX "kpi_definitions_category_idx" ON "kpi_definitions"("category");

-- CreateIndex
CREATE INDEX "kpi_values_kpiId_idx" ON "kpi_values"("kpiId");

-- CreateIndex
CREATE INDEX "kpi_values_periodStart_periodEnd_idx" ON "kpi_values"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "performance_scorecards_userId_idx" ON "performance_scorecards"("userId");

-- CreateIndex
CREATE INDEX "performance_scorecards_agentId_idx" ON "performance_scorecards"("agentId");

-- CreateIndex
CREATE INDEX "performance_scorecards_periodStart_periodEnd_idx" ON "performance_scorecards"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "performance_goals_userId_idx" ON "performance_goals"("userId");

-- CreateIndex
CREATE INDEX "performance_goals_kpiId_idx" ON "performance_goals"("kpiId");

-- CreateIndex
CREATE INDEX "performance_goals_status_idx" ON "performance_goals"("status");

-- AddForeignKey
ALTER TABLE "kpi_values" ADD CONSTRAINT "kpi_values_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpi_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_goals" ADD CONSTRAINT "performance_goals_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpi_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
