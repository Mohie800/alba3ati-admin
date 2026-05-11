"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import { Badge } from "@/components/ui/badge";
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
import { Ban as BanIcon } from "lucide-react";
import api from "@/lib/api";

interface Ban {
  _id: string;
  deviceId: string;
  reason: string;
  bannedBy: { username: string } | null;
  bannedAt: string;
  expiresAt: string | null;
}

const PAGE_SIZE = 20;

export default function BansPage() {
  const [bans, setBans] = useState<Ban[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [newReason, setNewReason] = useState("");
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [unbanTarget, setUnbanTarget] = useState<string | null>(null);

  const [error, setError] = useState(false);

  const fetchBans = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/bans", {
        params: { page, limit: PAGE_SIZE },
      });
      setBans(data.data.bans);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
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
        ...(newExpiresAt && {
          expiresAt: new Date(newExpiresAt).toISOString(),
        }),
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
    {
      key: "deviceId",
      label: "Device ID",
      render: (b) => (
        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
          {b.deviceId}
        </code>
      ),
    },
    {
      key: "reason",
      label: "Reason",
      render: (b) => (
        <span className="text-sm">
          {b.reason || <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    {
      key: "bannedBy",
      label: "Banned By",
      render: (b) => (
        <span className="text-sm">{b.bannedBy?.username || "—"}</span>
      ),
    },
    {
      key: "bannedAt",
      label: "Date",
      render: (b) => new Date(b.bannedAt).toLocaleDateString(),
    },
    {
      key: "expiresAt",
      label: "Expires",
      render: (b) =>
        b.expiresAt ? (
          new Date(b.expiresAt).toLocaleDateString()
        ) : (
          <Badge variant="destructive">Permanent</Badge>
        ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (b) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setUnbanTarget(b.deviceId)}
        >
          Unban
        </Button>
      ),
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Banned Devices"
        description="Manage device-level bans."
        actions={
          <Button variant="destructive" onClick={() => setShowBanDialog(true)}>
            <BanIcon size={14} className="mr-1.5" />
            Ban Device
          </Button>
        }
      />
      {error ? (
        <ErrorState title="Failed to load bans" onRetry={fetchBans} />
      ) : (
        <DataTable
          columns={columns}
          data={bans}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          emptyMessage="No banned devices"
        />
      )}

      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban a Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Device ID
              </label>
              <Input
                placeholder="Enter device ID"
                value={newDeviceId}
                onChange={(e) => setNewDeviceId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Reason</label>
              <Textarea
                placeholder="Reason for banning"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Expires At (optional)
              </label>
              <Input
                type="datetime-local"
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for a permanent ban
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={banLoading || !newDeviceId.trim() || !newReason.trim()}
            >
              {banLoading ? "Banning…" : "Ban Device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!unbanTarget}
        onOpenChange={(open) => !open && setUnbanTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unban</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to unban device{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {unbanTarget}
            </code>
            ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnbanTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleUnban}>Confirm Unban</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
