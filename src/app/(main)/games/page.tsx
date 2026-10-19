"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  FilterDateRange,
} from "@/components/FilterBar";
import { Badge } from "@/components/ui/badge";
import { useListParams, toQuery, useLatest } from "@/lib/useListParams";
import api from "@/lib/api";

interface Game {
  _id: string;
  roomId: string;
  status: string;
  activePlayers: number;
  players: unknown[];
  isPublic?: boolean;
  isQuickPlay?: boolean;
  gameResult?: string | null;
  roundNumber?: number;
  gamesCompleted?: number;
  createdAt: string;
}

const PAGE_SIZE = 20;

// Matches the server's gameResult codes
const RESULT_LABELS: Record<string, { label: string; className: string }> = {
  "1": { label: "Ba3ati won", className: "text-blue-600 dark:text-blue-400" },
  "2": { label: "Villagers won", className: "text-emerald-600 dark:text-emerald-400" },
  "3": { label: "Abu Janzeer won", className: "text-amber-600 dark:text-amber-400" },
  "0": { label: "Draw", className: "text-muted-foreground" },
};

export default function GamesPage() {
  const router = useRouter();
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    status: "all",
    type: "all",
    result: "all",
    rematch: "all",
    from: "",
    to: "",
    sort: "-createdAt",
  });
  const [games, setGames] = useState<Game[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const latest = useLatest();

  const fetchGames = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/games", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setGames(data.data.games);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const statusBadge = (s: string) => {
    if (s === "playing")
      return (
        <Badge className="bg-indigo-500 hover:bg-indigo-500 text-white">
          Playing
        </Badge>
      );
    if (s === "ended") return <Badge variant="secondary">Ended</Badge>;
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
      label: "Room",
      render: (g) => (
        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {g.roomId}
        </code>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (g) =>
        g.isQuickPlay ? (
          <Badge variant="secondary">Quick play</Badge>
        ) : g.isPublic ? (
          <Badge variant="outline">Public</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Private
          </Badge>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (g) => statusBadge(g.status),
    },
    {
      key: "result",
      label: "Last result",
      render: (g) => {
        const r = g.gameResult ? RESULT_LABELS[g.gameResult] : null;
        return r ? (
          <span className={`text-sm font-medium ${r.className}`}>{r.label}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      key: "games",
      label: "Games",
      sortKey: "games",
      className: "text-right",
      render: (g) => {
        const n = g.gamesCompleted ?? 0;
        // Rooms that finished before game counting existed
        if (n === 0 && g.gameResult) {
          return (
            <span className="text-muted-foreground" title="Played before game counting was added">
              —
            </span>
          );
        }
        return n > 1 ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="tabular-nums font-medium">{n}</span>
            <Badge className="bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30 hover:bg-pink-500/15">
              {n - 1} rematch{n - 1 > 1 ? "es" : ""}
            </Badge>
          </span>
        ) : (
          <span className="tabular-nums text-muted-foreground">{n}</span>
        );
      },
    },
    {
      key: "players",
      label: "Players",
      sortKey: "players",
      className: "text-right tabular-nums",
      render: (g) => g.players.length,
    },
    {
      key: "rounds",
      label: "Rounds",
      sortKey: "rounds",
      className: "text-right tabular-nums",
      render: (g) => g.roundNumber ?? "—",
    },
    {
      key: "createdAt",
      label: "Created",
      sortKey: "createdAt",
      render: (g) =>
        new Date(g.createdAt).toLocaleString("en-GB", {
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
        title="Games"
        description={
          total > 0
            ? `${total.toLocaleString()} ${activeCount ? "matching " : ""}${total === 1 ? "room" : "rooms"}`
            : "Active and historical game rooms."
        }
      />
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Room code or player name…"
        />
        <FilterSelect
          label="Status"
          value={params.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "all", label: "All" },
            { value: "waiting", label: "Waiting" },
            { value: "playing", label: "Playing" },
            { value: "ended", label: "Ended" },
          ]}
        />
        <FilterSelect
          label="Type"
          value={params.type}
          onChange={(type) => set({ type })}
          options={[
            { value: "all", label: "All" },
            { value: "quick", label: "Quick play" },
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
        />
        <FilterSelect
          label="Result"
          value={params.result}
          onChange={(result) => set({ result })}
          options={[
            { value: "all", label: "All" },
            ...Object.entries(RESULT_LABELS).map(([value, r]) => ({
              value,
              label: r.label,
            })),
          ]}
        />
        <FilterSelect
          label="Rematch"
          value={params.rematch}
          onChange={(rematch) => set({ rematch })}
          options={[
            { value: "all", label: "All" },
            { value: "yes", label: "Had rematches" },
            { value: "no", label: "Single game" },
          ]}
        />
        <FilterDateRange
          label="Created"
          from={params.from}
          to={params.to}
          onChange={(r) => set(r)}
        />
      </FilterBar>
      {error ? (
        <ErrorState title="Failed to load games" onRetry={fetchGames} />
      ) : (
        <DataTable
          columns={columns}
          data={games}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          sort={params.sort}
          onSortChange={(sort) => set({ sort })}
          onRowClick={(g) => router.push(`/games/${g._id}`)}
          emptyMessage={
            activeCount ? "No games match these filters" : "No games yet"
          }
          minWidth={900}
        />
      )}
    </>
  );
}
