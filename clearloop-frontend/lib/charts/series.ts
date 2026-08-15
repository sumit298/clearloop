// Bucketing helpers for the dashboard charts. Everything here works off
// timestamps the API already returns (feature.completedAt, bug.resolvedAt,
// pr.mergedAt), so the charts never invent a datapoint the backend doesn't have.

export interface Bucket {
  /** Start of the week, midnight local. Used as the x value. */
  start: Date;
  /** Short axis label, e.g. "Mar 3". */
  label: string;
  count: number;
}

/** Monday-anchored start of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  // getDay() is 0 for Sunday, which belongs to the week that began 6 days ago.
  const dayOffset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - dayOffset);
  return result;
}

/**
 * Calendar arithmetic, not `+ 7 * 86400000`. Adding a fixed number of
 * milliseconds drifts by an hour across a DST change, which pushes a bucket
 * key to 23:00 the previous day and makes every lookup for that week miss.
 */
function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Count timestamps into `weeks` consecutive weekly buckets ending with the
 * current week. Buckets with no events stay in the series as zeroes — dropping
 * them would compress the time axis and overstate the trend.
 */
export function weeklyBuckets(
  timestamps: Array<string | undefined | null>,
  weeks: number,
): Bucket[] {
  const firstWeek = addWeeks(startOfWeek(new Date()), -(weeks - 1));

  const buckets: Bucket[] = [];
  const indexByTime = new Map<number, number>();

  for (let index = 0; index < weeks; index += 1) {
    const start = addWeeks(firstWeek, index);
    indexByTime.set(start.getTime(), index);
    buckets.push({
      start,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  for (const timestamp of timestamps) {
    if (!timestamp) continue;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) continue;
    const index = indexByTime.get(startOfWeek(date).getTime());
    if (index !== undefined) buckets[index].count += 1;
  }

  return buckets;
}

/** Sum of a series — used to decide whether a chart has anything to show. */
export function total(buckets: Bucket[]): number {
  return buckets.reduce((sum, bucket) => sum + bucket.count, 0);
}

export const RANGES = [
  { label: "6w", weeks: 6 },
  { label: "12w", weeks: 12 },
  { label: "26w", weeks: 26 },
] as const;

export type RangeWeeks = (typeof RANGES)[number]["weeks"];
