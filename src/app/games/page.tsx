"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

interface Game {
  _id: string;
  roomId: string;
  status: string;
  activePlayers: number;
  players: unknown[];
  createdAt: string;
}

const statusFilters = ["all", "waiting", "playing", "ended"] as const;

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchGames = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/admin/games", { params });
      setGames(data.data.games);
      setPages(data.data.pages);
    } catch {
      /* handled by interceptor */
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const statusColor = (s: string) => {
    if (s === "playing") return "default" as const;
    if (s === "ended") return "secondary" as const;
    return "outline" as const;
  };

  const columns: Column<Game>[] = [
    { key: "roomId", label: "Room ID" },
    {
      key: "status",
      label: "Status",
      render: (g) => <Badge variant={statusColor(g.status)}>{g.status}</Badge>,
    },
    {
      key: "players",
      label: "Players",
      render: (g) => g.players.length,
    },
    {
      key: "createdAt",
      label: "Created At",
      render: (g) => new Date(g.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">Games</h1>
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
            data={games}
            page={page}
            pages={pages}
            onPageChange={setPage}
            onRowClick={(g) => router.push(`/games/${g._id}`)}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
