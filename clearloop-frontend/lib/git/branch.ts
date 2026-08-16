/**
 * Branch names ClearLoop suggests for a piece of work.
 *
 * Mirrors the backend's issue-key helper. Only the `<key>` portion is used for
 * linking — the trailing slug is there for the developer reading the branch
 * list, and the webhook matcher ignores it. That means small differences
 * between this and the server's slug can never break auto-linking.
 */

export function slugify(value: string, maxLength = 40): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length <= maxLength) return slug;

  const truncated = slug.slice(0, maxLength);
  const lastHyphen = truncated.lastIndexOf("-");
  return (lastHyphen > 12 ? truncated.slice(0, lastHyphen) : truncated).replace(
    /-+$/,
    "",
  );
}

export function featureBranchName(feature: {
  id: string;
  key?: string | null;
  title: string;
}): string {
  // Features created before issue keys existed still link by id, so the
  // instruction on screen stays correct rather than aspirational.
  if (!feature.key) return `feature/${feature.id}`;
  const slug = slugify(feature.title);
  return slug
    ? `feature/${feature.key.toLowerCase()}-${slug}`
    : `feature/${feature.key.toLowerCase()}`;
}

export function bugBranchName(bug: {
  id: string;
  key?: string | null;
  title: string;
}): string {
  if (!bug.key) return `bug/${bug.id}`;
  const slug = slugify(bug.title);
  return slug
    ? `bug/${bug.key.toLowerCase()}-${slug}`
    : `bug/${bug.key.toLowerCase()}`;
}

export function checkoutCommand(branch: string): string {
  return `git checkout -b ${branch}`;
}
