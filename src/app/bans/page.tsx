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
  expiresAt: string | null;
}

export default function BansPage() {
  const [bans, setBans] = useState<Ban[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [unbanTarget, setUnbanTarget] = useState<string | null>(null);

  const [error, setError] = useState(false);

  const fetchBans = useCallback(async () => {
    try {
      setError(false);
      const { data } = await api.get("/admin/bans", { params: { page, limit: 20 } });
      setBans(data.data.bans);
      setPages(data.data.pages);
    } catch {
      setError(true);
    }
  }, [page]);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  const handleBan = async () => {
    if (!newDeviceId.trim()) return;
    setBanLoading(true);
    try {
      await api.post("/admin/bans", {
        deviceId: newDeviceId.trim(),
        reason: newReason.trim(),
        ...(newExpiresAt && { expiresAt: new Date(newExpiresAt).toISOString() }),
      });
      setShowBanDialog(false);
      setNewDeviceId("");
      setNewReason("");
      setNewExpiresAt("");
      fetchBans();
    } catch {
      /* handled by interceptor */
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;
    try {
      await api.delete(`/admin/bans/${unbanTarget}`);
      setUnbanTarget(null);
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
      key: "expiresAt",
      label: "Expires",
      render: (b) => b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : "Permanent",
    },
    {
      key: "actions",
      label: "",
      render: (b) => (
        <Button variant="destructive" size="sm" onClick={() => setUnbanTarget(b.deviceId)}>
          Unban
        </Button>
      ),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Banned Devices</h1>
            <Button onClick={() => setShowBanDialog(true)}>Ban Device</Button>
          </div>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load bans</p>
              <Button variant="outline" onClick={fetchBans}>Retry</Button>
            </div>
          ) : (
            <DataTable columns={columns} data={bans} page={page} pages={pages} onPageChange={setPage} />
          )}
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
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Textarea
                placeholder="Reason for banning"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expires At (optional)</label>
              <Input
                type="datetime-local"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for a permanent ban</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={banLoading || !newDeviceId.trim() || !newReason.trim()}>
              {banLoading ? "Banning..." : "Ban Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!unbanTarget} onOpenChange={(open) => !open && setUnbanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unban</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to unban device <code className="bg-muted px-1 rounded">{unbanTarget}</code>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnbanTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleUnban}>
              Confirm Unban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
