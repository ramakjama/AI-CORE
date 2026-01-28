-- CreateTable
CREATE TABLE "surveys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "respondentId" TEXT,
    "respondentType" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DECIMAL(5,2),
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_analytics" (
    "id" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "totalResponses" INTEGER NOT NULL,
    "averageScore" DECIMAL(5,2),
    "completionRate" DECIMAL(5,2),
    "responsesBySegment" JSONB,
    "questionAnalysis" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "surveys_type_idx" ON "surveys"("type");

-- CreateIndex
CREATE INDEX "surveys_isActive_idx" ON "surveys"("isActive");

-- CreateIndex
CREATE INDEX "survey_responses_surveyId_idx" ON "survey_responses"("surveyId");

-- CreateIndex
CREATE INDEX "survey_responses_respondentId_idx" ON "survey_responses"("respondentId");

-- CreateIndex
CREATE INDEX "survey_analytics_surveyId_idx" ON "survey_analytics"("surveyId");

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_analytics" ADD CONSTRAINT "survey_analytics_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
