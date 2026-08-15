"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Table2 } from "lucide-react";
import type { Bucket } from "@/lib/charts/series";

// ---------------------------------------------------------------------------
// Shared plumbing
// ---------------------------------------------------------------------------

/**
 * Charts render at real pixel dimensions rather than scaling a fixed viewBox,
 * so a 2px stroke stays 2px instead of growing with the card.
 */
function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width;
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Round the axis maximum up to a 1/2/5 × 10ⁿ step so ticks are clean numbers.
 * These axes count whole things (features, bugs), so the step is floored at 1 —
 * otherwise a peak of 1 yields ticks of 0 / 0.5 / 1 and the chart claims half
 * a feature shipped.
 */
function niceScale(max: number, tickCount = 4) {
  if (max <= 0) return { max: tickCount, ticks: range(tickCount + 1) };
  const rawStep = max / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const niceStep = Math.max(
    1,
    (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) *
      magnitude,
  );
  const niceMax = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let value = 0; value <= niceMax + 1e-9; value += niceStep) {
    ticks.push(Math.round(value));
  }
  return { max: niceMax, ticks };
}

function range(length: number) {
  return Array.from({ length }, (_, index) => index);
}

export interface ChartSeries {
  key: string;
  label: string;
  /** CSS colour token, e.g. "var(--chart-1)". Follows the entity, never its rank. */
  color: string;
  buckets: Bucket[];
}

// ---------------------------------------------------------------------------
// Card chrome — title, legend, chart/table toggle
// ---------------------------------------------------------------------------

export function ChartCard({
  title,
  icon: Icon,
  subtitle,
  legend,
  table,
  action,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  subtitle?: string;
  /** Omitted for single-series charts — the title already names what is plotted. */
  legend?: Array<{ label: string; color: string }>;
  /** The WCAG-clean twin. Every value in the chart is reachable here too. */
  table?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="size-3.5 shrink-0 text-muted-foreground" />}
          <h2 className="truncate text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            {title}
          </h2>
        </div>
        {subtitle && (
          <span className="hidden text-[11px] text-muted-foreground sm:block">
            {subtitle}
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {action}
          {table && (
            <div className="flex items-center rounded-md border border-border p-0.5">
              <ToggleButton
                active={view === "chart"}
                onClick={() => setView("chart")}
                icon={BarChart3}
                label="Chart view"
              />
              <ToggleButton
                active={view === "table"}
                onClick={() => setView("table")}
                icon={Table2}
                label="Table view"
              />
            </div>
          )}
        </div>
      </header>

      {legend && legend.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border px-4 py-2">
          {legend.map((item) => (
            <span
              key={item.label}
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.label}
            </span>
          ))}
        </div>
      )}

      {view === "chart" ? children : table}
    </section>
  );
}

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`inline-flex size-6 items-center justify-center rounded ${
        active
          ? "bg-surface-raised text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Trend chart — multi-series line with crosshair, tooltip and end labels
// ---------------------------------------------------------------------------

const PAD = { top: 14, right: 14, bottom: 22, left: 34 };
const PLOT_HEIGHT = 168;

export function TrendChart({ series }: { series: ChartSeries[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>(560);
  const [active, setActive] = useState<number | null>(null);

  const bucketCount = series[0]?.buckets.length ?? 0;
  const scale = useMemo(() => {
    const peak = Math.max(
      1,
      ...series.flatMap((item) => item.buckets.map((bucket) => bucket.count)),
    );
    return niceScale(peak);
  }, [series]);

  const plotWidth = Math.max(80, width - PAD.left - PAD.right);
  const height = PLOT_HEIGHT + PAD.top + PAD.bottom;

  const xAt = useCallback(
    (index: number) =>
      PAD.left +
      (bucketCount <= 1 ? plotWidth / 2 : (index / (bucketCount - 1)) * plotWidth),
    [bucketCount, plotWidth],
  );
  const yAt = useCallback(
    (value: number) => PAD.top + PLOT_HEIGHT * (1 - value / scale.max),
    [scale.max],
  );

  const handlePointer = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - PAD.left;
    const step = bucketCount <= 1 ? 1 : plotWidth / (bucketCount - 1);
    const index = Math.round(offset / step);
    setActive(Math.min(bucketCount - 1, Math.max(0, index)));
  };

  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowLeft" ? -1 : 1;
    setActive((current) => {
      const next = (current ?? 0) + step;
      return Math.min(bucketCount - 1, Math.max(0, next));
    });
  };

  // Axis labels thin out on narrow cards so ticks never overlap.
  const labelEvery = Math.max(1, Math.ceil(bucketCount / Math.max(2, Math.floor(plotWidth / 56))));

  return (
    <div ref={ref} className="relative px-4 py-3">
      <svg
        width={width || 560}
        height={height}
        role="img"
        tabIndex={0}
        aria-label={`Weekly trend for ${series.map((item) => item.label).join(" and ")}`}
        className="block touch-none outline-none focus-visible:ring-2 focus-visible:ring-(--ring) focus-visible:ring-offset-2"
        onPointerMove={handlePointer}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        {/* Gridlines: solid hairlines one step off the surface, never dashed. */}
        {scale.ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={PAD.left + plotWidth}
              y1={yAt(tick)}
              y2={yAt(tick)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 7}
              y={yAt(tick) + 3}
              textAnchor="end"
              className="fill-(--muted-foreground) text-[10px] tabular-nums"
            >
              {tick}
            </text>
          </g>
        ))}

        {series[0]?.buckets.map((bucket, index) =>
          index % labelEvery === 0 || index === bucketCount - 1 ? (
            <text
              key={bucket.start.getTime()}
              x={xAt(index)}
              y={height - 6}
              textAnchor={
                index === 0 ? "start" : index === bucketCount - 1 ? "end" : "middle"
              }
              className="fill-(--muted-foreground) text-[10px]"
            >
              {bucket.label}
            </text>
          ) : null,
        )}

        {active !== null && (
          <line
            x1={xAt(active)}
            x2={xAt(active)}
            y1={PAD.top}
            y2={PAD.top + PLOT_HEIGHT}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
        )}

        {series.map((item) => {
          const path = item.buckets
            .map(
              (bucket, index) =>
                `${index === 0 ? "M" : "L"}${xAt(index)},${yAt(bucket.count)}`,
            )
            .join(" ");
          const lastIndex = item.buckets.length - 1;
          return (
            <g key={item.key}>
              <path
                d={path}
                fill="none"
                stroke={item.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End marker carries a 2px surface ring so overlapping series stay legible. */}
              <circle
                cx={xAt(lastIndex)}
                cy={yAt(item.buckets[lastIndex]?.count ?? 0)}
                r={4}
                fill={item.color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
              {active !== null && (
                <circle
                  cx={xAt(active)}
                  cy={yAt(item.buckets[active]?.count ?? 0)}
                  r={4}
                  fill={item.color}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}
      </svg>

      {active !== null && (
        <Tooltip
          x={xAt(active) + 16}
          y={PAD.top}
          containerWidth={width}
          title={series[0]?.buckets[active]?.label ?? ""}
          rows={series.map((item) => ({
            label: item.label,
            color: item.color,
            value: item.buckets[active]?.count ?? 0,
          }))}
        />
      )}
    </div>
  );
}

function Tooltip({
  x,
  y,
  containerWidth,
  title,
  rows,
}: {
  x: number;
  y: number;
  containerWidth: number;
  title: string;
  rows: Array<{ label: string; color: string; value: number }>;
}) {
  const WIDTH = 168;
  // Flip to the left of the cursor rather than overflow the card.
  const left = x + WIDTH > containerWidth ? x - WIDTH - 32 : x;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface-elevated px-2.5 py-2 shadow-md"
      style={{ left: Math.max(4, left), top: y, width: WIDTH }}
    >
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
        Week of {title}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 py-0.5 text-[12px]">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-full"
            style={{ background: row.color }}
          />
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {row.label}
          </span>
          <span className="font-mono tabular-nums">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TrendTable({ series }: { series: ChartSeries[] }) {
  const buckets = series[0]?.buckets ?? [];
  return (
    <div className="max-h-64 overflow-auto">
      <table className="w-full text-[12px]">
        <thead className="sticky top-0 bg-surface">
          <tr className="border-b border-border text-left">
            <th className="px-4 py-2 font-medium text-muted-foreground">Week of</th>
            {series.map((item) => (
              <th
                key={item.key}
                className="px-4 py-2 text-right font-medium text-muted-foreground"
              >
                {item.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {buckets.map((bucket, index) => (
            <tr key={bucket.start.getTime()} className="border-b border-border last:border-b-0">
              <td className="px-4 py-1.5 font-mono text-muted-foreground">{bucket.label}</td>
              {series.map((item) => (
                <td key={item.key} className="px-4 py-1.5 text-right font-mono tabular-nums">
                  {item.buckets[index]?.count ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline bar — part-to-whole across ordered stages
// ---------------------------------------------------------------------------

export interface StackSegment {
  key: string;
  label: string;
  color: string;
  /**
   * Colour for a label drawn inside this segment. Each fill gets whichever of
   * white/near-black actually clears contrast against it — the one place a
   * label is allowed to sit on a data colour.
   */
  ink?: string;
  value: number;
}

const GAP = 2; // surface gap; white does the separating, never a stroke

export function PipelineBar({ segments }: { segments: StackSegment[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>(560);
  const [active, setActive] = useState<string | null>(null);

  const visible = segments.filter((segment) => segment.value > 0);
  const sum = visible.reduce((accumulator, segment) => accumulator + segment.value, 0);
  const trackWidth = Math.max(40, width);
  const gapTotal = GAP * Math.max(0, visible.length - 1);
  const usable = Math.max(1, trackWidth - gapTotal);

  if (!sum) {
    return (
      <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
        No features to chart yet.
      </div>
    );
  }

  let offset = 0;
  const placed = visible.map((segment) => {
    const segmentWidth = (segment.value / sum) * usable;
    const item = { ...segment, x: offset, width: segmentWidth };
    offset += segmentWidth + GAP;
    return item;
  });

  return (
    <div ref={ref} className="px-4 py-3.5">
      <svg
        width={trackWidth}
        height={28}
        role="img"
        aria-label={`Feature pipeline: ${visible
          .map((segment) => `${segment.label} ${segment.value}`)
          .join(", ")}`}
        className="block"
      >
        {placed.map((segment) => {
          // Only label inside the segment when the digits fit with padding —
          // a clipped label is worse than no label; the table view has it either way.
          const text = String(segment.value);
          const fits = segment.width >= text.length * 7 + 14;
          return (
            <g
              key={segment.key}
              onPointerEnter={() => setActive(segment.key)}
              onPointerLeave={() => setActive(null)}
            >
              <rect
                x={segment.x}
                y={0}
                width={Math.max(1, segment.width)}
                height={24}
                rx={4}
                fill={segment.color}
                opacity={active && active !== segment.key ? 0.55 : 1}
              />
              {fits && (
                <text
                  x={segment.x + segment.width / 2}
                  y={16}
                  textAnchor="middle"
                  className="text-[11px] font-medium tabular-nums"
                  fill={segment.ink ?? "var(--surface)"}
                >
                  {text}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`flex items-center gap-1.5 text-[11px] ${
              active && active !== segment.key
                ? "text-muted-foreground/60"
                : "text-muted-foreground"
            }`}
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: segment.color }}
            />
            {segment.label}
            <span className="font-mono tabular-nums text-foreground">{segment.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function StackTable({
  segments,
  unit,
}: {
  segments: StackSegment[];
  unit: string;
}) {
  const sum = segments.reduce((accumulator, segment) => accumulator + segment.value, 0);
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="px-4 py-2 font-medium text-muted-foreground">{unit}</th>
          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Count</th>
          <th className="px-4 py-2 text-right font-medium text-muted-foreground">Share</th>
        </tr>
      </thead>
      <tbody>
        {segments.map((segment) => (
          <tr key={segment.key} className="border-b border-border last:border-b-0">
            <td className="px-4 py-1.5">{segment.label}</td>
            <td className="px-4 py-1.5 text-right font-mono tabular-nums">{segment.value}</td>
            <td className="px-4 py-1.5 text-right font-mono tabular-nums text-muted-foreground">
              {sum ? Math.round((segment.value / sum) * 100) : 0}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Severity breakdown — status scale, so every row ships an icon and a label
// ---------------------------------------------------------------------------

export interface SeverityRow {
  key: string;
  label: string;
  color: string;
  icon: LucideIcon;
  value: number;
}

export function SeverityBreakdown({ rows }: { rows: SeverityRow[] }) {
  const peak = Math.max(1, ...rows.map((row) => row.value));

  return (
    <div className="divide-y divide-border">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3 px-4 py-2.5">
          {/* Status never rides on colour alone — icon + label carry it too. */}
          <row.icon className="size-3.5 shrink-0" style={{ color: row.color }} />
          <span className="w-16 shrink-0 text-[12px]">{row.label}</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(row.value / peak) * 100}%`,
                background: row.color,
              }}
            />
          </div>
          <span className="w-6 shrink-0 text-right font-mono text-[12px] tabular-nums">
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
