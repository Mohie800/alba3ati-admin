"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DataTable, { Column } from "@/components/DataTable";
import ErrorState from "@/components/ErrorState";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  FilterDateRange,
} from "@/components/FilterBar";
import { Badge } from "@/components/ui/badge";
import { useListParams, toQuery, useLatest } from "@/lib/useListParams";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

export const COIN_TYPE_LABELS: Record<string, string> = {
  game_complete: "Game Complete",
  game_win: "Game Win",
  ad_reward: "Ad Reward",
  shop_purchase: "Shop Purchase",
  role_purchase: "Role Purchase",
  admin_adjust: "Admin Adjust",
  referral_bonus: "Referral Bonus",
};

interface Transaction {
  _id: string;
  user: { _id: string; name: string } | null;
  amount: number;
  balance: number;
  type: string;
  meta?: { role?: "referrer" | "referee" } | null;
  createdAt: string;
}

const PAGE_SIZE = 25;

export default function CoinTransactionsTable() {
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    type: "all",
    direction: "all",
    from: "",
    to: "",
  });
  const latest = useLatest();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchRows = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/coin-transactions", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setRows(data.data.transactions);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const columns: Column<Transaction>[] = [
    {
      key: "user",
      label: "Player",
      render: (tx) =>
        tx.user ? (
          <Link
            href={`/players/${tx.user._id}`}
            className="font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {tx.user.name}
          </Link>
        ) : (
          <span className="text-muted-foreground italic">Deleted</span>
        ),
    },
    {
      key: "type",
      label: "Type",
      render: (tx) => (
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">
            {COIN_TYPE_LABELS[tx.type] || tx.type.replace(/_/g, " ")}
          </Badge>
          {tx.type === "referral_bonus" && tx.meta?.role && (
            <span className="text-xs text-muted-foreground">
              {tx.meta.role === "referrer" ? "invited a friend" : "was invited"}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      className: "text-right",
      render: (tx) => (
        <span
          className={cn(
            "font-medium tabular-nums",
            tx.amount >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400",
          )}
        >
          {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
        </span>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      className: "text-right tabular-nums",
      render: (tx) => tx.balance.toLocaleString(),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (tx) => (
        <span className="text-sm text-muted-foreground">
          {new Date(tx.createdAt).toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Player name or ID…"
        />
        <FilterSelect
          label="Type"
          value={params.type}
          onChange={(type) => set({ type })}
          options={[
            { value: "all", label: "All" },
            ...Object.entries(COIN_TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          ]}
        />
        <FilterSelect
          label="Direction"
          value={params.direction}
          onChange={(direction) => set({ direction })}
          options={[
            { value: "all", label: "All" },
            { value: "earn", label: "Earned" },
            { value: "spend", label: "Spent" },
          ]}
        />
        <FilterDateRange
          from={params.from}
          to={params.to}
          onChange={(r) => set(r)}
        />
      </FilterBar>
      {error ? (
        <ErrorState title="Failed to load transactions" onRetry={fetchRows} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          emptyMessage={
            activeCount ? "No transactions match these filters" : "No transactions yet"
          }
          minWidth={640}
        />
      )}
    </div>
  );
}
