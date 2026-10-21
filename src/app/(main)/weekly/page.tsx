"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, Settings, Users } from "lucide-react";
import api from "@/lib/api";

interface CurrentRow {
  _id: string;
  rank: number;
  user: { _id: string; name: string };
  wins: number;
  games: number;
}

interface Winner {
  rank: number;
  user: { _id: string; name: string } | null;
  wins: number;
  games: number;
  coins: number;
  paid: boolean;
}

interface ResultRow {
  _id: string;
  week: string;
  winners: Winner[];
  createdAt: string;
}

const PAGE_SIZE = 10;

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Khartoum",
  });

const fmtWeek = (week: string) => {
  const start = new Date(`${week}T00:00:00Z`);
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", timeZone: "UTC" };
  return `${start.toLocaleDateString("en-GB", opts)} – ${end.toLocaleDateString("en-GB", { ...opts, year: "numeric" })}`;
};

const PlayerLink = ({ user }: { user: { _id: string; name: string } | null }) =>
  user ? (
    <Link
      href={`/players/${user._id}`}
      className="hover:underline text-primary font-medium"
      onClick={(e) => e.stopPropagation()}
    >
      {user.name}
    </Link>
  ) : (
    <span className="text-muted-foreground italic">Deleted</span>
  );

export default function WeeklyLeaderboardPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [week, setWeek] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [players, setPlayers] = useState(0);
  const [current, setCurrent] = useState<CurrentRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/weekly-leaderboard", {
        params: { page, limit: PAGE_SIZE },
      });
      const d = data.data;
      setWeek(d.week);
      setEndsAt(d.endsAt);
      setPlayers(d.players);
      setCurrent(d.current.map((r: Omit<CurrentRow, "_id">) => ({ ...r, _id: r.user._id })));
      setResults(d.results);
      setPages(d.pagination.totalPages || 1);
      setTotal(d.pagination.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentColumns: Column<CurrentRow>[] = [
    { key: "rank", label: "#", render: (r) => <span className="font-semibold">{r.rank}</span> },
    { key: "player", label: "Player", render: (r) => <PlayerLink user={r.user} /> },
    { key: "wins", label: "Wins", render: (r) => r.wins },
    { key: "games", label: "Games", render: (r) => r.games },
  ];

  const winnerCell = (w?: Winner) =>
    w ? (
      <span className="inline-flex items-center gap-2">
        <PlayerLink user={w.user} />
        <span className="text-xs text-muted-foreground">
          {w.wins}W · {w.coins} coins
        </span>
        {!w.paid && (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/15">
            Unpaid
          </Badge>
        )}
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    );

  const resultColumns: Column<ResultRow>[] = [
    { key: "week", label: "Week", render: (r) => <span className="text-sm">{fmtWeek(r.week)}</span> },
    ...[1, 2, 3].map((rank) => ({
      key: `rank${rank}`,
      label: ["1st", "2nd", "3rd"][rank - 1],
      render: (r: ResultRow) => winnerCell(r.winners.find((w) => w.rank === rank)),
    })),
  ];

  if (error) {
    return (
      <>
        <PageHeader title="Weekly Leaderboard" />
        <ErrorState title="Failed to load the weekly leaderboard" onRetry={fetchData} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Weekly Leaderboard"
        description="Most wins from Saturday to Friday (Khartoum time). The top 3 are paid automatically a minute or so after the week ends."
        actions={
          <Button variant="outline" onClick={() => router.push("/settings#weekly")}>
            <Settings size={14} className="mr-1.5" />
            Rewards
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
        <StatsCard
          label="Players this week"
          value={players.toLocaleString()}
          icon={<Users />}
          tone="sky"
          loading={loading && !week}
        />
        <StatsCard
          label="Week ends"
          value={endsAt ? fmtDay(endsAt) : "—"}
          icon={<CalendarClock />}
          tone="amber"
          loading={loading && !week}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>This week{week && ` · ${fmtWeek(week)}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={currentColumns}
            data={current}
            page={1}
            pages={1}
            loading={loading}
            onPageChange={() => {}}
            onRowClick={(r) => router.push(`/players/${r.user._id}`)}
            emptyMessage="No wins yet this week"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past winners</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={resultColumns}
            data={results}
            page={page}
            pages={pages}
            total={total}
            pageSize={PAGE_SIZE}
            loading={loading}
            onPageChange={setPage}
            emptyMessage="No finished weeks yet"
            minWidth={760}
          />
        </CardContent>
      </Card>
    </>
  );
}
