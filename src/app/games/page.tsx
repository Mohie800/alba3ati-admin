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

interface Game {
  _id: string;
  roomId: string;
  status: string;
  activePlayers: number;
  players: unknown[];
  createdAt: string;
}

const statusFilters = ["all", "waiting", "playing", "ended"] as const;
const PAGE_SIZE = 20;

export default function GamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState(false);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const params: Record<string, unknown> = { page, limit: PAGE_SIZE };
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/admin/games", { params });
      setGames(data.data.games);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const statusBadge = (s: string) => {
    if (s === "playing")
      return (
        <Badge className="bg-indigo-500 hover:bg-indigo-500 text-white">
          Playing
        </Badge>
      );
    if (s === "ended")
      return <Badge variant="secondary">Ended</Badge>;
    if (s === "waiting")
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 border border-amber-500/30">
          Waiting
        </Badge>
      );
    return <Badge variant="outline">{s}</Badge>;
  };

  const columns: Column<Game>[] = [
    {
      key: "roomId",
      label: "Room ID",
      render: (g) => (
        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {g.roomId}
        </code>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (g) => statusBadge(g.status),
    },
    {
      key: "players",
      label: "Players",
      render: (g) => (
        <span className="tabular-nums">{g.players.length}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (g) =>
        new Date(g.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  const filterPills = (
    <div className="flex flex-wrap gap-1.5">
      {statusFilters.map((f) => (
        <button
          key={f}
          onClick={() => setStatusFilter(f)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md border transition-colors",
            statusFilter === f
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <AppShell>
      <PageHeader
        title="Games"
        description="Active and historical game rooms."
        actions={filterPills}
      />
      {error ? (
        <ErrorState title="Failed to load games" onRetry={fetchGames} />
      ) : (
        <DataTable
          columns={columns}
          data={games}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          onRowClick={(g) => router.push(`/games/${g._id}`)}
          emptyMessage={
            statusFilter === "all"
              ? "No games yet"
              : `No ${statusFilter} games`
          }
        />
      )}
    </AppShell>
  );
}
