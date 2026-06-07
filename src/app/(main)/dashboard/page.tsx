"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import {
  Users,
  UserPlus,
  Gamepad2,
  Trophy,
  Wifi,
  Link as LinkIcon,
  Mail,
  Flag,
  Coins,
  RefreshCw,
  ArrowRight,
  Inbox,
} from "lucide-react";

interface Stats {
  totalPlayers: number;
  playersToday: number;
  totalGames: number;
  activeGames: number;
  activeRooms: number;
  activeConnections: number;
  activeSocketConnections: number;
  onlinePlayers: number;
  newContacts: number;
  pendingReports: number;
}

interface OnlinePlayer {
  _id: string;
  name: string;
  coins: number;
  gamesPlayed: number;
  status: "online" | "playing";
  roomId: string | null;
  roomStatus: string | null;
}

function formatRelative(date: Date | null) {
  if (!date) return "";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString();
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.data);
      setError(false);
      setLastUpdated(new Date());
    } catch {
      setError(true);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchOnlinePlayers = useCallback(async () => {
    setOnlineLoading(true);
    try {
      const res = await api.get("/admin/online-players");
      setOnlinePlayers(res.data.data.players);
    } catch {
      // silently ignore
    } finally {
      setOnlineLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    fetchStats();
    fetchOnlinePlayers();
  }, [fetchStats, fetchOnlinePlayers]);

  useEffect(() => {
    fetchStats();
    fetchOnlinePlayers();

    const isVisible = () =>
      typeof document === "undefined" || !document.hidden;

    const interval = setInterval(() => {
      if (isVisible()) fetchStats();
    }, 30000);
    const onlineInterval = setInterval(() => {
      if (isVisible()) fetchOnlinePlayers();
    }, 15000);
    const tick = setInterval(() => {
      if (isVisible()) setNow(Date.now());
    }, 5000);

    const handleVisibility = () => {
      if (isVisible()) {
        fetchStats();
        fetchOnlinePlayers();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      clearInterval(onlineInterval);
      clearInterval(tick);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchStats, fetchOnlinePlayers]);

  // re-render relative time
  void now;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live overview of players, games, and pending operations."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={statsLoading}
          >
            <RefreshCw
              size={14}
              className={`mr-1.5 ${statsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        }
      >
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Updated {formatRelative(lastUpdated)} · auto-refreshes every 30s
          </p>
        )}
      </PageHeader>

      {error && !stats ? (
        <ErrorState
          title="Failed to load stats"
          message="The dashboard couldn't reach the server."
          onRetry={fetchStats}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats ? (
              <>
                <StatsCard
                  label="Total Players"
                  value={stats.totalPlayers.toLocaleString()}
                  icon={<Users />}
                  tone="emerald"
                  hint={`+${stats.playersToday} today`}
                />
                <StatsCard
                  label="New Today"
                  value={stats.playersToday.toLocaleString()}
                  icon={<UserPlus />}
                  tone="sky"
                />
                <StatsCard
                  label="Online Now"
                  value={stats.onlinePlayers.toLocaleString()}
                  icon={<Wifi />}
                  tone="teal"
                  hint={`${stats.activeSocketConnections} sockets`}
                />
                <StatsCard
                  label="Active Games"
                  value={stats.activeGames.toLocaleString()}
                  icon={<Gamepad2 />}
                  tone="indigo"
                />
                <StatsCard
                  label="Total Games"
                  value={stats.totalGames.toLocaleString()}
                  icon={<Trophy />}
                  tone="amber"
                />
                <StatsCard
                  label="Active Rooms"
                  value={stats.activeRooms.toLocaleString()}
                  icon={<LinkIcon />}
                  tone="violet"
                />
                <StatsCard
                  label="New Contacts"
                  value={stats.newContacts.toLocaleString()}
                  icon={<Mail />}
                  tone="cyan"
                />
                <StatsCard
                  label="Pending Reports"
                  value={stats.pendingReports.toLocaleString()}
                  icon={<Flag />}
                  tone={stats.pendingReports > 0 ? "red" : "default"}
                />
              </>
            ) : (
              Array.from({ length: 8 }).map((_, i) => (
                <StatsCard
                  key={i}
                  label=""
                  value=""
                  icon={null}
                  loading
                />
              ))
            )}
          </div>

          {/* Coins shortcut + Reports shortcut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <Link href="/coins" className="block group">
              <Card className="group-hover:border-amber-500/40 group-hover:shadow-md transition-all">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Coins size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Coins Report</p>
                      <p className="text-xs text-muted-foreground">
                        Top players &amp; transactions
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all"
                  />
                </CardContent>
              </Card>
            </Link>
            <Link href="/reports" className="block group">
              <Card className="group-hover:border-orange-500/40 group-hover:shadow-md transition-all">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                      <Flag size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Pending Reports{" "}
                        {stats?.pendingReports ? (
                          <span className="ml-1 text-orange-600 dark:text-orange-400 font-semibold">
                            {stats.pendingReports}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Review and moderate
                      </p>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all"
                  />
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Online Players */}
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
                <CardTitle className="text-base">Online Players</CardTitle>
                <Badge variant="secondary" className="ml-0">
                  {onlinePlayers.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchOnlinePlayers}
                disabled={onlineLoading}
                title="Refresh"
                className="h-8 w-8"
              >
                <RefreshCw
                  size={14}
                  className={onlineLoading ? "animate-spin" : ""}
                />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Player
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Status
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Room
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Games
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Coins
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineLoading && onlinePlayers.length === 0 ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i} className="hover:bg-transparent">
                          <TableCell>
                            <Skeleton className="h-4 w-24" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-10" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-14" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : onlinePlayers.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                              <Inbox size={18} />
                            </div>
                            <p className="text-sm">No players online</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      onlinePlayers.map((p) => (
                        <TableRow
                          key={p._id}
                          className="transition-colors hover:bg-accent/60"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/players/${p._id}`}
                              className="hover:underline"
                            >
                              {p.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {p.status === "playing" ? (
                              <Badge className="bg-indigo-500 hover:bg-indigo-500 text-white">
                                In Game
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">
                                Online
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {p.roomId ? (
                              <Link
                                href={`/games?room=${p.roomId}`}
                                className="font-mono text-xs hover:underline text-muted-foreground"
                              >
                                {p.roomId}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {p.gamesPlayed}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {p.coins.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
