"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Optional action node rendered on the right (buttons, filters, etc.) */
  actions?: React.ReactNode;
  /** Optional back link rendered above the title (e.g. for detail pages) */
  backHref?: string;
  backLabel?: string;
  /** Optional content rendered below the title row (e.g. filter row) */
  children?: React.ReactNode;
  className?: string;
}

export default function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel = "Back",
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("pt-4 lg:pt-0 mb-6", className)}>
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft size={15} />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
