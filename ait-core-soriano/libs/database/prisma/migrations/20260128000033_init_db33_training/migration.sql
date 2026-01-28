-- CreateTable
CREATE TABLE "training_courses" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "format" TEXT NOT NULL,
    "instructor" TEXT,
    "maxParticipants" INTEGER,
    "price" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "prerequisites" TEXT[],
    "objectives" TEXT[],
    "content" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_sessions" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "meetingUrl" TEXT,
    "instructor" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_enrollments" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" DECIMAL(5,2),
    "certificateUrl" TEXT,
    "feedback" TEXT,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_assessments" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "maxScore" DECIMAL(5,2) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "feedback" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "training_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_courses_code_key" ON "training_courses"("code");

-- CreateIndex
CREATE INDEX "training_courses_category_idx" ON "training_courses"("category");

-- CreateIndex
CREATE INDEX "training_courses_isActive_idx" ON "training_courses"("isActive");

-- CreateIndex
CREATE INDEX "training_sessions_courseId_idx" ON "training_sessions"("courseId");

-- CreateIndex
CREATE INDEX "training_sessions_startDate_idx" ON "training_sessions"("startDate");

-- CreateIndex
CREATE INDEX "training_sessions_status_idx" ON "training_sessions"("status");

-- CreateIndex
CREATE INDEX "training_enrollments_sessionId_idx" ON "training_enrollments"("sessionId");

-- CreateIndex
CREATE INDEX "training_enrollments_userId_idx" ON "training_enrollments"("userId");

-- CreateIndex
CREATE INDEX "training_enrollments_status_idx" ON "training_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "training_enrollments_sessionId_userId_key" ON "training_enrollments"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "training_assessments_enrollmentId_idx" ON "training_assessments"("enrollmentId");

-- AddForeignKey
ALTER TABLE "training_sessions" ADD CONSTRAINT "training_sessions_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "training_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_enrollments" ADD CONSTRAINT "training_enrollments_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "training_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_assessments" ADD CONSTRAINT "training_assessments_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "training_enrollments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
