-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- CreateTable
CREATE TABLE "Prospects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'New',
    "category" TEXT,
    "inquiryDate" TIMESTAMP(3),

    CONSTRAINT "Prospects_pkey" PRIMARY KEY ("id")
);
