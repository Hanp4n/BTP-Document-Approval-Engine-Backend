-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Documents" (
    "id" SERIAL NOT NULL,
    "supplierName" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "approvalLevelRequired" INTEGER NOT NULL DEFAULT 0,
    "currentApprovalStep" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);
