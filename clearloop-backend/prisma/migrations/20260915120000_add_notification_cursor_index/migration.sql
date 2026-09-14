-- Keep notification pagination aligned with its createdAt/id cursor ordering.
DROP INDEX IF EXISTS "notifications_memberId_severity_createdAt_idx";

CREATE INDEX "notifications_memberId_severity_createdAt_id_idx"
ON "notifications"("memberId", "severity", "createdAt" DESC, "id" DESC);
