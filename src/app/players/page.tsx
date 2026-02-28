"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Player {
  _id: string;
  name: string;
  createdAt: string;
}

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/players", {
        params: { page, limit: 20, search },
      });
      setPlayers(data.data.players);
      setPages(data.data.pages);
    } catch {
      /* handled by interceptor */
    }
  }, [page, search]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const columns: Column<Player>[] = [
    { key: "name", label: "Name" },
    {
      key: "createdAt",
      label: "Created At",
      render: (p) => new Date(p.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Players</h1>
            <Input
              placeholder="Search by name..."
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DataTable
            columns={columns}
            data={players}
            page={page}
            pages={pages}
            onPageChange={setPage}
            onRowClick={(p) => router.push(`/players/${p._id}`)}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
