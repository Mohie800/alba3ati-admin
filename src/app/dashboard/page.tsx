"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

interface Stats {
  totalPlayers: number;
  playersToday: number;
  totalGames: number;
  activeGames: number;
  activeRooms: number;
  activeConnections: number;
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data.data);
      setError(false);
    } catch {
      setError(true);
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

  useEffect(() => {
    fetchStats();
    fetchOnlinePlayers();
    const interval = setInterval(fetchStats, 30000);
    const onlineInterval = setInterval(fetchOnlinePlayers, 15000);
    return () => {
      clearInterval(interval);
      clearInterval(onlineInterval);
    };
  }, [fetchStats, fetchOnlinePlayers]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold mb-6">Dashboard</h1>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">
                Failed to load dashboard stats
              </p>
              <Button variant="outline" onClick={fetchStats}>
                Retry
              </Button>
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatsCard
                  label="Total Players"
                  value={stats.totalPlayers}
                  icon={<Users size={28} />}
                />
                <StatsCard
                  label="New Today"
                  value={stats.playersToday}
                  icon={<UserPlus size={28} />}
                />
                <StatsCard
                  label="Active Games"
                  value={stats.activeGames}
                  icon={<Gamepad2 size={28} />}
                />
                <StatsCard
                  label="Total Games"
                  value={stats.totalGames}
                  icon={<Trophy size={28} />}
                />
                <StatsCard
                  label="Online Players"
                  value={stats.onlinePlayers}
                  icon={<Wifi size={28} />}
                />
                <StatsCard
                  label="Active Connections"
                  value={stats.activeConnections}
                  icon={<LinkIcon size={28} />}
                />
                <StatsCard
                  label="New Contacts"
                  value={stats.newContacts}
                  icon={<Mail size={28} />}
                />
                <StatsCard
                  label="Pending Reports"
                  value={stats.pendingReports}
                  icon={<Flag size={28} />}
                />
              </div>

              {/* Coins shortcut */}
              <Link href="/coins" className="block mt-4">
                <Card className="hover:bg-accent transition-colors cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Coins size={22} className="text-yellow-500" />
                      <span className="font-medium text-sm">
                        Coins Report &amp; Top Players
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>

              {/* Online Players */}
              <Card className="mt-4">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wifi size={18} className="text-green-500" />
                    Online Players
                    <Badge variant="secondary" className="ml-1">
                      {onlinePlayers.length}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchOnlinePlayers}
                    disabled={onlineLoading}
                    title="Refresh"
                  >
                    <RefreshCw
                      size={15}
                      className={onlineLoading ? "animate-spin" : ""}
                    />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Games Played</TableHead>
                          <TableHead>Coins</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {onlinePlayers.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No players online
                            </TableCell>
                          </TableRow>
                        ) : (
                          onlinePlayers.map((p) => (
                            <TableRow key={p._id}>
                              <TableCell className="font-medium">
                                <a
                                  href={`/players/${p._id}`}
                                  className="hover:underline"
                                >
                                  {p.name}
                                </a>
                              </TableCell>
                              <TableCell>
                                {p.status === "playing" ? (
                                  <Badge className="bg-blue-500 text-white">
                                    In Game
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-500 text-white">
                                    Online
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {p.roomId ? (
                                  <a
                                    href={`/games?room=${p.roomId}`}
                                    className="font-mono text-xs hover:underline text-muted-foreground"
                                  >
                                    {p.roomId}
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground text-xs">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{p.gamesPlayed}</TableCell>
                              <TableCell>{p.coins.toLocaleString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
