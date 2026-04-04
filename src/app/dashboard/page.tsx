"use client";

import { useEffect, useState, useCallback } from "react";
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
  Link,
  Mail,
  Flag,
  Coins,
  TrendingUp,
  TrendingDown,
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

interface TypeBreakdown {
  _id: string;
  totalAmount: number;
  count: number;
}

interface RecentTransaction {
  _id: string;
  user: { _id: string; name: string } | null;
  amount: number;
  balance: number;
  type: string;
  createdAt: string;
}

interface CoinStats {
  totalCoinsInCirculation: number;
  totalEarned: number;
  totalSpent: number;
  breakdownByType: TypeBreakdown[];
  todayBreakdown: TypeBreakdown[];
  recentTransactions: RecentTransaction[];
}

const TYPE_LABELS: Record<string, string> = {
  game_complete: "Game Complete",
  game_win: "Game Win",
  ad_reward: "Ad Reward",
  shop_purchase: "Shop Purchase",
  admin_adjust: "Admin Adjust",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [coinStats, setCoinStats] = useState<CoinStats | null>(null);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, coinRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/coin-stats"),
      ]);
      setStats(statsRes.data.data);
      setCoinStats(coinRes.data.data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

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
                  icon={<Link size={28} />}
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

              {coinStats && (
                <>
                  <h2 className="text-lg font-semibold mt-8 mb-4">
                    Coins Report
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <StatsCard
                      label="Total In Circulation"
                      value={coinStats.totalCoinsInCirculation.toLocaleString()}
                      icon={<Coins size={28} />}
                    />
                    <StatsCard
                      label="Total Earned (All Time)"
                      value={coinStats.totalEarned.toLocaleString()}
                      icon={<TrendingUp size={28} />}
                    />
                    <StatsCard
                      label="Total Spent (All Time)"
                      value={coinStats.totalSpent.toLocaleString()}
                      icon={<TrendingDown size={28} />}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* All-time breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          All-Time Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {coinStats.breakdownByType.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No transactions yet
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {coinStats.breakdownByType.map((b) => (
                              <div
                                key={b._id}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {TYPE_LABELS[b._id] || b._id}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {b.count.toLocaleString()} txns
                                  </span>
                                </div>
                                <span
                                  className={`font-medium text-sm ${b.totalAmount >= 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                  {b.totalAmount >= 0 ? "+" : ""}
                                  {b.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Today breakdown */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {coinStats.todayBreakdown.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No transactions today
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {coinStats.todayBreakdown.map((b) => (
                              <div
                                key={b._id}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {TYPE_LABELS[b._id] || b._id}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {b.count.toLocaleString()} txns
                                  </span>
                                </div>
                                <span
                                  className={`font-medium text-sm ${b.totalAmount >= 0 ? "text-green-500" : "text-red-500"}`}
                                >
                                  {b.totalAmount >= 0 ? "+" : ""}
                                  {b.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent transactions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Recent Transactions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg overflow-x-auto">
                        <Table className="min-w-[500px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Player</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Balance</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {coinStats.recentTransactions.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={5}
                                  className="text-center py-8 text-muted-foreground"
                                >
                                  No transactions
                                </TableCell>
                              </TableRow>
                            ) : (
                              coinStats.recentTransactions.map((tx) => (
                                <TableRow key={tx._id}>
                                  <TableCell>
                                    {tx.user?.name || (
                                      <span className="text-muted-foreground italic">
                                        Deleted
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {TYPE_LABELS[tx.type] ||
                                        tx.type.replace(/_/g, " ")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    className={
                                      tx.amount >= 0
                                        ? "text-green-500 font-medium"
                                        : "text-red-500 font-medium"
                                    }
                                  >
                                    {tx.amount >= 0
                                      ? `+${tx.amount}`
                                      : tx.amount}
                                  </TableCell>
                                  <TableCell>{tx.balance}</TableCell>
                                  <TableCell>
                                    {new Date(tx.createdAt).toLocaleString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )}
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
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
