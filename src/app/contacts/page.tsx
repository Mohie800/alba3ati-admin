"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const fetchContacts = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (sourceFilter !== "all") params.source = sourceFilter;
      const { data } = await api.get("/admin/contacts", { params });
      setContacts(data.data.contacts);
      setPages(data.data.pages);
    } catch {
      /* handled by interceptor */
    }
  }, [page, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sourceFilter]);

  const statusColor = (s: string) => {
    if (s === "new") return "destructive" as const;
    if (s === "read") return "outline" as const;
    return "default" as const;
  };

  const sourceColor = (s: string) => {
    if (s === "landing") return "secondary" as const;
    return "outline" as const;
  };

  const columns: Column<Contact>[] = [
    { key: "playerName", label: "Name" },
    {
      key: "source",
      label: "Source",
      render: (c) => <Badge variant={sourceColor(c.source)}>{c.source === "landing" ? "Website" : "App"}</Badge>,
    },
    {
      key: "email",
      label: "Contact",
      render: (c) => (
        <span className="text-sm">{c.email || c.phone || "—"}</span>
      ),
    },
    { key: "subject", label: "Subject" },
    {
      key: "status",
      label: "Status",
      render: (c) => <Badge variant={statusColor(c.status)}>{c.status}</Badge>,
    },
    {
      key: "createdAt",
      label: "Date",
      render: (c) => new Date(c.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Contacts</h1>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground self-center mr-1">Status:</span>
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
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground self-center mr-1">Source:</span>
              {sourceFilters.map((f) => (
                <Button
                  key={f}
                  variant={sourceFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSourceFilter(f)}
                >
                  {f === "all" ? "All" : f === "landing" ? "Website" : "App"}
                </Button>
              ))}
            </div>
          </div>
          <DataTable
            columns={columns}
            data={contacts}
            page={page}
            pages={pages}
            onPageChange={setPage}
            onRowClick={(c) => router.push(`/contacts/${c._id}`)}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
