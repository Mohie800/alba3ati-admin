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
  subject: string;
  status: string;
  createdAt: string;
}

const statusFilters = ["all", "new", "read", "responded"] as const;

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchContacts = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/admin/contacts", { params });
      setContacts(data.data.contacts);
      setPages(data.data.pages);
    } catch {
      /* handled by interceptor */
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const statusColor = (s: string) => {
    if (s === "new") return "destructive" as const;
    if (s === "read") return "outline" as const;
    return "default" as const;
  };

  const columns: Column<Contact>[] = [
    { key: "playerName", label: "Player" },
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
          <div className="flex gap-2 mb-4">
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
