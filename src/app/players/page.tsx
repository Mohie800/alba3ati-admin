"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const fetchPlayers = useCallback(async () => {
    try {
      setError(false);
      const { data } = await api.get("/admin/players", {
        params: { page, limit: 20, search: debouncedSearch },
      });
      setPlayers(data.data.players);
      setPages(data.data.pages);
    } catch {
      setError(true);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

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
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load players</p>
              <Button variant="outline" onClick={fetchPlayers}>Retry</Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={players}
              page={page}
              pages={pages}
              onPageChange={setPage}
              onRowClick={(p) => router.push(`/players/${p._id}`)}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
