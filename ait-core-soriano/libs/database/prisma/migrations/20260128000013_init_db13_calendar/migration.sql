-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "organizer" TEXT NOT NULL,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_attendees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reminderTime" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_organizer_idx" ON "events"("organizer");

-- CreateIndex
CREATE INDEX "events_startTime_idx" ON "events"("startTime");

-- CreateIndex
CREATE INDEX "events_type_idx" ON "events"("type");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "event_attendees_eventId_idx" ON "event_attendees"("eventId");

-- CreateIndex
CREATE INDEX "event_attendees_userId_idx" ON "event_attendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_attendees_eventId_userId_key" ON "event_attendees"("eventId", "userId");

-- CreateIndex
CREATE INDEX "event_reminders_eventId_idx" ON "event_reminders"("eventId");

-- CreateIndex
CREATE INDEX "event_reminders_userId_idx" ON "event_reminders"("userId");

-- CreateIndex
CREATE INDEX "event_reminders_reminderTime_idx" ON "event_reminders"("reminderTime");

-- AddForeignKey
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
