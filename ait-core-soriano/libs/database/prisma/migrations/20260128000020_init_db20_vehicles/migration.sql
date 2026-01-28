-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "color" TEXT,
    "fuelType" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "engineSize" INTEGER,
    "horsePower" INTEGER,
    "seats" INTEGER,
    "doors" INTEGER,
    "weight" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "currentValue" DECIMAL(10,2),
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_inspections" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "inspectorId" TEXT NOT NULL,
    "defects" JSONB,
    "notes" TEXT,
    "certificateNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_modifications" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "modificationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "modificationDate" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(10,2),
    "affectsPremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumImpact" DECIMAL(5,2),
    "declaredToPolicyAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_modifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_registrationNumber_key" ON "vehicles"("registrationNumber");

-- CreateIndex
CREATE INDEX "vehicles_customerId_idx" ON "vehicles"("customerId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicle_inspections_vehicleId_idx" ON "vehicle_inspections"("vehicleId");

-- CreateIndex
CREATE INDEX "vehicle_inspections_expiryDate_idx" ON "vehicle_inspections"("expiryDate");

-- CreateIndex
CREATE INDEX "vehicle_modifications_vehicleId_idx" ON "vehicle_modifications"("vehicleId");

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_modifications" ADD CONSTRAINT "vehicle_modifications_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
