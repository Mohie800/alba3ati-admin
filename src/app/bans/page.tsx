"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import DataTable, { Column } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

interface Ban {
  _id: string;
  deviceId: string;
  reason: string;
  bannedBy: { username: string } | null;
  bannedAt: string;
}

export default function BansPage() {
  const [bans, setBans] = useState<Ban[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [banLoading, setBanLoading] = useState(false);

  const fetchBans = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/bans", { params: { page, limit: 20 } });
      setBans(data.data.bans);
      setPages(data.data.pages);
    } catch {
      /* handled by interceptor */
    }
  }, [page]);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleBan = async () => {
    if (!newDeviceId.trim()) return;
    setBanLoading(true);
    try {
      await api.post("/admin/bans", { deviceId: newDeviceId.trim(), reason: newReason.trim() });
      setShowBanDialog(false);
      setNewDeviceId("");
      setNewReason("");
      fetchBans();
    } catch {
      /* handled by interceptor */
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async (deviceId: string) => {
    if (!confirm(`Unban device ${deviceId}?`)) return;
    try {
      await api.delete(`/admin/bans/${deviceId}`);
      fetchBans();
    } catch {
      /* handled by interceptor */
    }
  };

  const columns: Column<Ban>[] = [
    { key: "deviceId", label: "Device ID" },
    { key: "reason", label: "Reason", render: (b) => b.reason || "—" },
    {
      key: "bannedBy",
      label: "Banned By",
      render: (b) => b.bannedBy?.username || "—",
    },
    {
      key: "bannedAt",
      label: "Date",
      render: (b) => new Date(b.bannedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      label: "",
      render: (b) => (
        <Button variant="destructive" size="sm" onClick={() => handleUnban(b.deviceId)}>
          Unban
        </Button>
      ),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Banned Devices</h1>
            <Button onClick={() => setShowBanDialog(true)}>Ban Device</Button>
          </div>
          <DataTable columns={columns} data={bans} page={page} pages={pages} onPageChange={setPage} />
        </main>
      </div>

      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban a Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Device ID</label>
              <Input
                placeholder="Enter device ID"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason (optional)</label>
              <Textarea
                placeholder="Reason for banning"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={banLoading || !newDeviceId.trim()}>
              {banLoading ? "Banning..." : "Ban Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
