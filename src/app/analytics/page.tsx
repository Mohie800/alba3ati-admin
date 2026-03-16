"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, Gamepad2, BarChart3, ArrowUpToLine } from "lucide-react";
import api from "@/lib/api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DailyEntry {
  date: string;
  newUsers: number;
  gamesPlayed: number;
  quickPlayGames: number;
  privateGames: number;
  publicGames: number;
  activeUsers: number;
  avgPlayersPerGame: number;
  peakConcurrent: number;
  gameResults: {
    ba3atiWins: number;
    villagerWins: number;
    abuJanzeerWins: number;
    draws: number;
  };
}

interface DailyStatsResponse {
  days: number;
  totals: {
    newUsers: number;
    gamesPlayed: number;
    activeUsers: number;
    peakConcurrent: number;
  };
  daily: DailyEntry[];
}

const PERIOD_OPTIONS = [
  { label: "7D", value: 7 },
  { label: "14D", value: 14 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

const RESULT_COLORS = {
  ba3atiWins: "#E74C3C",
  villagerWins: "#27AE60",
  abuJanzeerWins: "#8E44AD",
  draws: "#95A5A6",
};

const RESULT_LABELS: Record<string, string> = {
  ba3atiWins: "Ba3ati",
  villagerWins: "Villagers",
  abuJanzeerWins: "Abu Janzeer",
  draws: "Draw",
};

const GAME_TYPE_COLORS = ["#3498DB", "#E67E22", "#1ABC9C"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DailyStatsResponse | null>(null);
  const [error, setError] = useState(false);
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get(`/admin/daily-stats?days=${days}`);
      setData(res.data);
      setError(false);
    } catch {
      setError(true);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregate game results for pie chart
  const resultsPie =
    data?.daily.reduce(
      (acc, d) => {
        acc.ba3atiWins += d.gameResults?.ba3atiWins || 0;
        acc.villagerWins += d.gameResults?.villagerWins || 0;
        acc.abuJanzeerWins += d.gameResults?.abuJanzeerWins || 0;
        acc.draws += d.gameResults?.draws || 0;
        return acc;
      },
      { ba3atiWins: 0, villagerWins: 0, abuJanzeerWins: 0, draws: 0 }
    ) || null;

  const pieData = resultsPie
    ? Object.entries(resultsPie)
        .map(([key, value]) => ({
          name: RESULT_LABELS[key],
          value,
          color: RESULT_COLORS[key as keyof typeof RESULT_COLORS],
        }))
        .filter((d) => d.value > 0)
    : [];

  // Aggregate game types for pie chart
  const gameTypeTotals = data?.daily.reduce(
    (acc, d) => {
      acc.quickPlay += d.quickPlayGames || 0;
      acc.public += d.publicGames || 0;
      acc.private += d.privateGames || 0;
      return acc;
    },
    { quickPlay: 0, public: 0, private: 0 }
  );

  const gameTypePie = gameTypeTotals
    ? [
        { name: "Quick Play", value: gameTypeTotals.quickPlay, color: GAME_TYPE_COLORS[0] },
        { name: "Public", value: gameTypeTotals.public, color: GAME_TYPE_COLORS[1] },
        { name: "Private", value: gameTypeTotals.private, color: GAME_TYPE_COLORS[2] },
      ].filter((d) => d.value > 0)
    : [];

  // Chart data with formatted dates
  const chartData = data?.daily.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Analytics</h1>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDays(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    days === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load analytics</p>
              <Button variant="outline" onClick={fetchData}>
                Retry
              </Button>
            </div>
          ) : !data ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-6">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  label={`New Users (${days}d)`}
                  value={data.totals.newUsers}
                  icon={<UserPlus size={28} />}
                />
                <StatsCard
                  label={`Games Played (${days}d)`}
                  value={data.totals.gamesPlayed}
                  icon={<Gamepad2 size={28} />}
                />
                <StatsCard
                  label={`Total DAU (${days}d)`}
                  value={data.totals.activeUsers}
                  icon={<BarChart3 size={28} />}
                />
                <StatsCard
                  label="Peak Concurrent"
                  value={data.totals.peakConcurrent}
                  icon={<ArrowUpToLine size={28} />}
                />
              </div>

              {/* New Users + Active Users chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3498DB" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#27AE60" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="activeUsers"
                          stroke="#27AE60"
                          fill="url(#colorActive)"
                          name="Active Users"
                        />
                        <Area
                          type="monotone"
                          dataKey="newUsers"
                          stroke="#3498DB"
                          fill="url(#colorNew)"
                          name="New Users"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Games Played chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Games Played</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Bar
                          dataKey="quickPlayGames"
                          stackId="games"
                          fill={GAME_TYPE_COLORS[0]}
                          name="Quick Play"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="publicGames"
                          stackId="games"
                          fill={GAME_TYPE_COLORS[1]}
                          name="Public"
                          radius={[0, 0, 0, 0]}
                        />
                        <Bar
                          dataKey="privateGames"
                          stackId="games"
                          fill={GAME_TYPE_COLORS[2]}
                          name="Private"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Concurrent + Avg Players */}
              <Card>
                <CardHeader>
                  <CardTitle>Concurrent Players & Avg per Game</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPeak" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E67E22" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#E67E22" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 8,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="peakConcurrent"
                          stroke="#E67E22"
                          fill="url(#colorPeak)"
                          name="Peak Concurrent"
                        />
                        <Area
                          type="monotone"
                          dataKey="avgPlayersPerGame"
                          stroke="#9B59B6"
                          fill="none"
                          strokeDasharray="5 5"
                          name="Avg Players/Game"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Pie charts row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Win Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Win Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {pieData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm py-8 text-center">
                        No game data yet
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Game Type Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Game Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {gameTypePie.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={gameTypePie}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {gameTypePie.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm py-8 text-center">
                        No game data yet
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
