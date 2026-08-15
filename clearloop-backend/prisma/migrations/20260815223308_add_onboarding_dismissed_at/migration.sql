-- Tracks per-membership dismissal of the role onboarding panel.
-- Nullable and additive: existing rows read as "not yet dismissed", which is
-- the correct default, so this is safe to apply to a live database.
ALTER TABLE "workspace_members" ADD COLUMN     "onboardingDismissedAt" TIMESTAMP(3);
