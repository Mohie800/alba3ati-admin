"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface Contact {
  _id: string;
  playerName: string;
  email: string | null;
  phone: string | null;
  subject: string;
  source: "app" | "landing";
  status: string;
  createdAt: string;
}

const statusFilters = ["all", "new", "read", "responded"] as const;
const sourceFilters = ["all", "app", "landing"] as const;
const PAGE_SIZE = 20;

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [error, setError] = useState(false);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      if (sourceFilter !== "all") params.source = sourceFilter;
      const { data } = await api.get("/admin/contacts", { params });
      setContacts(data.data.contacts);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sourceFilter]);

  const statusBadge = (s: string) => {
    if (s === "new")
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/15">
          New
        </Badge>
      );
    if (s === "read") return <Badge variant="outline">Read</Badge>;
    if (s === "responded")
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15">
          Responded
        </Badge>
      );
    return <Badge variant="outline">{s}</Badge>;
  };

  const columns: Column<Contact>[] = [
    {
      key: "playerName",
      label: "Name",
      render: (c) => <span className="font-medium">{c.playerName}</span>,
    },
    {
      key: "source",
      label: "Source",
      render: (c) =>
        c.source === "landing" ? (
          <Badge variant="secondary">Website</Badge>
        ) : (
          <Badge variant="outline">App</Badge>
        ),
    },
    {
      key: "email",
      label: "Contact",
      render: (c) => (
        <span className="text-sm text-muted-foreground">
          {c.email || c.phone || "—"}
        </span>
      ),
    },
    { key: "subject", label: "Subject" },
    {
      key: "status",
      label: "Status",
      render: (c) => statusBadge(c.status),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
  ];

  const FilterRow = ({
    label,
    options,
    value,
    onChange,
    formatLabel,
  }: {
    label: string;
    options: readonly string[];
    value: string;
    onChange: (v: string) => void;
    formatLabel?: (v: string) => string;
  }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide mr-1">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-md border transition-colors",
            value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {formatLabel ? formatLabel(opt) : opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Messages submitted from the app and landing page."
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <FilterRow
            label="Status"
            options={statusFilters}
            value={statusFilter}
            onChange={setStatusFilter}
          />
          <FilterRow
            label="Source"
            options={sourceFilters}
            value={sourceFilter}
            onChange={setSourceFilter}
            formatLabel={(v) =>
              v === "all" ? "All" : v === "landing" ? "Website" : "App"
            }
          />
        </div>
      </PageHeader>
      {error ? (
        <ErrorState title="Failed to load contacts" onRetry={fetchContacts} />
      ) : (
        <DataTable
          columns={columns}
          data={contacts}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          onRowClick={(c) => router.push(`/contacts/${c._id}`)}
          emptyMessage="No contacts found"
        />
      )}
    </>
  );
}
