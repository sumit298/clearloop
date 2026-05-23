/*
  Warnings:

  - A unique constraint covering the columns `[githubId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "invitedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "oauthProvider" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_githubId_key" ON "users"("githubId");
