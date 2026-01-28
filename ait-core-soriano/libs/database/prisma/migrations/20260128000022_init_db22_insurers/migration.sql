-- CreateTable
CREATE TABLE "insurers" (
    "id" TEXT NOT NULL,
    "insurerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "rating" TEXT,
    "ratingAgency" TEXT,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurer_contacts" (
    "id" TEXT NOT NULL,
    "insurerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "department" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurer_agreements" (
    "id" TEXT NOT NULL,
    "insurerId" TEXT NOT NULL,
    "agreementType" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "paymentTerms" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "terms" TEXT,
    "documentUrl" TEXT,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurer_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurers_insurerCode_key" ON "insurers"("insurerCode");

-- CreateIndex
CREATE UNIQUE INDEX "insurers_taxId_key" ON "insurers"("taxId");

-- CreateIndex
CREATE INDEX "insurers_status_idx" ON "insurers"("status");

-- CreateIndex
CREATE INDEX "insurer_contacts_insurerId_idx" ON "insurer_contacts"("insurerId");

-- CreateIndex
CREATE INDEX "insurer_contacts_email_idx" ON "insurer_contacts"("email");

-- CreateIndex
CREATE INDEX "insurer_agreements_insurerId_idx" ON "insurer_agreements"("insurerId");

-- CreateIndex
CREATE INDEX "insurer_agreements_status_idx" ON "insurer_agreements"("status");

-- AddForeignKey
ALTER TABLE "insurer_contacts" ADD CONSTRAINT "insurer_contacts_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "insurers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurer_agreements" ADD CONSTRAINT "insurer_agreements_insurerId_fkey" FOREIGN KEY ("insurerId") REFERENCES "insurers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
