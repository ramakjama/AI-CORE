-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "context" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_step_executions" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_step_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_definitions_type_idx" ON "workflow_definitions"("type");

-- CreateIndex
CREATE INDEX "workflow_definitions_isActive_idx" ON "workflow_definitions"("isActive");

-- CreateIndex
CREATE INDEX "workflow_instances_definitionId_idx" ON "workflow_instances"("definitionId");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_startedAt_idx" ON "workflow_instances"("startedAt");

-- CreateIndex
CREATE INDEX "workflow_step_executions_instanceId_idx" ON "workflow_step_executions"("instanceId");

-- CreateIndex
CREATE INDEX "workflow_step_executions_status_idx" ON "workflow_step_executions"("status");

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_step_executions" ADD CONSTRAINT "workflow_step_executions_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
