/*
  Warnings:

  - You are about to drop the column `userId` on the `activity_logs` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `invitedBy` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `invitations` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `project_members` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `project_members` table. All the data in the column will be lost.
  - You are about to drop the column `githubInstallationId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `githubRepoId` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `githubRepoUrl` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `githubPrId` on the `pull_requests` table. All the data in the column will be lost.
  - You are about to drop the column `githubInstallationId` on the `tenants` table. All the data in the column will be lost.
  - You are about to drop the column `designation` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `githubId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `githubUsername` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `googleId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `invitedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `invitedBy` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `oauthProvider` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,id]` on the table `activity_logs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `bug_reports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,number]` on the table `bug_reports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `bug_reports` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `comments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key]` on the table `features` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,number]` on the table `features` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `features` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenHash]` on the table `invitations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `invitations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,memberId]` on the table `project_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `project_members` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,key]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `projects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[githubNodeId]` on the table `pull_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[repositoryId,githubPrNumber]` on the table `pull_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `pull_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `release_features` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,version]` on the table `releases` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,id]` on the table `releases` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `memberId` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `invitations` table without a default value. This is not possible if the table is not empty.
  - Made the column `expiresAt` on table `invitations` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `memberId` to the `project_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `project_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `project_members` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `release_features` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PullRequestSource" AS ENUM ('GITHUB', 'MANUAL');

-- CreateEnum
CREATE TYPE "AiStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "LinkSource" AS ENUM ('AUTO_BRANCH', 'AUTO_BODY', 'AUTO_COMMIT', 'MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReleaseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'SYSTEM', 'GITHUB');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('FEATURE', 'BUG_REPORT', 'PULL_REQUEST', 'RELEASE', 'PROJECT', 'WORKSPACE', 'USER', 'INVITATION', 'GITHUB');

-- CreateEnum
CREATE TYPE "GitHubInstallationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'REMOVED');

-- CreateEnum
CREATE TYPE "LoginSessionStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "FeatureStatus" ADD VALUE 'BACKLOG';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TenantPlan" ADD VALUE 'TRIAL';
ALTER TYPE "TenantPlan" ADD VALUE 'ENTERPRISE';

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_featureId_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_userId_fkey";

-- DropForeignKey
ALTER TABLE "bug_reports" DROP CONSTRAINT "bug_reports_reportedById_fkey";

-- DropForeignKey
ALTER TABLE "bug_reports" DROP CONSTRAINT "bug_reports_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_bugReportId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_featureId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_userId_fkey";

-- DropForeignKey
ALTER TABLE "features" DROP CONSTRAINT "features_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "features" DROP CONSTRAINT "features_createdById_fkey";

-- DropForeignKey
ALTER TABLE "features" DROP CONSTRAINT "features_projectId_fkey";

-- DropForeignKey
ALTER TABLE "features" DROP CONSTRAINT "features_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_projectId_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_userId_fkey";

-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "pull_requests" DROP CONSTRAINT "pull_requests_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "release_features" DROP CONSTRAINT "release_features_featureId_fkey";

-- DropForeignKey
ALTER TABLE "release_features" DROP CONSTRAINT "release_features_releaseId_fkey";

-- DropForeignKey
ALTER TABLE "releases" DROP CONSTRAINT "releases_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenantId_fkey";

-- DropIndex
DROP INDEX "invitations_tenantId_email_key";

-- DropIndex
DROP INDEX "invitations_token_key";

-- DropIndex
DROP INDEX "project_members_projectId_userId_key";

-- DropIndex
DROP INDEX "users_githubId_key";

-- DropIndex
DROP INDEX "users_googleId_key";

-- DropIndex
DROP INDEX "users_tenantId_email_key";

-- AlterTable
ALTER TABLE "activity_logs" DROP COLUMN "userId",
ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "actorType" "ActorType" NOT NULL DEFAULT 'USER',
ADD COLUMN     "bugReportId" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" "EntityType",
ADD COLUMN     "memberId" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "pullRequestId" TEXT,
ADD COLUMN     "releaseId" TEXT;

-- AlterTable
ALTER TABLE "bug_reports" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedById" TEXT,
ADD COLUMN     "key" TEXT,
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "resolvedAt" TIMESTAMP(3),
ADD COLUMN     "resolvedByPrId" TEXT;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "userId",
ADD COLUMN     "memberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "features" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "key" TEXT,
ADD COLUMN     "number" INTEGER,
ADD COLUMN     "releasedAt" TIMESTAMP(3),
ADD COLUMN     "startedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "invitations" DROP COLUMN "invitedBy",
DROP COLUMN "token",
ADD COLUMN     "acceptedByMemberId" TEXT,
ADD COLUMN     "invitedByMemberId" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "tokenHash" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "expiresAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "project_members" DROP COLUMN "role",
DROP COLUMN "userId",
ADD COLUMN     "addedByMemberId" TEXT,
ADD COLUMN     "memberId" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "githubInstallationId",
DROP COLUMN "githubRepoId",
DROP COLUMN "githubRepoUrl",
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "key" TEXT,
ADD COLUMN     "nextIssueNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "pull_requests" DROP COLUMN "githubPrId",
ADD COLUMN     "additions" INTEGER,
ADD COLUMN     "aiError" TEXT,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiReleaseNote" TEXT,
ADD COLUMN     "aiRisk" TEXT,
ADD COLUMN     "aiStatus" "AiStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "aiTokensUsed" INTEGER,
ADD COLUMN     "aiUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "authorGithubLogin" TEXT,
ADD COLUMN     "authorMemberId" TEXT,
ADD COLUMN     "baseBranch" TEXT,
ADD COLUMN     "bugReportId" TEXT,
ADD COLUMN     "changedFiles" INTEGER,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "deletions" INTEGER,
ADD COLUMN     "githubCreatedAt" TIMESTAMP(3),
ADD COLUMN     "githubDatabaseId" TEXT,
ADD COLUMN     "githubNodeId" TEXT,
ADD COLUMN     "githubPrNumber" INTEGER,
ADD COLUMN     "headBranch" TEXT,
ADD COLUMN     "isDraft" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkSource" "LinkSource",
ADD COLUMN     "linkedAt" TIMESTAMP(3),
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "repositoryId" TEXT,
ADD COLUMN     "source" "PullRequestSource" NOT NULL DEFAULT 'GITHUB',
ALTER COLUMN "githubPrUrl" DROP NOT NULL,
ALTER COLUMN "author" DROP NOT NULL;

-- AlterTable
ALTER TABLE "release_features" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "releases" ADD COLUMN     "aiStatus" "AiStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "publishedById" TEXT,
ADD COLUMN     "status" "ReleaseStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "tenants" DROP COLUMN "githubInstallationId",
ADD COLUMN     "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "designation",
DROP COLUMN "githubId",
DROP COLUMN "githubUsername",
DROP COLUMN "googleId",
DROP COLUMN "invitedAt",
DROP COLUMN "invitedBy",
DROP COLUMN "oauthProvider",
DROP COLUMN "password",
DROP COLUMN "role",
DROP COLUMN "tenantId",
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "auth_identities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT,
    "avatarUrl" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'DEVELOPER',
    "designation" TEXT,
    "githubUsername" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "invitedAt" TIMESTAMP(3),
    "invitedByMemberId" TEXT,
    "joinedAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "release_bugs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "releaseId" TEXT NOT NULL,
    "bugReportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_bugs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_installations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "githubInstallationId" TEXT NOT NULL,
    "accountId" TEXT,
    "accountLogin" TEXT,
    "accountType" TEXT,
    "status" "GitHubInstallationStatus" NOT NULL DEFAULT 'ACTIVE',
    "suspendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_installations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_repositories" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "installationId" TEXT NOT NULL,
    "projectId" TEXT,
    "githubRepoId" TEXT NOT NULL,
    "githubNodeId" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT,
    "webhookActive" BOOLEAN NOT NULL DEFAULT false,
    "lastWebhookAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "github_install_states" (
    "nonce" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT,
    "projectId" TEXT,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_install_states_pkey" PRIMARY KEY ("nonce")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "action" TEXT,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB,
    "error" TEXT,
    "tenantId" TEXT,
    "installationId" TEXT,
    "repositoryId" TEXT,
    "pullRequestId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "memberId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedByTokenHash" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "status" "LoginSessionStatus" NOT NULL DEFAULT 'PENDING',
    "workspaces" JSONB,
    "selectedTenantId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auth_identities_userId_idx" ON "auth_identities"("userId");

-- CreateIndex
CREATE INDEX "auth_identities_email_idx" ON "auth_identities"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_provider_providerAccountId_key" ON "auth_identities"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "workspace_members_tenantId_isActive_idx" ON "workspace_members"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "workspace_members_tenantId_email_idx" ON "workspace_members"("tenantId", "email");

-- CreateIndex
CREATE INDEX "workspace_members_email_idx" ON "workspace_members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_userId_tenantId_key" ON "workspace_members"("userId", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_tenantId_id_key" ON "workspace_members"("tenantId", "id");

-- CreateIndex
CREATE INDEX "release_bugs_tenantId_idx" ON "release_bugs"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "release_bugs_releaseId_bugReportId_key" ON "release_bugs"("releaseId", "bugReportId");

-- CreateIndex
CREATE UNIQUE INDEX "release_bugs_tenantId_id_key" ON "release_bugs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "github_installations_githubInstallationId_key" ON "github_installations"("githubInstallationId");

-- CreateIndex
CREATE INDEX "github_installations_tenantId_idx" ON "github_installations"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "github_installations_tenantId_id_key" ON "github_installations"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_githubRepoId_key" ON "github_repositories"("githubRepoId");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_githubNodeId_key" ON "github_repositories"("githubNodeId");

-- CreateIndex
CREATE INDEX "github_repositories_tenantId_idx" ON "github_repositories"("tenantId");

-- CreateIndex
CREATE INDEX "github_repositories_installationId_idx" ON "github_repositories"("installationId");

-- CreateIndex
CREATE INDEX "github_repositories_projectId_idx" ON "github_repositories"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_tenantId_id_key" ON "github_repositories"("tenantId", "id");

-- CreateIndex
CREATE INDEX "github_install_states_tenantId_expiresAt_idx" ON "github_install_states"("tenantId", "expiresAt");

-- CreateIndex
CREATE INDEX "github_install_states_expiresAt_idx" ON "github_install_states"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_deliveryId_key" ON "webhook_events"("deliveryId");

-- CreateIndex
CREATE INDEX "webhook_events_status_eventType_idx" ON "webhook_events"("status", "eventType");

-- CreateIndex
CREATE INDEX "webhook_events_status_idx" ON "webhook_events"("status");

-- CreateIndex
CREATE INDEX "webhook_events_tenantId_idx" ON "webhook_events"("tenantId");

-- CreateIndex
CREATE INDEX "webhook_events_installationId_idx" ON "webhook_events"("installationId");

-- CreateIndex
CREATE INDEX "webhook_events_repositoryId_idx" ON "webhook_events"("repositoryId");

-- CreateIndex
CREATE INDEX "webhook_events_pullRequestId_idx" ON "webhook_events"("pullRequestId");

-- CreateIndex
CREATE INDEX "webhook_events_nextRetryAt_idx" ON "webhook_events"("nextRetryAt");

-- CreateIndex
CREATE INDEX "webhook_events_receivedAt_idx" ON "webhook_events"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_revokedAt_idx" ON "refresh_tokens"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_memberId_idx" ON "refresh_tokens"("memberId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "login_sessions_tokenHash_key" ON "login_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "login_sessions_userId_idx" ON "login_sessions"("userId");

-- CreateIndex
CREATE INDEX "login_sessions_expiresAt_idx" ON "login_sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "email_verification_tokens_email_idx" ON "email_verification_tokens"("email");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_featureId_idx" ON "activity_logs"("tenantId", "featureId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_bugReportId_idx" ON "activity_logs"("tenantId", "bugReportId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_pullRequestId_idx" ON "activity_logs"("tenantId", "pullRequestId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_releaseId_idx" ON "activity_logs"("tenantId", "releaseId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_projectId_idx" ON "activity_logs"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_entityType_entityId_idx" ON "activity_logs"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_createdAt_idx" ON "activity_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "activity_logs_tenantId_id_key" ON "activity_logs"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "bug_reports_key_key" ON "bug_reports"("key");

-- CreateIndex
CREATE INDEX "bug_reports_tenantId_status_idx" ON "bug_reports"("tenantId", "status");

-- CreateIndex
CREATE INDEX "bug_reports_tenantId_projectId_idx" ON "bug_reports"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "bug_reports_featureId_idx" ON "bug_reports"("featureId");

-- CreateIndex
CREATE INDEX "bug_reports_resolvedByPrId_idx" ON "bug_reports"("resolvedByPrId");

-- CreateIndex
CREATE INDEX "bug_reports_assignedToId_idx" ON "bug_reports"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "bug_reports_projectId_number_key" ON "bug_reports"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "bug_reports_tenantId_id_key" ON "bug_reports"("tenantId", "id");

-- CreateIndex
CREATE INDEX "comments_tenantId_idx" ON "comments"("tenantId");

-- CreateIndex
CREATE INDEX "comments_featureId_idx" ON "comments"("featureId");

-- CreateIndex
CREATE INDEX "comments_bugReportId_idx" ON "comments"("bugReportId");

-- CreateIndex
CREATE INDEX "comments_memberId_idx" ON "comments"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "comments_tenantId_id_key" ON "comments"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "features_key_key" ON "features"("key");

-- CreateIndex
CREATE INDEX "features_tenantId_projectId_idx" ON "features"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "features_tenantId_status_idx" ON "features"("tenantId", "status");

-- CreateIndex
CREATE INDEX "features_assignedToId_idx" ON "features"("assignedToId");

-- CreateIndex
CREATE INDEX "features_createdById_idx" ON "features"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "features_projectId_number_key" ON "features"("projectId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "features_tenantId_id_key" ON "features"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tokenHash_key" ON "invitations"("tokenHash");

-- CreateIndex
CREATE INDEX "invitations_tenantId_email_idx" ON "invitations"("tenantId", "email");

-- CreateIndex
CREATE INDEX "invitations_status_idx" ON "invitations"("status");

-- CreateIndex
CREATE INDEX "invitations_expiresAt_idx" ON "invitations"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_tenantId_id_key" ON "invitations"("tenantId", "id");

-- CreateIndex
CREATE INDEX "project_members_tenantId_idx" ON "project_members"("tenantId");

-- CreateIndex
CREATE INDEX "project_members_memberId_idx" ON "project_members"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_memberId_key" ON "project_members"("projectId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_tenantId_id_key" ON "project_members"("tenantId", "id");

-- CreateIndex
CREATE INDEX "projects_tenantId_idx" ON "projects"("tenantId");

-- CreateIndex
CREATE INDEX "projects_tenantId_archivedAt_idx" ON "projects"("tenantId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tenantId_key_key" ON "projects"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "projects_tenantId_id_key" ON "projects"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "pull_requests_githubNodeId_key" ON "pull_requests"("githubNodeId");

-- CreateIndex
CREATE INDEX "pull_requests_tenantId_status_idx" ON "pull_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "pull_requests_tenantId_projectId_idx" ON "pull_requests"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "pull_requests_tenantId_repositoryId_idx" ON "pull_requests"("tenantId", "repositoryId");

-- CreateIndex
CREATE INDEX "pull_requests_repositoryId_status_idx" ON "pull_requests"("repositoryId", "status");

-- CreateIndex
CREATE INDEX "pull_requests_featureId_idx" ON "pull_requests"("featureId");

-- CreateIndex
CREATE INDEX "pull_requests_bugReportId_idx" ON "pull_requests"("bugReportId");

-- CreateIndex
CREATE INDEX "pull_requests_authorMemberId_idx" ON "pull_requests"("authorMemberId");

-- CreateIndex
CREATE INDEX "pull_requests_aiStatus_idx" ON "pull_requests"("aiStatus");

-- CreateIndex
CREATE UNIQUE INDEX "pull_requests_repositoryId_githubPrNumber_key" ON "pull_requests"("repositoryId", "githubPrNumber");

-- CreateIndex
CREATE UNIQUE INDEX "pull_requests_tenantId_id_key" ON "pull_requests"("tenantId", "id");

-- CreateIndex
CREATE INDEX "release_features_tenantId_idx" ON "release_features"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "release_features_tenantId_id_key" ON "release_features"("tenantId", "id");

-- CreateIndex
CREATE INDEX "releases_tenantId_status_idx" ON "releases"("tenantId", "status");

-- CreateIndex
CREATE INDEX "releases_projectId_idx" ON "releases"("projectId");

-- CreateIndex
CREATE INDEX "releases_aiStatus_idx" ON "releases"("aiStatus");

-- CreateIndex
CREATE UNIQUE INDEX "releases_tenantId_version_key" ON "releases"("tenantId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "releases_tenantId_id_key" ON "releases"("tenantId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_invitedByMemberId_fkey" FOREIGN KEY ("invitedByMemberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedByMemberId_fkey" FOREIGN KEY ("invitedByMemberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_acceptedByMemberId_fkey" FOREIGN KEY ("acceptedByMemberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_addedByMemberId_fkey" FOREIGN KEY ("addedByMemberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "workspace_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "features" ADD CONSTRAINT "features_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "workspace_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bug_reports" ADD CONSTRAINT "bug_reports_resolvedByPrId_fkey" FOREIGN KEY ("resolvedByPrId") REFERENCES "pull_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "github_repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "bug_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "releases" ADD CONSTRAINT "releases_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_features" ADD CONSTRAINT "release_features_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_features" ADD CONSTRAINT "release_features_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_features" ADD CONSTRAINT "release_features_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_bugs" ADD CONSTRAINT "release_bugs_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_bugs" ADD CONSTRAINT "release_bugs_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "bug_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "release_bugs" ADD CONSTRAINT "release_bugs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "bug_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "bug_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_installations" ADD CONSTRAINT "github_installations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "github_installations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_repositories" ADD CONSTRAINT "github_repositories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_install_states" ADD CONSTRAINT "github_install_states_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_install_states" ADD CONSTRAINT "github_install_states_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "workspace_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "github_install_states" ADD CONSTRAINT "github_install_states_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_installationId_fkey" FOREIGN KEY ("installationId") REFERENCES "github_installations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "github_repositories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "workspace_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_sessions" ADD CONSTRAINT "login_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
