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

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const router = useRouter();
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    status: "all",
    source: "all",
    from: "",
    to: "",
  });
  const latest = useLatest();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchContacts = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/contacts", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setContacts(data.data.contacts);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

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
      render: (c) =>
        new Date(c.createdAt).toLocaleString("en-GB", {
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
        title="Contacts"
        description="Messages submitted from the app and landing page."
      />
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Name, email, phone or message…"
        />
        <FilterSelect
          label="Status"
          value={params.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "all", label: "All" },
            { value: "new", label: "New" },
            { value: "read", label: "Read" },
            { value: "responded", label: "Responded" },
          ]}
        />
        <FilterSelect
          label="Source"
          value={params.source}
          onChange={(source) => set({ source })}
          options={[
            { value: "all", label: "All" },
            { value: "app", label: "App" },
            { value: "landing", label: "Website" },
          ]}
        />
        <FilterDateRange
          from={params.from}
          to={params.to}
          onChange={(r) => set(r)}
        />
      </FilterBar>
      {error ? (
        <ErrorState title="Failed to load contacts" onRetry={fetchContacts} />
      ) : (
        <DataTable
          columns={columns}
          data={contacts}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          onRowClick={(c) => router.push(`/contacts/${c._id}`)}
          emptyMessage={
            activeCount ? "No contacts match these filters" : "No contacts yet"
          }
          minWidth={760}
        />
      )}
    </>
  );
}
