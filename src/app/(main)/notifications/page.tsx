"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, X } from "lucide-react";
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

const PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<"all" | "specific">("all");
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState(false);

  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/notifications", {
        params: { page, limit: PAGE_SIZE },
      });
      setNotifications(data.data.notifications);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const searchPlayers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await api.get("/admin/players", {
        params: { search: query, limit: 20 },
      });
      setSearchResults(data.data.players);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handlePlayerSearchChange = (value: string) => {
    setPlayerSearch(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchPlayers(value);
    }, 400);
  };

  const addPlayer = (player: Player) => {
    if (!selectedPlayers.some((p) => p._id === player._id)) {
      setSelectedPlayers((prev) => [...prev, player]);
    }
    setPlayerSearch("");
    setSearchResults([]);
  };

  const removePlayer = (id: string) => {
    setSelectedPlayers((prev) => prev.filter((p) => p._id !== id));
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    if (recipientMode === "specific" && selectedPlayers.length === 0) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
      };
      if (recipientMode === "specific") {
        payload.userIds = selectedPlayers.map((p) => p._id);
      }
      await api.post("/admin/notifications/send", payload);
      setShowSendDialog(false);
      setTitle("");
      setBody("");
      setRecipientMode("all");
      setSelectedPlayers([]);
      setPlayerSearch("");
      setSearchResults([]);
      if (page !== 1) {
        setPage(1); // page-change effect will trigger fetch
      } else {
        fetchNotifications();
      }
    } catch {
      /* handled by interceptor */
    } finally {
      setSending(false);
    }
  };

  const typeBadge = (type: string) => {
    if (type === "contact_response")
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 hover:bg-red-500/15">
          Contact Response
        </Badge>
      );
    if (type === "targeted")
      return (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/15">
          Targeted
        </Badge>
      );
    return (
      <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30 hover:bg-violet-500/15">
        Broadcast
      </Badge>
    );
  };

  const columns: Column<Notification>[] = [
    {
      key: "title",
      label: "Title",
      render: (n) => <span className="font-medium">{n.title}</span>,
    },
    {
      key: "body",
      label: "Body",
      render: (n) => (
        <span className="text-sm text-muted-foreground truncate max-w-[260px] block">
          {n.body}
        </span>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (n) => typeBadge(n.type),
    },
    {
      key: "recipientCount",
      label: "Recipients",
      render: (n) => <span className="tabular-nums">{n.recipientCount}</span>,
    },
    {
      key: "sentBy",
      label: "Sent By",
      render: (n) => (
        <span className="text-sm">{n.sentBy?.username || "System"}</span>
      ),
    },
    {
      key: "sentAt",
      label: "Date",
      render: (n) =>
        new Date(n.sentAt).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
  ];

  const filteredResults = searchResults.filter(
    (r) => !selectedPlayers.some((s) => s._id === r._id),
  );

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Send broadcast or targeted push notifications."
        actions={
          <Button onClick={() => setShowSendDialog(true)}>
            <Send size={14} className="mr-1.5" />
            Send Notification
          </Button>
        }
      />
      {error ? (
        <ErrorState
          title="Failed to load notifications"
          onRetry={fetchNotifications}
        />
      ) : (
        <DataTable
          columns={columns}
          data={notifications}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          emptyMessage="No notifications sent yet"
        />
      )}

      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Body</label>
              <Textarea
                placeholder="Notification body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
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
                <label className="text-sm font-medium mb-1.5 block">
                  Search Players
                  <span className="ml-1 text-muted-foreground font-normal">
                    ({selectedPlayers.length} selected)
                  </span>
                </label>

                {selectedPlayers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedPlayers.map((p) => (
                      <span
                        key={p._id}
                        className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-md"
                      >
                        {p.name}
                        <button
                          type="button"
                          onClick={() => removePlayer(p._id)}
                          className="hover:text-destructive ml-0.5"
                          aria-label={`Remove ${p.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <Input
                    placeholder="Type a player name…"
                    value={playerSearch}
                    onChange={(e) => handlePlayerSearchChange(e.target.value)}
                  />

                  {playerSearch.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          Searching…
                        </p>
                      ) : filteredResults.length > 0 ? (
                        filteredResults.map((player) => (
                          <button
                            key={player._id}
                            type="button"
                            onClick={() => addPlayer(player)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                          >
                            {player.name}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          No players found
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                sending ||
                !title.trim() ||
                !body.trim() ||
                (recipientMode === "specific" && selectedPlayers.length === 0)
              }
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
