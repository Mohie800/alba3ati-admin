"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
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
import api from "@/lib/api";
import { Coins, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

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

function BreakdownList({ items }: { items: TypeBreakdown[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No transactions
      </p>
    );
  }
  return (
    <div className="space-y-2.5">
      {items.map((b) => (
        <div
          key={b._id}
          className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Badge variant="outline">{TYPE_LABELS[b._id] || b._id}</Badge>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {b.count.toLocaleString()} txns
            </span>
          </div>
          <span
            className={cn(
              "font-semibold text-sm tabular-nums",
              b.totalAmount >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {b.totalAmount >= 0 ? "+" : ""}
            {b.totalAmount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function rankBadge(i: number) {
  if (i === 0)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-xs">
        1
      </span>
    );
  if (i === 1)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-700 dark:text-slate-300 font-bold text-xs">
        2
      </span>
    );
  if (i === 2)
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-400 font-bold text-xs">
        3
      </span>
    );
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-muted-foreground font-mono text-xs">
      {i + 1}
    </span>
  );
}

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
    <AppShell>
      <PageHeader
        title="Coins"
        description="Coin economy: circulation, transactions, and leaderboard."
      />

      {error ? (
        <ErrorState title="Failed to load coin stats" onRetry={fetchData} />
      ) : !coinStats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatsCard key={i} label="" value="" icon={null} loading />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              label="In Circulation"
              value={coinStats.totalCoinsInCirculation.toLocaleString()}
              icon={<Coins />}
              tone="amber"
            />
            <StatsCard
              label="Total Earned"
              value={coinStats.totalEarned.toLocaleString()}
              icon={<TrendingUp />}
              tone="emerald"
              hint="all time"
            />
            <StatsCard
              label="Total Spent"
              value={coinStats.totalSpent.toLocaleString()}
              icon={<TrendingDown />}
              tone="rose"
              hint="all time"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All-Time Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownList items={coinStats.breakdownByType} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Today</CardTitle>
              </CardHeader>
              <CardContent>
                <BreakdownList items={coinStats.todayBreakdown} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Top Players by Coins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-14 bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        #
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Player
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Coins
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Played
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Won
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Joined
                      </TableHead>
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
                        <TableRow
                          key={p._id}
                          className="hover:bg-accent/60 transition-colors"
                        >
                          <TableCell>{rankBadge(i)}</TableCell>
                          <TableCell className="font-medium">
                            <Link
                              href={`/players/${p._id}`}
                              className="hover:underline"
                            >
                              {p.name}
                            </Link>
                          </TableCell>
                          <TableCell className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                            {p.coins.toLocaleString()}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {p.stats?.gamesPlayed ?? 0}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {p.stats?.gamesWon ?? 0}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(p.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Transactions</CardTitle>
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
                        Type
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Amount
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Balance
                      </TableHead>
                      <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Date
                      </TableHead>
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
                              <Link
                                href={`/players/${tx.user._id}`}
                                className="hover:underline"
                              >
                                {tx.user.name}
                              </Link>
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
                            className={cn(
                              "font-medium tabular-nums",
                              tx.amount >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400",
                            )}
                          >
                            {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {tx.balance}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(tx.createdAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
