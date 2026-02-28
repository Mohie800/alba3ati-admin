"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/api";

interface Notification {
  _id: string;
  title: string;
  body: string;
  type: "broadcast" | "targeted" | "contact_response";
  recipientCount: number;
  sentBy: { username: string } | null;
  sentAt: string;
}

interface Player {
  _id: string;
  name: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "specific">("all");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/notifications", {
        params: { page, limit: 20 },
      });
      setNotifications(data.data.notifications);
      setPages(data.data.pages);
    } catch {
      /* handled by interceptor */
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const fetchPlayers = async () => {
    try {
      const { data } = await api.get("/admin/players", {
        params: { limit: 500 },
      });
      setPlayers(data.data.players);
    } catch {
      /* handled by interceptor */
    }
  };

  const handleOpenSendDialog = () => {
    setShowSendDialog(true);
    fetchPlayers();
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
      };
      if (recipientMode === "specific" && selectedPlayerIds.length > 0) {
        payload.userIds = selectedPlayerIds;
      }
      await api.post("/admin/notifications/send", payload);
      setShowSendDialog(false);
      setTitle("");
      setBody("");
      setRecipientMode("all");
      setSelectedPlayerIds([]);
      fetchNotifications();
    } catch {
      /* handled by interceptor */
    } finally {
      setSending(false);
    }
  };

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const typeBadgeVariant = (type: string) => {
    if (type === "contact_response") return "destructive" as const;
    if (type === "targeted") return "outline" as const;
    return "default" as const;
  };

  const typeLabel = (type: string) => {
    if (type === "contact_response") return "Contact Response";
    if (type === "targeted") return "Targeted";
    return "Broadcast";
  };

  const columns: Column<Notification>[] = [
    { key: "title", label: "Title" },
    {
      key: "body",
      label: "Body",
      render: (n) => (
        <span className="text-sm truncate max-w-[200px] block">{n.body}</span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (n) => (
        <Badge variant={typeBadgeVariant(n.type)}>{typeLabel(n.type)}</Badge>
      ),
    },
    {
      key: "recipientCount",
      label: "Recipients",
      render: (n) => n.recipientCount,
    },
    {
      key: "sentBy",
      label: "Sent By",
      render: (n) => n.sentBy?.username || "System",
    },
    {
      key: "sentAt",
      label: "Date",
      render: (n) => new Date(n.sentAt).toLocaleDateString(),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Notifications</h1>
            <Button onClick={handleOpenSendDialog}>Send Notification</Button>
          </div>
          <DataTable
            columns={columns}
            data={notifications}
            page={page}
            pages={pages}
            onPageChange={setPage}
          />
        </main>
      </div>

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Body</label>
              <Textarea
                placeholder="Notification body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Recipients
              </label>
              <Select
                value={recipientMode}
                onValueChange={(v) =>
                  setRecipientMode(v as "all" | "specific")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recipientMode === "specific" && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Select Players ({selectedPlayerIds.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1">
                  {players.map((player) => (
                    <label
                      key={player._id}
                      className="flex items-center gap-2 py-1 px-2 rounded hover:bg-accent cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player._id)}
                        onChange={() => togglePlayer(player._id)}
                        className="rounded"
                      />
                      {player.name}
                    </label>
                  ))}
                  {players.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Loading players...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
