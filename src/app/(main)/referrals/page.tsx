"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import StatsCard from "@/components/StatsCard";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
} from "@/components/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, Hourglass, Settings } from "lucide-react";
import { useListParams, toQuery, useLatest } from "@/lib/useListParams";
import api from "@/lib/api";

interface ReferralRow {
  _id: string;
  name: string;
  createdAt: string;
  referralStatus: "pending" | "rewarded";
  referralRewardedAt: string | null;
  referredBy: { _id: string; name: string; referralCode?: string } | null;
  stats?: { gamesPlayed?: number };
}

const PAGE_SIZE = 20;

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ReferralsPage() {
  const router = useRouter();
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    status: "all",
  });
  const latest = useLatest();
  const [rows, setRows] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState({ pending: 0, rewarded: 0 });
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
      const { data } = await api.get("/admin/referrals", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setRows(data.data.referrals);
      setSummary(data.data.summary);
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

  const columns: Column<ReferralRow>[] = [
    {
      key: "name",
      label: "New player",
      render: (r) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: "referredBy",
      label: "Invited by",
      render: (r) =>
        r.referredBy ? (
          <span className="inline-flex items-center gap-2">
            <Link
              href={`/players/${r.referredBy._id}`}
              className="hover:underline text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {r.referredBy.name}
            </Link>
            {r.referredBy.referralCode && (
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {r.referredBy.referralCode}
              </code>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground italic">Deleted</span>
        ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) =>
        r.referralStatus === "rewarded" ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15">
            Rewarded
          </Badge>
        ) : (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/15">
            Waiting for first game
          </Badge>
        ),
    },
    {
      key: "createdAt",
      label: "Signed up",
      render: (r) => <span className="text-sm">{fmt(r.createdAt)}</span>,
    },
    {
      key: "rewardedAt",
      label: "Rewarded",
      render: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.referralRewardedAt ? fmt(r.referralRewardedAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Referrals"
        description="New players who signed up with a friend's code on a new device. Both get coins after the new player's first finished game."
        actions={
          <Button variant="outline" onClick={() => router.push("/settings#referral")}>
            <Settings size={14} className="mr-1.5" />
            Rewards &amp; limits
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-xl">
        <StatsCard
          label="Rewarded referrals"
          value={summary.rewarded.toLocaleString()}
          icon={<Gift />}
          tone="emerald"
        />
        <StatsCard
          label="Waiting for first game"
          value={summary.pending.toLocaleString()}
          icon={<Hourglass />}
          tone="amber"
        />
      </div>
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Player, referrer or code…"
        />
        <FilterSelect
          label="Status"
          value={params.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "all", label: "All" },
            { value: "rewarded", label: "Rewarded" },
            { value: "pending", label: "Waiting for first game" },
          ]}
        />
      </FilterBar>
      {error ? (
        <ErrorState title="Failed to load referrals" onRetry={fetchRows} />
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
          onRowClick={(r) => router.push(`/players/${r._id}`)}
          emptyMessage={
            activeCount ? "No referrals match these filters" : "No referrals yet"
          }
          minWidth={760}
        />
      )}
    </>
  );
}
