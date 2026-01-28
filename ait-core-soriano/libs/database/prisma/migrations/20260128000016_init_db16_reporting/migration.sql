-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "query" JSONB NOT NULL,
    "parameters" JSONB,
    "schedule" TEXT,
    "format" TEXT NOT NULL,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "resultUrl" TEXT,
    "rowCount" INTEGER,
    "fileSize" INTEGER,
    "errorMessage" TEXT,
    "executedBy" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "sharedWith" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reports_type_idx" ON "reports"("type");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- CreateIndex
CREATE INDEX "reports_createdBy_idx" ON "reports"("createdBy");

-- CreateIndex
CREATE INDEX "report_executions_reportId_idx" ON "report_executions"("reportId");

-- CreateIndex
CREATE INDEX "report_executions_status_idx" ON "report_executions"("status");

-- CreateIndex
CREATE INDEX "report_executions_startedAt_idx" ON "report_executions"("startedAt");

-- CreateIndex
CREATE INDEX "dashboards_ownerId_idx" ON "dashboards"("ownerId");

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
