-- Add OAuth fields to User table
ALTER TABLE "users" ADD COLUMN "googleId" TEXT;
ALTER TABLE "users" ADD COLUMN "githubId" TEXT;
ALTER TABLE "users" ADD COLUMN "oauthProvider" TEXT;

-- Make password optional for OAuth users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Add unique constraints for OAuth IDs
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId") WHERE "googleId" IS NOT NULL;
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId") WHERE "githubId" IS NOT NULL;
