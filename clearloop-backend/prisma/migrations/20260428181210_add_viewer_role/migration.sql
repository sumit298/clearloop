-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'DEVELOPER';
