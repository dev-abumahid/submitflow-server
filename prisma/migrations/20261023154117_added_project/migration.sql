-- CreateEnum
CREATE TYPE "STATUS" AS ENUM ('PENDING', 'IN_PROGRESS', 'REJECTED', 'APPROVED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "gitRepoUrl" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "reviewerFeedBack" TEXT,
    "status" "STATUS" NOT NULL DEFAULT 'PENDING',
    "submitterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_submitterId_idx" ON "Project"("submitterId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
