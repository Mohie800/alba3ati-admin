"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import api from "@/lib/api";

interface Player {
  _id: string;
  name: string;
  email: string | null;
  deviceId: string | null;
  createdAt: string;
}

const PAGE_SIZE = 20;

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  };

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/players", {
        params: { page, limit: PAGE_SIZE, search: debouncedSearch },
      });
      setPlayers(data.data.players);
      setPages(data.data.pages);
      setTotal(data.data.total ?? data.data.totalCount ?? data.data.count ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const columns: Column<Player>[] = [
    {
      key: "name",
      label: "Name",
      render: (p) => <span className="font-medium">{p.name}</span>,
    },
    {
      key: "email",
      label: "Email",
      render: (p) =>
        p.email ? (
          <span className="text-sm">{p.email}</span>
        ) : (
          <span className="text-muted-foreground italic">None</span>
        ),
    },
    {
      key: "deviceId",
      label: "Device ID",
      render: (p) =>
        p.deviceId ? (
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
            {p.deviceId}
          </code>
        ) : (
          <span className="text-muted-foreground italic">None</span>
        ),
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (p) =>
        new Date(p.createdAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  const searchControls = (
    <div className="relative w-full sm:w-80">
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
      <Input
        placeholder="Search by name, email, or device ID…"
        className="pl-9"
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
      />
    </div>
  );

  return (
    <>
      <PageHeader
        title="Players"
        description={
          total > 0
            ? `${total.toLocaleString()} registered ${
                total === 1 ? "player" : "players"
              }`
            : "Browse and inspect player accounts."
        }
        actions={searchControls}
      />
      {error ? (
        <ErrorState
          title="Failed to load players"
          onRetry={fetchPlayers}
        />
      ) : (
        <DataTable
          columns={columns}
          data={players}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          onRowClick={(p) => router.push(`/players/${p._id}`)}
          emptyMessage={
            debouncedSearch
              ? `No players match "${debouncedSearch}"`
              : "No players yet"
          }
        />
      )}
    </>
  );
}
