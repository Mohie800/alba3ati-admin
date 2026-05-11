"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  /** Optional Tailwind class applied to both the th and td (e.g. "w-12 text-right"). */
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  /** Total record count, used for the "Showing X–Y of Z" footer */
  total?: number;
  /** Page size, used for the "Showing X–Y of Z" footer */
  pageSize?: number;
  /** Optional custom empty-state message */
  emptyMessage?: string;
  /** Minimum table width to keep horizontal scroll on small screens */
  minWidth?: number;
}

export default function DataTable<T extends { _id?: string }>({
  columns,
  data,
  page,
  pages,
  onPageChange,
  onRowClick,
  loading,
  total,
  pageSize,
  emptyMessage = "No results found",
  minWidth = 500,
}: DataTableProps<T>) {
  const startIdx = total && pageSize ? (page - 1) * pageSize + 1 : null;
  const endIdx =
    total && pageSize ? Math.min(page * pageSize, total) : null;

  return (
    <div className="space-y-3">
      <div className="border rounded-xl overflow-x-auto bg-card">
        <Table style={{ minWidth }}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    col.className,
                  )}
                >
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                  {columns.map((col, ci) => (
                    <TableCell key={col.key} className={col.className}>
                      <Skeleton className={cn("h-4", ci === 0 ? "w-32" : "w-20")} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-14"
                >
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Inbox size={18} />
                    </div>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, i) => (
                <TableRow
                  key={item._id || i}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-accent/60",
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render
                        ? col.render(item)
                        : ((item as Record<string, unknown>)[
                            col.key
                          ] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(pages > 1 || (startIdx !== null && endIdx !== null && total)) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {startIdx !== null && endIdx !== null && total !== undefined ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground">
                  {data.length === 0 ? 0 : startIdx}
                </span>
                {data.length > 0 && (
                  <>
                    {"–"}
                    <span className="font-medium text-foreground">
                      {endIdx}
                    </span>
                  </>
                )}{" "}
                of{" "}
                <span className="font-medium text-foreground">{total}</span>
              </>
            ) : (
              <>
                Page{" "}
                <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{pages}</span>
              </>
            )}
          </p>
          {pages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft size={15} className="mr-1" />
                Previous
              </Button>
              <span className="text-xs text-muted-foreground px-2 tabular-nums hidden sm:inline">
                {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages || loading}
                onClick={() => onPageChange(page + 1)}
              >
                Next
                <ChevronRight size={15} className="ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
