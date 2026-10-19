"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/** Row of list filters; wraps on narrow screens instead of stacking pill rows */
export function FilterBar({
  children,
  activeCount = 0,
  onClear,
  className,
}: {
  children: React.ReactNode;
  activeCount?: number;
  onClear?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 mb-4", className)}>
      {children}
      {activeCount > 0 && onClear && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground"
        >
          <X size={14} className="mr-1" />
          Clear{activeCount > 1 ? ` (${activeCount})` : ""}
        </Button>
      )}
    </div>
  );
}

/** Debounced search box; commits after typing pauses */
export function FilterSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Follow external changes (Clear button, back navigation) during render
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <div className={cn("relative w-full sm:w-72", className)}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        value={draft}
        placeholder={placeholder}
        className="h-8 pl-9 pr-8"
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onChange(v.trim()), 350);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (timer.current) clearTimeout(timer.current);
            onChange(draft.trim());
          }
        }}
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDraft("");
            onChange("");
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export interface FilterOption {
  value: string;
  label: string;
}

/** Labeled dropdown; the label stays visible so the selected filter reads "Status: Pending" */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const active = options[0] && value !== options[0].value;
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className={cn(
          "w-auto min-w-[8.5rem] gap-1.5",
          active && "border-primary/60 bg-primary/5",
          className,
        )}
      >
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** From/to date inputs (YYYY-MM-DD) */
export function FilterDateRange({
  from,
  to,
  onChange,
  label = "Date",
}: {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
  label?: string;
}) {
  const active = !!from || !!to;
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 h-8 rounded-md border px-2 text-sm",
        active && "border-primary/60 bg-primary/5",
      )}
    >
      <span className="text-muted-foreground">{label}:</span>
      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="bg-transparent outline-none text-sm [color-scheme:light] dark:[color-scheme:dark]"
        aria-label={`${label} from`}
      />
      <span className="text-muted-foreground">–</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="bg-transparent outline-none text-sm [color-scheme:light] dark:[color-scheme:dark]"
        aria-label={`${label} to`}
      />
    </div>
  );
}
