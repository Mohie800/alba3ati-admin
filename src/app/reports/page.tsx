"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface Report {
  _id: string;
  reporterName: string;
  reportedPlayerName: string;
  reason: string;
  status: string;
  createdAt: string;
}

const statusFilters = ["all", "pending", "dismissed", "warned", "banned"] as const;
const reasonFilters = [
  { value: "all", label: "All" },
  { value: "inappropriate_language", label: "Language" },
  { value: "cheating", label: "Cheating" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_name", label: "Bad Name" },
  { value: "other", label: "Other" },
] as const;

const reasonLabels: Record<string, string> = {
  inappropriate_language: "Inappropriate Language",
  cheating: "Cheating",
  harassment: "Harassment",
  inappropriate_name: "Inappropriate Name",
  other: "Other",
};

const PAGE_SIZE = 20;

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [error, setError] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (reasonFilter !== "all") params.reason = reasonFilter;
      const { data } = await api.get("/admin/reports", { params });
      setReports(data.data.reports);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, reasonFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, reasonFilter]);

  const statusBadge = (s: string) => {
    if (s === "pending")
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/15">
          Pending
        </Badge>
      );
    if (s === "dismissed") return <Badge variant="outline">Dismissed</Badge>;
    if (s === "warned")
      return (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/15">
          Warned
        </Badge>
      );
    if (s === "banned") return <Badge variant="destructive">Banned</Badge>;
    return <Badge variant="outline">{s}</Badge>;
  };

  const columns: Column<Report>[] = [
    {
      key: "reporterName",
      label: "Reporter",
      render: (r) => <span className="text-sm">{r.reporterName}</span>,
    },
    {
      key: "reportedPlayerName",
      label: "Reported Player",
      render: (r) => <span className="font-medium">{r.reportedPlayerName}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      render: (r) => (
        <Badge variant="outline">{reasonLabels[r.reason] || r.reason}</Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => statusBadge(r.status),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (r) =>
        new Date(r.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  const FilterRow = ({
    label,
    options,
    value,
    onChange,
  }: {
    label: string;
    options: readonly { value: string; label: string }[] | readonly string[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-1">
        {label}
      </span>
      {(options as readonly (string | { value: string; label: string })[]).map(
        (opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l =
            typeof opt === "string"
              ? opt.charAt(0).toUpperCase() + opt.slice(1)
              : opt.label;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md border transition-colors",
                value === v
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {l}
            </button>
          );
        },
      )}
    </div>
  );

  return (
    <AppShell>
      <PageHeader
        title="Reports"
        description="Player-submitted reports awaiting moderation."
      >
        <div className="space-y-2">
          <FilterRow
            label="Status"
            options={statusFilters}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterRow
            label="Reason"
            options={reasonFilters}
            value={reasonFilter}
            onChange={setReasonFilter}
          />
        </div>
      </PageHeader>

      {error ? (
        <ErrorState title="Failed to load reports" onRetry={fetchReports} />
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          onRowClick={(r) => router.push(`/reports/${r._id}`)}
          emptyMessage="No reports found"
        />
      )}
    </AppShell>
  );
}
