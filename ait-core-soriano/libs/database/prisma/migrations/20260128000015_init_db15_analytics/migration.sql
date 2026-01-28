-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "properties" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "pageViews" INTEGER DEFAULT 0,
    "device" TEXT,
    "browser" TEXT,
    "platform" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,

    CONSTRAINT "analytics_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DECIMAL(15,2) NOT NULL,
    "dimension1" TEXT,
    "dimension2" TEXT,
    "dimension3" TEXT,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analytics_events_eventType_idx" ON "analytics_events"("eventType");

-- CreateIndex
CREATE INDEX "analytics_events_userId_idx" ON "analytics_events"("userId");

-- CreateIndex
CREATE INDEX "analytics_events_sessionId_idx" ON "analytics_events"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_events_timestamp_idx" ON "analytics_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_sessions_sessionId_key" ON "analytics_sessions"("sessionId");

-- CreateIndex
CREATE INDEX "analytics_sessions_userId_idx" ON "analytics_sessions"("userId");

-- CreateIndex
CREATE INDEX "analytics_sessions_startTime_idx" ON "analytics_sessions"("startTime");

-- CreateIndex
CREATE INDEX "analytics_metrics_metricName_idx" ON "analytics_metrics"("metricName");

-- CreateIndex
CREATE INDEX "analytics_metrics_periodStart_periodEnd_idx" ON "analytics_metrics"("periodStart", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_metrics_metricName_dimension1_dimension2_dimension_key" ON "analytics_metrics"("metricName", "dimension1", "dimension2", "dimension3", "periodStart");
