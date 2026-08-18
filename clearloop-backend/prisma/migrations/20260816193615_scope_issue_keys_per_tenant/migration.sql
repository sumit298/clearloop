-- Issue keys were globally unique, so the second workspace to reach WEB-1
-- could not create that feature at all. Scope them per tenant instead.
DROP INDEX IF EXISTS "features_key_key";
DROP INDEX IF EXISTS "bug_reports_key_key";

CREATE UNIQUE INDEX "features_tenantId_key_key" ON "features"("tenantId", "key");
CREATE UNIQUE INDEX "bug_reports_tenantId_key_key" ON "bug_reports"("tenantId", "key");
