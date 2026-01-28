-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" JSONB,
    "stackTrace" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestBody" JSONB,
    "responseBody" JSONB,
    "duration" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "userId" TEXT,
    "ipAddress" TEXT,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");

-- CreateIndex
CREATE INDEX "system_logs_service_idx" ON "system_logs"("service");

-- CreateIndex
CREATE INDEX "system_logs_timestamp_idx" ON "system_logs"("timestamp");

-- CreateIndex
CREATE INDEX "api_logs_method_idx" ON "api_logs"("method");

-- CreateIndex
CREATE INDEX "api_logs_path_idx" ON "api_logs"("path");

-- CreateIndex
CREATE INDEX "api_logs_statusCode_idx" ON "api_logs"("statusCode");

-- CreateIndex
CREATE INDEX "api_logs_userId_idx" ON "api_logs"("userId");

-- CreateIndex
CREATE INDEX "api_logs_timestamp_idx" ON "api_logs"("timestamp");

-- CreateIndex
CREATE INDEX "security_events_eventType_idx" ON "security_events"("eventType");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "security_events_userId_idx" ON "security_events"("userId");

-- CreateIndex
CREATE INDEX "security_events_resolved_idx" ON "security_events"("resolved");

-- CreateIndex
CREATE INDEX "security_events_timestamp_idx" ON "security_events"("timestamp");
