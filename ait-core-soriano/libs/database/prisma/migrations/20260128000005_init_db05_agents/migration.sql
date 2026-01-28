-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "agentNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mobile" TEXT,
    "identityType" TEXT NOT NULL,
    "identityNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "managerId" TEXT,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "territory" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_certifications" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_territories" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "territory" TEXT NOT NULL,
    "postalCodes" TEXT[],
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_territories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agents_agentNumber_key" ON "agents"("agentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "agents_email_key" ON "agents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_identityNumber_key" ON "agents"("identityNumber");

-- CreateIndex
CREATE INDEX "agents_status_idx" ON "agents"("status");

-- CreateIndex
CREATE INDEX "agents_managerId_idx" ON "agents"("managerId");

-- CreateIndex
CREATE INDEX "agent_certifications_agentId_idx" ON "agent_certifications"("agentId");

-- CreateIndex
CREATE INDEX "agent_certifications_status_idx" ON "agent_certifications"("status");

-- CreateIndex
CREATE INDEX "agent_territories_agentId_idx" ON "agent_territories"("agentId");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_certifications" ADD CONSTRAINT "agent_certifications_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_territories" ADD CONSTRAINT "agent_territories_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
