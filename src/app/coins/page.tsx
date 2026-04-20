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
import { Coins, TrendingUp, TrendingDown, Trophy } from "lucide-react";

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

interface TopPlayer {
  _id: string;
  name: string;
  profilePicture?: string;
  coins: number;
  stats?: { gamesPlayed: number; gamesWon: number };
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  game_complete: "Game Complete",
  game_win: "Game Win",
  ad_reward: "Ad Reward",
  shop_purchase: "Shop Purchase",
  admin_adjust: "Admin Adjust",
};

export default function CoinsPage() {
  const [coinStats, setCoinStats] = useState<CoinStats | null>(null);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [coinRes, topRes] = await Promise.all([
        api.get("/admin/coin-stats"),
        api.get("/admin/top-players-coins?limit=50"),
      ]);
      setCoinStats(coinRes.data.data);
      setTopPlayers(topRes.data.data.players);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold mb-6">Coins</h1>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load coin stats</p>
              <Button variant="outline" onClick={fetchData}>
                Retry
              </Button>
            </div>
          ) : coinStats ? (
            <>
              {/* Summary stats */}
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

              {/* Breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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

              {/* Top players by coins */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-500" />
                    Top Players by Coins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-x-auto">
                    <Table className="min-w-[500px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead>Coins</TableHead>
                          <TableHead>Games Played</TableHead>
                          <TableHead>Games Won</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topPlayers.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No players found
                            </TableCell>
                          </TableRow>
                        ) : (
                          topPlayers.map((p, i) => (
                            <TableRow key={p._id}>
                              <TableCell className="text-muted-foreground font-mono text-sm">
                                {i === 0 ? (
                                  <span className="text-yellow-500 font-bold">
                                    1
                                  </span>
                                ) : i === 1 ? (
                                  <span className="text-slate-400 font-bold">
                                    2
                                  </span>
                                ) : i === 2 ? (
                                  <span className="text-orange-400 font-bold">
                                    3
                                  </span>
                                ) : (
                                  i + 1
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                <a
                                  href={`/players/${p._id}`}
                                  className="hover:underline"
                                >
                                  {p.name}
                                </a>
                              </TableCell>
                              <TableCell className="font-semibold text-yellow-600">
                                {p.coins.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {p.stats?.gamesPlayed ?? 0}
                              </TableCell>
                              <TableCell>{p.stats?.gamesWon ?? 0}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(p.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
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
                                {tx.user ? (
                                  <a
                                    href={`/players/${tx.user._id}`}
                                    className="hover:underline"
                                  >
                                    {tx.user.name}
                                  </a>
                                ) : (
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
                                {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
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
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
