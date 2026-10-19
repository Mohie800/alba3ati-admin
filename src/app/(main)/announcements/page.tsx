"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import DataTable, { Column } from "@/components/DataTable";
import {
  FilterBar,
  FilterSearch,
  FilterSelect,
} from "@/components/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useListParams, toQuery, useLatest } from "@/lib/useListParams";
import api from "@/lib/api";

interface Announcement {
  _id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  buttonText: string | null;
  buttonAction: { type: "url" | "screen" | null; value: string | null } | null;
  frequency: "once" | "every_open";
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  priority: number;
  createdAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";
const PAGE_SIZE = 20;

// Must match ANNOUNCEMENT_SCREENS in the app
const SCREENS = [
  { value: "shop", label: "Shop" },
  { value: "earn-coins", label: "Earn coins" },
  { value: "leaderboard", label: "Leaderboard" },
  { value: "friends", label: "Friends" },
  { value: "profile", label: "Profile (invite friends)" },
  { value: "settings", label: "Settings" },
  { value: "public-rooms", label: "Public rooms" },
  { value: "notifications", label: "Notifications" },
];

type Draft = {
  title: string;
  body: string;
  buttonText: string;
  actionType: "none" | "url" | "screen";
  actionValue: string;
  frequency: "once" | "every_open";
  isActive: boolean;
  startsAt: string;
  endsAt: string;
  priority: string;
};

const EMPTY: Draft = {
  title: "",
  body: "",
  buttonText: "",
  actionType: "none",
  actionValue: "",
  frequency: "once",
  isActive: true,
  startsAt: "",
  endsAt: "",
  priority: "0",
};

// datetime-local <-> ISO, in the admin's local time
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

function liveState(a: Announcement): "live" | "scheduled" | "ended" | "inactive" {
  const now = Date.now();
  if (!a.isActive) return "inactive";
  if (a.endsAt && new Date(a.endsAt).getTime() <= now) return "ended";
  if (a.startsAt && new Date(a.startsAt).getTime() > now) return "scheduled";
  return "live";
}

export default function AnnouncementsPage() {
  const { params, set, reset, activeCount, ready } = useListParams({
    page: "1",
    search: "",
    status: "all",
  });
  const latest = useLatest();
  const [rows, setRows] = useState<Announcement[]>([]);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const fetchRows = useCallback(async () => {
    if (!ready) return;
    const isLatest = latest();
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/announcements", {
        params: { ...toQuery(params), limit: PAGE_SIZE },
      });
      if (!isLatest()) return;
      setRows(data.data.announcements);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      if (isLatest()) setError(true);
    } finally {
      if (isLatest()) setLoading(false);
    }
  }, [params, ready, latest]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditing(null);
    setDraft(EMPTY);
    setImageFile(null);
    setRemoveImage(false);
    setShowDialog(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setDraft({
      title: a.title,
      body: a.body || "",
      buttonText: a.buttonText || "",
      actionType: a.buttonAction?.type || "none",
      actionValue: a.buttonAction?.value || "",
      frequency: a.frequency,
      isActive: a.isActive,
      startsAt: toLocalInput(a.startsAt),
      endsAt: toLocalInput(a.endsAt),
      priority: String(a.priority ?? 0),
    });
    setImageFile(null);
    setRemoveImage(false);
    setShowDialog(true);
  };

  const hasButton = draft.actionType !== "none";
  const formError = !draft.title.trim()
    ? "Title is required"
    : hasButton && !draft.buttonText.trim()
      ? "Button text is required"
      : hasButton && !draft.actionValue.trim()
        ? draft.actionType === "url"
          ? "Link is required"
          : "Pick a screen"
        : draft.startsAt && draft.endsAt && draft.endsAt <= draft.startsAt
          ? "End must be after start"
          : null;

  const handleSave = async () => {
    if (formError) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append("title", draft.title.trim());
      form.append("body", draft.body.trim());
      form.append("buttonText", hasButton ? draft.buttonText.trim() : "");
      form.append("buttonActionType", hasButton ? draft.actionType : "");
      form.append("buttonActionValue", hasButton ? draft.actionValue.trim() : "");
      form.append("frequency", draft.frequency);
      form.append("isActive", String(draft.isActive));
      form.append("priority", draft.priority || "0");
      form.append("startsAt", draft.startsAt ? new Date(draft.startsAt).toISOString() : "");
      form.append("endsAt", draft.endsAt ? new Date(draft.endsAt).toISOString() : "");
      if (imageFile) form.append("image", imageFile);
      if (removeImage) form.append("removeImage", "true");
      const headers = { "Content-Type": "multipart/form-data" };
      if (editing) {
        await api.put(`/admin/announcements/${editing._id}`, form, { headers });
      } else {
        await api.post("/admin/announcements", form, { headers });
      }
      setShowDialog(false);
      fetchRows();
    } catch {
      /* toast from interceptor */
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    const form = new FormData();
    form.append("isActive", String(!a.isActive));
    try {
      await api.put(`/admin/announcements/${a._id}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchRows();
    } catch {
      /* toast from interceptor */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/announcements/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchRows();
    } catch {
      /* toast from interceptor */
    }
  };

  const stateBadge = (a: Announcement) => {
    const st = liveState(a);
    if (st === "live")
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15">
          Live
        </Badge>
      );
    if (st === "scheduled")
      return (
        <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:bg-sky-500/15">
          Starts {fmt(a.startsAt!)}
        </Badge>
      );
    if (st === "ended") return <Badge variant="secondary">Ended</Badge>;
    return <Badge variant="outline">Off</Badge>;
  };

  const columns: Column<Announcement>[] = [
    {
      key: "imageUrl",
      label: "",
      className: "w-20",
      render: (a) =>
        a.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${API_BASE_URL}${a.imageUrl}`}
            alt=""
            className="w-16 h-10 object-cover rounded border"
          />
        ) : (
          <div className="w-16 h-10 rounded border bg-muted" />
        ),
    },
    {
      key: "title",
      label: "Announcement",
      render: (a) => (
        <div className="min-w-0" dir="auto">
          <div className="font-medium truncate max-w-[320px]">{a.title}</div>
          {a.body && (
            <div className="text-xs text-muted-foreground truncate max-w-[320px]">
              {a.body}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "frequency",
      label: "Shows",
      render: (a) =>
        a.frequency === "once" ? (
          <Badge variant="outline">Once per device</Badge>
        ) : (
          <Badge variant="secondary">Every app open</Badge>
        ),
    },
    {
      key: "button",
      label: "Button",
      render: (a) =>
        a.buttonText && a.buttonAction?.type ? (
          <span className="text-sm" dir="auto">
            {a.buttonText}{" "}
            <span className="text-muted-foreground text-xs">
              →{" "}
              {a.buttonAction.type === "screen"
                ? SCREENS.find((s) => s.value === a.buttonAction?.value)?.label ??
                  a.buttonAction.value
                : "link"}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    { key: "status", label: "Status", render: stateBadge },
    {
      key: "endsAt",
      label: "Ends",
      render: (a) => (
        <span className="text-sm text-muted-foreground">
          {a.endsAt ? fmt(a.endsAt) : "No end"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "text-right",
      render: (a) => (
        <div
          className="flex gap-1.5 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Button size="sm" variant="outline" onClick={() => toggleActive(a)}>
            {a.isActive ? "Turn off" : "Turn on"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(a)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {node}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );

  const filePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(
    () => () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    },
    [filePreview],
  );
  const previewImage =
    filePreview ??
    (!removeImage && editing?.imageUrl ? `${API_BASE_URL}${editing.imageUrl}` : null);

  return (
    <>
      <PageHeader
        title="Announcements"
        description="Pop-ups shown on the home screen when players open the app."
        actions={
          <Button onClick={openCreate}>
            <Plus size={14} className="mr-1.5" />
            New announcement
          </Button>
        }
      />
      <FilterBar activeCount={activeCount} onClear={reset}>
        <FilterSearch
          value={params.search}
          onChange={(search) => set({ search })}
          placeholder="Title or text…"
        />
        <FilterSelect
          label="Status"
          value={params.status}
          onChange={(status) => set({ status })}
          options={[
            { value: "all", label: "All" },
            { value: "live", label: "Live now" },
            { value: "scheduled", label: "Scheduled" },
            { value: "ended", label: "Ended" },
            { value: "inactive", label: "Turned off" },
          ]}
        />
      </FilterBar>
      {error ? (
        <ErrorState title="Failed to load announcements" onRetry={fetchRows} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          page={Number(params.page)}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={(p) => set({ page: String(p) })}
          onRowClick={openEdit}
          emptyMessage={
            activeCount
              ? "No announcements match these filters"
              : "No announcements yet — click New announcement"
          }
          minWidth={900}
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit announcement" : "New announcement"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 md:grid-cols-[1fr_260px] py-2">
            <div className="space-y-4">
              {field(
                "Title",
                <Input
                  dir="auto"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="مثال: دور جديد في المتجر!"
                />,
              )}
              {field(
                "Text",
                <Textarea
                  dir="auto"
                  rows={4}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />,
              )}
              {field(
                "Image (optional)",
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      setImageFile(e.target.files?.[0] || null);
                      setRemoveImage(false);
                    }}
                  />
                  {(imageFile || (editing?.imageUrl && !removeImage)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageFile(null);
                        setRemoveImage(true);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>,
                "Wide images work best (about 16:9, e.g. 1200×675).",
              )}
              <div className="grid grid-cols-2 gap-3">
                {field(
                  "Button",
                  <Select
                    value={draft.actionType}
                    onValueChange={(v) =>
                      setDraft({
                        ...draft,
                        actionType: v as Draft["actionType"],
                        actionValue: "",
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No button</SelectItem>
                      <SelectItem value="url">Open a link</SelectItem>
                      <SelectItem value="screen">Open an app screen</SelectItem>
                    </SelectContent>
                  </Select>,
                )}
                {hasButton &&
                  field(
                    "Button text",
                    <Input
                      dir="auto"
                      value={draft.buttonText}
                      onChange={(e) =>
                        setDraft({ ...draft, buttonText: e.target.value })
                      }
                      placeholder="اذهب للمتجر"
                    />,
                  )}
              </div>
              {draft.actionType === "url" &&
                field(
                  "Link",
                  <Input
                    value={draft.actionValue}
                    onChange={(e) =>
                      setDraft({ ...draft, actionValue: e.target.value })
                    }
                    placeholder="https://chat.whatsapp.com/…"
                  />,
                )}
              {draft.actionType === "screen" &&
                field(
                  "Screen",
                  <Select
                    value={draft.actionValue}
                    onValueChange={(v) => setDraft({ ...draft, actionValue: v })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pick a screen" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCREENS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>,
                )}
              <div className="grid grid-cols-2 gap-3">
                {field(
                  "Show",
                  <Select
                    value={draft.frequency}
                    onValueChange={(v) =>
                      setDraft({ ...draft, frequency: v as Draft["frequency"] })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once per device</SelectItem>
                      <SelectItem value="every_open">Every app open</SelectItem>
                    </SelectContent>
                  </Select>,
                )}
                {field(
                  "Order",
                  <Input
                    type="number"
                    value={draft.priority}
                    onChange={(e) => setDraft({ ...draft, priority: e.target.value })}
                  />,
                  "Higher shows first",
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field(
                  "Starts (optional)",
                  <Input
                    type="datetime-local"
                    value={draft.startsAt}
                    onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
                  />,
                  "Empty = immediately",
                )}
                {field(
                  "Ends (optional)",
                  <Input
                    type="datetime-local"
                    value={draft.endsAt}
                    onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
                  />,
                  "Empty = until turned off",
                )}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

            {/* Phone-style preview of the in-app modal */}
            <div>
              <p className="text-sm font-medium mb-1.5">Preview</p>
              <div className="rounded-2xl bg-[#1E1B3A] p-3">
                <div className="rounded-xl overflow-hidden bg-[#2A2650] border border-[#8B7355]">
                  {previewImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewImage} alt="" className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-4 text-center" dir="rtl">
                    <p className="font-bold text-[#E8D5B7]">
                      {draft.title || "العنوان"}
                    </p>
                    {draft.body && (
                      <p className="text-sm text-gray-300 mt-1 whitespace-pre-line">
                        {draft.body}
                      </p>
                    )}
                    <div className="mt-4 rounded-lg bg-[#C65D3B] text-white text-sm font-bold py-2">
                      {hasButton ? draft.buttonText || "زر" : "حسناً"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="items-center">
            {formError && (
              <span className="text-sm text-muted-foreground mr-auto">{formError}</span>
            )}
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !!formError}>
              {saving ? "Saving…" : editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete announcement</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong dir="auto">&quot;{deleteTarget?.title}&quot;</strong>?
            Players who haven&apos;t seen it yet won&apos;t get it.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
