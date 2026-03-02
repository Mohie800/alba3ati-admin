"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState(false);

  // Player search state
  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(false);
      const { data } = await api.get("/admin/notifications", {
        params: { page, limit: 20 },
      });
      setNotifications(data.data.notifications);
      setPages(data.data.pages);
    } catch {
      setError(true);
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

  const handleOpenSendDialog = () => {
    setShowSendDialog(true);
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
      fetchNotifications();
    } catch {
      /* handled by interceptor */
    } finally {
      setSending(false);
    }
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

  // Filter out already-selected players from search results
  const filteredResults = searchResults.filter(
    (r) => !selectedPlayers.some((s) => s._id === r._id)
  );

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>
            <Button onClick={handleOpenSendDialog}>Send Notification</Button>
          </div>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load notifications</p>
              <Button variant="outline" onClick={fetchNotifications}>Retry</Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={notifications}
              page={page}
              pages={pages}
              onPageChange={setPage}
            />
          )}
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
                  Search Players ({selectedPlayers.length} selected)
                </label>

                {/* Selected players as tags */}
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
                          className="hover:text-destructive font-bold ml-0.5"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <Input
                    placeholder="Type a player name..."
                    value={playerSearch}
                    onChange={(e) => handlePlayerSearchChange(e.target.value)}
                  />

                  {/* Dropdown results */}
                  {playerSearch.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
                      {searchLoading ? (
                        <p className="text-sm text-muted-foreground text-center py-3">
                          Searching...
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
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim() || (recipientMode === "specific" && selectedPlayers.length === 0)}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
