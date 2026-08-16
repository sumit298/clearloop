/**
 * Human-friendly issue keys and branch names.
 *
 * The schema always intended this ("Human-friendly project key, e.g. WEB",
 * "Used to generate issue keys like WEB-12") but nothing populated the fields,
 * so branches fell back to raw UUIDs like `feature/126cbfe2-0de3-...`, which
 * no developer is going to type or read.
 */

/**
 * "Web App" -> "WEB", "API Gateway" -> "API", "payments" -> "PAY".
 *
 * Uses the first word rather than initials: WEB-12 is recognisable at a glance
 * in a branch name, WA-12 is not. Three characters matches the convention
 * developers already know from issue trackers.
 */
export function deriveProjectKey(name: string): string {
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  // The key must start with a letter: issue keys are parsed out of branch
  // names, and a numeric-leading key ("2026 Roadmap" -> 202-1) is
  // indistinguishable from the rest of the branch, so it would never link.
  const firstAlpha = words.find((word) => /^[A-Z]/.test(word));
  if (!firstAlpha) return 'PRJ';

  if (firstAlpha.length >= 2) return firstAlpha.slice(0, 3);

  // Single-letter word ("A Portal") — borrow what follows to stay readable.
  const joined = words.slice(words.indexOf(firstAlpha)).join('');
  return joined.length >= 2 ? joined.slice(0, 3) : 'PRJ';
}

/** First unused key in the `BASE`, `BASE2`, `BASE3`… sequence. */
export function nextFreeKey(base: string, used: Set<string | null>): string {
  if (!used.has(base)) return base;

  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }

  return `${base}${Date.now().toString().slice(-5)}`;
}

/** Lowercase, hyphenated, trimmed to something that reads well in a branch. */
export function slugify(value: string, maxLength = 40): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= maxLength) return slug;

  // Cut on a word boundary so the branch doesn't end mid-word.
  const truncated = slug.slice(0, maxLength);
  const lastHyphen = truncated.lastIndexOf('-');
  return (lastHyphen > 12 ? truncated.slice(0, lastHyphen) : truncated).replace(
    /-+$/,
    '',
  );
}

/**
 * The branch name we tell developers to use, e.g.
 * `feature/web-12-add-sso-login`. Falls back to the id when a feature predates
 * issue keys, so the instruction on screen is always something that works.
 */
export function featureBranchName(feature: {
  id: string;
  key: string | null;
  title: string;
}): string {
  if (!feature.key) return `feature/${feature.id}`;
  const slug = slugify(feature.title);
  return slug
    ? `feature/${feature.key.toLowerCase()}-${slug}`
    : `feature/${feature.key.toLowerCase()}`;
}

export function bugBranchName(bug: {
  id: string;
  key: string | null;
  title: string;
}): string {
  if (!bug.key) return `bug/${bug.id}`;
  const slug = slugify(bug.title);
  return slug ? `bug/${bug.key.toLowerCase()}-${slug}` : `bug/${bug.key.toLowerCase()}`;
}
