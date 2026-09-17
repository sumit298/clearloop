-- CreateEnum
CREATE TYPE "NotificationSeverity" AS ENUM ('INFO', 'WARNING', 'ALERT');

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actorName" TEXT,
    "severity" "NotificationSeverity" NOT NULL,
    "featureId" TEXT,
    "bugReportId" TEXT,
    "pullRequestId" TEXT,
    "deduplicationKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_memberId_severity_createdAt_idx" ON "notifications"("memberId", "severity", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "notifications_memberId_readAt_idx" ON "notifications"("memberId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_memberId_deduplicationKey_key" ON "notifications"("memberId", "deduplicationKey");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
