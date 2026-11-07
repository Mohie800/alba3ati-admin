"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
  FilterDateRange,
} from "@/components/FilterBar";
import { useListParams, toQuery, useLatest } from "@/lib/useListParams";
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

interface Audience {
  activity?: "never" | "played";
  minGames?: number;
  maxGames?: number;
  authProvider?: "guest" | "google";
  referred?: "yes" | "no";
  joinedFrom?: string;
  joinedTo?: string;
}

interface Notification {
  _id: string;
  title: string;
  body: string;
  type: "broadcast" | "targeted" | "segment" | "contact_response";
  recipientCount: number;
  audience?: Audience | null;
  sentBy: { username: string } | null;
  sentAt: string;
}

interface Player {
  _id: string;
  name: string;
}

const PAGE_SIZE = 20;

type RecipientMode = "all" | "segment" | "specific";

const EMPTY_SEGMENT = {
  activity: "any",
  minGames: "",
  maxGames: "",
  authProvider: "any",
  referred: "any",
  joinedFrom: "",
  joinedTo: "",
};

type SegmentForm = typeof EMPTY_SEGMENT;

function toAudience(f: SegmentForm): Audience {
  const a: Audience = {};
  if (f.activity === "never" || f.activity === "played") a.activity = f.activity;
  if (f.activity !== "never") {
    if (f.minGames !== "") a.minGames = Number(f.minGames);
    if (f.maxGames !== "") a.maxGames = Number(f.maxGames);
  }
  if (f.authProvider === "guest" || f.authProvider === "google")
    a.authProvider = f.authProvider;
  if (f.referred === "yes" || f.referred === "no") a.referred = f.referred;
  if (f.joinedFrom) a.joinedFrom = f.joinedFrom;
  if (f.joinedTo) a.joinedTo = f.joinedTo;
  return a;
}

function describeAudience(a: Audience): string {
  const parts: string[] = [];
  if (a.activity === "never") parts.push("Never played");
  if (a.activity === "played") parts.push("Played");
  if (a.minGames != null && a.maxGames != null)
    parts.push(`${a.minGames}–${a.maxGames} games`);
  else if (a.minGames != null) parts.push(`≥${a.minGames} games`);
  else if (a.maxGames != null) parts.push(`≤${a.maxGames} games`);
  if (a.authProvider) parts.push(a.authProvider === "google" ? "Google" : "Guest");
  if (a.referred) parts.push(a.referred === "yes" ? "Referred" : "Not referred");
  if (a.joinedFrom && a.joinedTo) parts.push(`Joined ${a.joinedFrom} → ${a.joinedTo}`);
  else if (a.joinedFrom) parts.push(`Joined since ${a.joinedFrom}`);
  else if (a.joinedTo) parts.push(`Joined until ${a.joinedTo}`);
  return parts.join(" · ");
}

export default function NotificationsPage() {
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    type: "all",
    from: "",
    to: "",
  });
  const latest = useLatest();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recipientMode, setRecipientMode] = useState<RecipientMode>("all");
  const [segment, setSegment] = useState<SegmentForm>(EMPTY_SEGMENT);
  const [reach, setReach] = useState<{ total: number; reachable: number } | null>(null);
  const [reachLoading, setReachLoading] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState(false);

  const [playerSearch, setPlayerSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/notifications", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setNotifications(data.data.notifications);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const audience = toAudience(segment);
  const audienceKey = JSON.stringify(audience);
  const segmentEmpty = audienceKey === "{}";
  const updateSegment = (patch: Partial<SegmentForm>) =>
    setSegment((prev) => ({ ...prev, ...patch }));

  // Live reach preview for broadcast / segment sends
  useEffect(() => {
    if (!showSendDialog || recipientMode === "specific") return;
    if (recipientMode === "segment" && segmentEmpty) {
      setReach(null);
      return;
    }
    let cancelled = false;
    setReachLoading(true);
    const t = setTimeout(async () => {
      try {
        const { data } = await api.post("/admin/notifications/audience-count", {
          audience: recipientMode === "segment" ? JSON.parse(audienceKey) : undefined,
        });
        if (!cancelled) setReach(data.data);
      } catch {
        if (!cancelled) setReach(null);
      } finally {
        if (!cancelled) setReachLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [showSendDialog, recipientMode, audienceKey, segmentEmpty]);

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
    if (recipientMode === "segment" && segmentEmpty) return;
    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
      };
      if (recipientMode === "specific") {
        payload.userIds = selectedPlayers.map((p) => p._id);
      } else if (recipientMode === "segment") {
        payload.audience = audience;
      }
      await api.post("/admin/notifications/send", payload);
      setShowSendDialog(false);
      setTitle("");
      setBody("");
      setRecipientMode("all");
      setSegment(EMPTY_SEGMENT);
      setReach(null);
      setSelectedPlayers([]);
      setPlayerSearch("");
      setSearchResults([]);
      if (params.page !== "1" || activeCount > 0) {
        reset(); // params change triggers the fetch
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
    if (type === "segment")
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/15">
          Segment
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
      render: (n) =>
        n.type === "segment" && n.audience ? (
          <div className="space-y-1">
            {typeBadge(n.type)}
            <span className="text-xs text-muted-foreground block max-w-[220px]">
              {describeAudience(n.audience)}
            </span>
          </div>
        ) : (
          typeBadge(n.type)
        ),
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
        description="Send push notifications to everyone, a player segment, or specific players."
        actions={
          <Button onClick={() => setShowSendDialog(true)}>
            <Send size={14} className="mr-1.5" />
            Send Notification
          </Button>
        }
      />
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Title or message…"
        />
        <FilterSelect
          label="Type"
          value={params.type}
          onChange={(type) => set({ type })}
          options={[
            { value: "all", label: "All" },
            { value: "broadcast", label: "Broadcast" },
            { value: "targeted", label: "Targeted" },
            { value: "segment", label: "Segment" },
            { value: "contact_response", label: "Contact reply" },
          ]}
        />
        <FilterDateRange
          label="Sent"
          from={params.from}
          to={params.to}
          onChange={(r) => set(r)}
        />
      </FilterBar>
      {error ? (
        <ErrorState
          title="Failed to load notifications"
          onRetry={fetchNotifications}
        />
      ) : (
        <DataTable
          columns={columns}
          data={notifications}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          emptyMessage={
            activeCount
              ? "No notifications match these filters"
              : "No notifications sent yet"
          }
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
                onValueChange={(v) => setRecipientMode(v as RecipientMode)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="segment">Segment (filter players)</SelectItem>
                  <SelectItem value="specific">Specific Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {recipientMode === "segment" && (
              <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Games played</label>
                  <Select
                    value={segment.activity}
                    onValueChange={(activity) => updateSegment({ activity })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="never">Never played a game</SelectItem>
                      <SelectItem value="played">Played at least one game</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {segment.activity !== "never" && (
                  <>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Min games</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Any"
                        value={segment.minGames}
                        onChange={(e) => updateSegment({ minGames: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Max games</label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Any"
                        value={segment.maxGames}
                        onChange={(e) => updateSegment({ maxGames: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs font-medium mb-1 block">Account</label>
                  <Select
                    value={segment.authProvider}
                    onValueChange={(authProvider) => updateSegment({ authProvider })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Referred</label>
                  <Select
                    value={segment.referred}
                    onValueChange={(referred) => updateSegment({ referred })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="yes">Joined via referral</SelectItem>
                      <SelectItem value="no">Not referred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Joined from</label>
                  <Input
                    type="date"
                    value={segment.joinedFrom}
                    onChange={(e) => updateSegment({ joinedFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Joined to</label>
                  <Input
                    type="date"
                    value={segment.joinedTo}
                    onChange={(e) => updateSegment({ joinedTo: e.target.value })}
                  />
                </div>
              </div>
            )}
            {recipientMode !== "specific" && (
              <p className="text-xs text-muted-foreground">
                {recipientMode === "segment" && segmentEmpty
                  ? "Pick at least one filter."
                  : reachLoading || !reach
                    ? "Counting recipients…"
                    : `Will reach ${reach.reachable.toLocaleString("en-US")} players with push enabled (of ${reach.total.toLocaleString("en-US")} matching).`}
              </p>
            )}
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
                (recipientMode === "specific" && selectedPlayers.length === 0) ||
                (recipientMode === "segment" && segmentEmpty)
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
