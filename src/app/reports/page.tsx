"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  { value: "inappropriate_language", label: "Inappropriate Language" },
  { value: "cheating", label: "Cheating" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_name", label: "Inappropriate Name" },
  { value: "other", label: "Other" },
] as const;

const reasonLabels: Record<string, string> = {
  inappropriate_language: "Inappropriate Language",
  cheating: "Cheating",
  harassment: "Harassment",
  inappropriate_name: "Inappropriate Name",
  other: "Other",
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reasonFilter, setReasonFilter] = useState<string>("all");
  const [error, setError] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setError(false);
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (reasonFilter !== "all") params.reason = reasonFilter;
      const { data } = await api.get("/admin/reports", { params });
      setReports(data.data.reports);
      setPages(data.data.pages);
    } catch {
      setError(true);
    }
  }, [page, statusFilter, reasonFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, reasonFilter]);

  const statusColor = (s: string) => {
    if (s === "pending") return "secondary" as const;
    if (s === "dismissed") return "outline" as const;
    if (s === "warned") return "default" as const;
    if (s === "banned") return "destructive" as const;
    return "outline" as const;
  };

  const columns: Column<Report>[] = [
    { key: "reporterName", label: "Reporter" },
    { key: "reportedPlayerName", label: "Reported Player" },
    {
      key: "reason",
      label: "Reason",
      render: (r) => <Badge variant="outline">{reasonLabels[r.reason] || r.reason}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge variant={statusColor(r.status)}>{r.status}</Badge>,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (r) => new Date(r.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold mb-6">Reports</h1>

          {/* Status filters */}
          <div className="flex flex-wrap gap-2 mb-3">
            {statusFilters.map((f) => (
              <Button
                key={f}
                variant={statusFilter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {/* Reason filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {reasonFilters.map((f) => (
              <Button
                key={f.value}
                variant={reasonFilter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => setReasonFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load reports</p>
              <Button variant="outline" onClick={fetchReports}>Retry</Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={reports}
              page={page}
              pages={pages}
              onPageChange={setPage}
              onRowClick={(r) => router.push(`/reports/${r._id}`)}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
