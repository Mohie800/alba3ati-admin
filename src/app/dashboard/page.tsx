"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data.data);
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
              <p className="text-destructive mb-3">Failed to load dashboard stats</p>
              <Button variant="outline" onClick={fetchStats}>Retry</Button>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatsCard label="Total Players" value={stats.totalPlayers} icon={<Users size={28} />} />
              <StatsCard label="New Today" value={stats.playersToday} icon={<UserPlus size={28} />} />
              <StatsCard label="Active Games" value={stats.activeGames} icon={<Gamepad2 size={28} />} />
              <StatsCard label="Total Games" value={stats.totalGames} icon={<Trophy size={28} />} />
              <StatsCard label="Online Players" value={stats.onlinePlayers} icon={<Wifi size={28} />} />
              <StatsCard label="Active Connections" value={stats.activeConnections} icon={<Link size={28} />} />
              <StatsCard label="New Contacts" value={stats.newContacts} icon={<Mail size={28} />} />
              <StatsCard label="Pending Reports" value={stats.pendingReports} icon={<Flag size={28} />} />
            </div>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
