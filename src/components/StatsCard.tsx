import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { type ReactNode } from "react";

export type StatsTone =
  | "default"
  | "sky"
  | "emerald"
  | "amber"
  | "violet"
  | "rose"
  | "indigo"
  | "cyan"
  | "orange"
  | "red"
  | "teal";

const TONE_STYLES: Record<StatsTone, { wrap: string; icon: string; accent: string }> = {
  default: {
    wrap: "bg-muted text-muted-foreground",
    icon: "text-muted-foreground",
    accent: "from-foreground/[0.03] to-transparent",
  },
  sky: {
    wrap: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    icon: "text-sky-600 dark:text-sky-400",
    accent: "from-sky-500/[0.08] to-transparent",
  },
  emerald: {
    wrap: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
    accent: "from-emerald-500/[0.08] to-transparent",
  },
  amber: {
    wrap: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
    accent: "from-amber-500/[0.08] to-transparent",
  },
  violet: {
    wrap: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    icon: "text-violet-600 dark:text-violet-400",
    accent: "from-violet-500/[0.08] to-transparent",
  },
  rose: {
    wrap: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    icon: "text-rose-600 dark:text-rose-400",
    accent: "from-rose-500/[0.08] to-transparent",
  },
  indigo: {
    wrap: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
    accent: "from-indigo-500/[0.08] to-transparent",
  },
  cyan: {
    wrap: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    icon: "text-cyan-600 dark:text-cyan-400",
    accent: "from-cyan-500/[0.08] to-transparent",
  },
  orange: {
    wrap: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    icon: "text-orange-600 dark:text-orange-400",
    accent: "from-orange-500/[0.08] to-transparent",
  },
  red: {
    wrap: "bg-red-500/10 text-red-600 dark:text-red-400",
    icon: "text-red-600 dark:text-red-400",
    accent: "from-red-500/[0.08] to-transparent",
  },
  teal: {
    wrap: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    icon: "text-teal-600 dark:text-teal-400",
    accent: "from-teal-500/[0.08] to-transparent",
  },
};

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: StatsTone;
  hint?: string;
  /** Positive numbers render in green with an up arrow, negative in red with down arrow */
  trend?: { value: number; label?: string };
  loading?: boolean;
}

export default function StatsCard({
  label,
  value,
  icon,
  tone = "default",
  hint,
  trend,
  loading,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const t = TONE_STYLES[tone];
  const trendUp = trend && trend.value > 0;
  const trendDown = trend && trend.value < 0;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none",
          t.accent,
        )}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-[28px] leading-none font-bold mt-2 tabular-nums">
              {value}
            </p>
            {(hint || trend) && (
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                {trend && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 font-medium",
                      trendUp && "text-emerald-600 dark:text-emerald-400",
                      trendDown && "text-rose-600 dark:text-rose-400",
                      !trendUp && !trendDown && "text-muted-foreground",
                    )}
                  >
                    {trendUp && <TrendingUp size={12} />}
                    {trendDown && <TrendingDown size={12} />}
                    {trendUp ? "+" : ""}
                    {trend.value}
                    {trend.label ? ` ${trend.label}` : ""}
                  </span>
                )}
                {hint && (
                  <span className="text-muted-foreground">{hint}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              t.wrap,
            )}
          >
            <span className={cn("[&_svg]:!size-5", t.icon)}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
