-- CreateEnum
CREATE TYPE "BusinessMode" AS ENUM ('SCHEDULED_SERVICE', 'ON_DEMAND_REQUEST', 'DELIVERY_ORDER', 'HYBRID');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('OPEN', 'IN_NEGOTIATION', 'ACCEPTED', 'CANCELLED', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ServiceProposalStatus" AS ENUM ('SENT', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN "mode" "BusinessMode" NOT NULL DEFAULT 'SCHEDULED_SERVICE';

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "categoryId" TEXT,
    "addressId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "budgetMinCents" INTEGER,
    "budgetMaxCents" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'OPEN',
    "acceptedProposalId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequestProposal" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "estimatedPriceCents" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "status" "ServiceProposalStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequestProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceRequest_clientId_createdAt_idx" ON "ServiceRequest"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_categoryId_idx" ON "ServiceRequest"("categoryId");

-- CreateIndex
CREATE INDEX "ServiceRequest_city_status_idx" ON "ServiceRequest"("city", "status");

-- CreateIndex
CREATE INDEX "ServiceRequest_status_createdAt_idx" ON "ServiceRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequestProposal_requestId_businessId_key" ON "ServiceRequestProposal"("requestId", "businessId");

-- CreateIndex
CREATE INDEX "ServiceRequestProposal_businessId_createdAt_idx" ON "ServiceRequestProposal"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "UserAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestProposal" ADD CONSTRAINT "ServiceRequestProposal_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequestProposal" ADD CONSTRAINT "ServiceRequestProposal_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
