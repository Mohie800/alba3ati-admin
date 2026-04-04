"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

interface Player {
  _id: string;
  name: string;
  deviceId: string | null;
  createdAt: string;
}

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchBy, setSearchBy] = useState<"name" | "deviceId">("name");
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
    try {
      setError(false);
      const { data } = await api.get("/admin/players", {
        params: { page, limit: 20, search: debouncedSearch, searchBy },
      });
      setPlayers(data.data.players);
      setPages(data.data.pages);
    } catch {
      setError(true);
    }
  }, [page, debouncedSearch, searchBy]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, searchBy]);

  const columns: Column<Player>[] = [
    { key: "name", label: "Name" },
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
      label: "Joined At",
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

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Players</h1>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border overflow-hidden text-sm">
                <button
                  className={`px-3 py-1.5 transition-colors ${
                    searchBy === "name"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => {
                    setSearchBy("name");
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                >
                  Name
                </button>
                <button
                  className={`px-3 py-1.5 transition-colors ${
                    searchBy === "deviceId"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                  onClick={() => {
                    setSearchBy("deviceId");
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                >
                  Device ID
                </button>
              </div>
              <Input
                placeholder={
                  searchBy === "name"
                    ? "Search by name..."
                    : "Search by device ID..."
                }
                className="w-full sm:w-64"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load players</p>
              <Button variant="outline" onClick={fetchPlayers}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={players}
              page={page}
              pages={pages}
              onPageChange={setPage}
              onRowClick={(p) => router.push(`/players/${p._id}`)}
            />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
