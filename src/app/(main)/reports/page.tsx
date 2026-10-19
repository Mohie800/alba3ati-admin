"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  FilterDateRange,
} from "@/components/FilterBar";
import { useListParams, toQuery, useLatest } from "@/lib/useListParams";
import api from "@/lib/api";

interface Report {
  _id: string;
  reporterName: string;
  reportedPlayerName: string;
  reason: string;
  status: string;
  createdAt: string;
}

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
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    status: "pending",
    reason: "all",
    from: "",
    to: "",
  });
  const latest = useLatest();
  const [reports, setReports] = useState<Report[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/reports", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setReports(data.data.reports);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

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
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Player-submitted reports awaiting moderation."
      />
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Player name, room code or details…"
        />
        <FilterSelect
          label="Status"
          value={params.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "pending", label: "Pending" },
            { value: "all", label: "All" },
            { value: "dismissed", label: "Dismissed" },
            { value: "warned", label: "Warned" },
            { value: "banned", label: "Banned" },
          ]}
        />
        <FilterSelect
          label="Reason"
          value={params.reason}
          onChange={(reason) => set({ reason })}
          options={reasonFilters.map((r) => ({ value: r.value, label: r.label }))}
        />
        <FilterDateRange
          from={params.from}
          to={params.to}
          onChange={(r) => set(r)}
        />
      </FilterBar>

      {error ? (
        <ErrorState title="Failed to load reports" onRetry={fetchReports} />
      ) : (
        <DataTable
          columns={columns}
          data={reports}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          onRowClick={(r) => router.push(`/reports/${r._id}`)}
          emptyMessage={
            params.status === "pending" && activeCount === 0
              ? "No pending reports — all caught up"
              : "No reports match these filters"
          }
          minWidth={720}
        />
      )}
    </>
  );
}
