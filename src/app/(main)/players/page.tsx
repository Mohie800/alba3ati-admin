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

interface Player {
  _id: string;
  name: string;
  email: string | null;
  deviceId: string | null;
  authProvider: "guest" | "google";
  coins: number;
  stats?: { gamesPlayed?: number; gamesWon?: number };
  referredBy: string | null;
  isBanned?: boolean;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function PlayersPage() {
  const router = useRouter();
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    authProvider: "all",
    activity: "all",
    referred: "all",
    from: "",
    to: "",
    sort: "-createdAt",
  });
  const [players, setPlayers] = useState<Player[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const latest = useLatest();

  const fetchPlayers = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/players", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setPlayers(data.data.players);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const columns: Column<Player>[] = [
    {
      key: "name",
      label: "Name",
      sortKey: "name",
      render: (p) => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{p.name}</span>
          {p.isBanned && (
            <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/15">
              Banned
            </Badge>
          )}
          {p.referredBy && (
            <Badge variant="outline" className="text-[10px]">
              Referred
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "authProvider",
      label: "Account",
      render: (p) =>
        p.authProvider === "google" ? (
          <div className="min-w-0">
            <Badge variant="secondary">Google</Badge>
            {p.email && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px] mt-0.5">
                {p.email}
              </div>
            )}
          </div>
        ) : (
          <Badge variant="outline">Guest</Badge>
        ),
    },
    {
      key: "coins",
      label: "Coins",
      sortKey: "coins",
      className: "text-right tabular-nums",
      render: (p) => (
        <span className="text-amber-600 dark:text-amber-400 font-medium">
          {(p.coins ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "gamesPlayed",
      label: "Games",
      sortKey: "gamesPlayed",
      className: "text-right tabular-nums",
      render: (p) => p.stats?.gamesPlayed ?? 0,
    },
    {
      key: "gamesWon",
      label: "Wins",
      sortKey: "gamesWon",
      className: "text-right tabular-nums",
      render: (p) => p.stats?.gamesWon ?? 0,
    },
    {
      key: "createdAt",
      label: "Joined",
      sortKey: "createdAt",
      render: (p) =>
        new Date(p.createdAt).toLocaleString("en-GB", {
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
        title="Players"
        description={
          total > 0
            ? `${total.toLocaleString()} ${activeCount ? "matching" : "registered"} ${
                total === 1 ? "player" : "players"
              }`
            : "Browse and inspect player accounts."
        }
      />
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Name, email, device or code…"
        />
        <FilterSelect
          label="Account"
          value={params.authProvider}
          onChange={(authProvider) => set({ authProvider })}
          options={[
            { value: "all", label: "All" },
            { value: "guest", label: "Guest" },
            { value: "google", label: "Google" },
          ]}
        />
        <FilterSelect
          label="Activity"
          value={params.activity}
          onChange={(activity) => set({ activity })}
          options={[
            { value: "all", label: "All" },
            { value: "played", label: "Has played" },
            { value: "never", label: "Never played" },
          ]}
        />
        <FilterSelect
          label="Referral"
          value={params.referred}
          onChange={(referred) => set({ referred })}
          options={[
            { value: "all", label: "All" },
            { value: "yes", label: "Referred" },
            { value: "no", label: "Not referred" },
          ]}
        />
        <FilterDateRange
          label="Joined"
          from={params.from}
          to={params.to}
          onChange={(r) => set(r)}
        />
      </FilterBar>
      {error ? (
        <ErrorState title="Failed to load players" onRetry={fetchPlayers} />
      ) : (
        <DataTable
          columns={columns}
          data={players}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          sort={params.sort}
          onSortChange={(sort) => set({ sort })}
          onRowClick={(p) => router.push(`/players/${p._id}`)}
          emptyMessage={
            activeCount ? "No players match these filters" : "No players yet"
          }
          minWidth={760}
        />
      )}
    </>
  );
}
