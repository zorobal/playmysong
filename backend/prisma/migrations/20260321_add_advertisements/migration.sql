-- CreateAdvertisement
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- Add relationship to Establishment
ALTER TABLE "Advertisement" ADD CONSTRAINT "Advertisement_establishmentId_fkey" 
    FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for faster queries
CREATE INDEX "Advertisement_establishmentId_idx" ON "Advertisement"("establishmentId");
CREATE INDEX "Advertisement_isActive_idx" ON "Advertisement"("isActive");
