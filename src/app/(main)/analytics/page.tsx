"use client";

import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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

const TOOLTIP_STYLE = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  fontSize: 12,
} as const;

const GRID_STROKE = "var(--color-border)";
const AXIS_STROKE = "var(--color-muted-foreground)";

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
      { ba3atiWins: 0, villagerWins: 0, abuJanzeerWins: 0, draws: 0 },
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

  const gameTypeTotals = data?.daily.reduce(
    (acc, d) => {
      acc.quickPlay += d.quickPlayGames || 0;
      acc.public += d.publicGames || 0;
      acc.private += d.privateGames || 0;
      return acc;
    },
    { quickPlay: 0, public: 0, private: 0 },
  );

  const gameTypePie = gameTypeTotals
    ? [
        {
          name: "Quick Play",
          value: gameTypeTotals.quickPlay,
          color: GAME_TYPE_COLORS[0],
        },
        {
          name: "Public",
          value: gameTypeTotals.public,
          color: GAME_TYPE_COLORS[1],
        },
        {
          name: "Private",
          value: gameTypeTotals.private,
          color: GAME_TYPE_COLORS[2],
        },
      ].filter((d) => d.value > 0)
    : [];

  const chartData = data?.daily.map((d) => ({
    ...d,
    label: formatDate(d.date),
  }));

  const periodPicker = (
    <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setDays(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            days === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Player growth, game volume, and outcome trends."
        actions={periodPicker}
      />

      {error ? (
        <ErrorState
          title="Failed to load analytics"
          onRetry={fetchData}
        />
      ) : !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCard key={i} label="" value="" icon={null} loading />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-72 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label={`New Users (${days}d)`}
              value={data.totals.newUsers.toLocaleString()}
              icon={<UserPlus />}
              tone="sky"
            />
            <StatsCard
              label={`Games Played (${days}d)`}
              value={data.totals.gamesPlayed.toLocaleString()}
              icon={<Gamepad2 />}
              tone="indigo"
            />
            <StatsCard
              label={`Total DAU (${days}d)`}
              value={data.totals.activeUsers.toLocaleString()}
              icon={<BarChart3 />}
              tone="emerald"
            />
            <StatsCard
              label="Peak Concurrent"
              value={data.totals.peakConcurrent.toLocaleString()}
              icon={<ArrowUpToLine />}
              tone="amber"
            />
          </div>

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
                        <stop offset="5%" stopColor="#3498DB" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient
                        id="colorActive"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#27AE60" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: AXIS_STROKE }}
                      stroke={GRID_STROKE}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: AXIS_STROKE }}
                      stroke={GRID_STROKE}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#27AE60"
                      strokeWidth={2}
                      fill="url(#colorActive)"
                      name="Active Users"
                    />
                    <Area
                      type="monotone"
                      dataKey="newUsers"
                      stroke="#3498DB"
                      strokeWidth={2}
                      fill="url(#colorNew)"
                      name="New Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Games Played</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: AXIS_STROKE }}
                      stroke={GRID_STROKE}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: AXIS_STROKE }}
                      stroke={GRID_STROKE}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar
                      dataKey="quickPlayGames"
                      stackId="games"
                      fill={GAME_TYPE_COLORS[0]}
                      name="Quick Play"
                    />
                    <Bar
                      dataKey="publicGames"
                      stackId="games"
                      fill={GAME_TYPE_COLORS[1]}
                      name="Public"
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

          <Card>
            <CardHeader>
              <CardTitle>Concurrent Players &amp; Avg per Game</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorPeak"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#E67E22" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#E67E22" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: AXIS_STROKE }}
                      stroke={GRID_STROKE}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: AXIS_STROKE }}
                      stroke={GRID_STROKE}
                    />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Area
                      type="monotone"
                      dataKey="peakConcurrent"
                      stroke="#E67E22"
                      strokeWidth={2}
                      fill="url(#colorPeak)"
                      name="Peak Concurrent"
                    />
                    <Area
                      type="monotone"
                      dataKey="avgPlayersPerGame"
                      stroke="#9B59B6"
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray="5 5"
                      name="Avg Players/Game"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
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
                        <Tooltip contentStyle={TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
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
    </>
  );
}
