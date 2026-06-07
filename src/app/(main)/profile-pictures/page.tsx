"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ChangeEvent,
} from "react";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Plus,
  Coins,
  Pencil,
  Trash2,
  Inbox,
  Search,
  Eye,
  EyeOff,
  CircleUserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ProfilePictureItem {
  _id: string;
  itemId: string;
  type: "frame" | "nameColor" | "profilePicture";
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  rarity: "common" | "rare" | "legendary";
  imageUrl: string | null;
  createdAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";

const RARITY_FILTERS = [
  { value: "all", label: "All Rarities" },
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "legendary", label: "Legendary" },
] as const;

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

const SORT_OPTIONS = [
  { value: "sortOrder", label: "Sort order" },
  { value: "price-desc", label: "Price (high → low)" },
  { value: "price-asc", label: "Price (low → high)" },
  { value: "created", label: "Recently added" },
  { value: "name", label: "Name" },
] as const;

const RARITY_STYLES: Record<
  ProfilePictureItem["rarity"],
  { badge: string; border: string; glow: string; label: string }
> = {
  common: {
    badge:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
    border: "border-border",
    glow: "",
    label: "Common",
  },
  rare: {
    badge:
      "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    border: "border-violet-500/30",
    glow: "shadow-[0_0_30px_-15px_rgb(139,92,246)]",
    label: "Rare",
  },
  legendary: {
    badge:
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_30px_-12px_rgb(245,158,11)]",
    label: "Legendary",
  },
};

function imageSrc(imageUrl: string | null): string | null {
  return imageUrl ? `${API_BASE_URL}${imageUrl}` : null;
}

// ---------- Card ----------

interface PictureCardProps {
  item: ProfilePictureItem;
  onToggle: (item: ProfilePictureItem) => void;
  onEdit: (item: ProfilePictureItem) => void;
  onDelete: (item: ProfilePictureItem) => void;
}

function PictureCard({ item, onToggle, onEdit, onDelete }: PictureCardProps) {
  const rarity = RARITY_STYLES[item.rarity] || RARITY_STYLES.common;
  const src = imageSrc(item.imageUrl);
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md",
        rarity.border,
        item.isActive ? rarity.glow : "opacity-70",
      )}
    >
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        <button
          onClick={() => onToggle(item)}
          title={item.isActive ? "Deactivate" : "Activate"}
          aria-label={item.isActive ? "Deactivate" : "Activate"}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            item.isActive
              ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          {item.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      <div className="flex flex-col items-center pb-3 pt-2">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={item.name || item.itemId}
            className="w-20 h-20 rounded-full object-cover border bg-muted"
          />
        ) : (
          <div className="w-20 h-20 rounded-full border bg-muted flex items-center justify-center text-muted-foreground">
            <CircleUserRound size={32} />
          </div>
        )}
        <p
          dir="rtl"
          className="mt-3 font-semibold text-base text-center min-h-[1.5rem]"
        >
          {item.name || <span className="text-muted-foreground italic">—</span>}
        </p>
        <code className="text-[10px] text-muted-foreground font-mono mt-0.5">
          {item.itemId}
        </code>
      </div>

      <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3">
        <Badge
          variant="outline"
          className={cn("text-[10px] font-semibold", rarity.badge)}
        >
          {rarity.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <Coins size={14} />
          <span className="font-semibold tabular-nums">
            {item.price.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground tabular-nums mr-1">
            #{item.sortOrder}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onEdit(item)}
            title="Edit"
            aria-label="Edit"
          >
            <Pencil size={13} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(item)}
            title="Delete"
            aria-label="Delete"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function ProfilePicturesPage() {
  const [items, setItems] = useState<ProfilePictureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("sortOrder");

  // Add/Edit dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<ProfilePictureItem | null>(null);
  const [formItemId, setFormItemId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");
  const [formRarity, setFormRarity] =
    useState<ProfilePictureItem["rarity"]>("common");
  const [formIsActive, setFormIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteItem, setDeleteItem] = useState<ProfilePictureItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/shop-items");
      const all: ProfilePictureItem[] = data.data.items;
      setItems(all.filter((i) => i.type === "profilePicture"));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Revoke object URLs when they change / on unmount to avoid leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Filtered + sorted list
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => {
      if (rarityFilter !== "all" && i.rarity !== rarityFilter) return false;
      if (statusFilter === "active" && !i.isActive) return false;
      if (statusFilter === "inactive" && i.isActive) return false;
      if (
        q &&
        !i.name.toLowerCase().includes(q) &&
        !i.itemId.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "price-desc":
          return b.price - a.price;
        case "price-asc":
          return a.price - b.price;
        case "created":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "sortOrder":
        default:
          return a.sortOrder - b.sortOrder;
      }
    });
    return list;
  }, [items, rarityFilter, statusFilter, search, sortBy]);

  const counts = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.isActive).length,
      inactive: items.filter((i) => !i.isActive).length,
    };
  }, [items]);

  const setPickedFile = (file: File | null) => {
    setImageFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPickedFile(e.target.files?.[0] || null);
  };

  const openAddDialog = () => {
    setEditItem(null);
    setFormItemId("");
    setFormName("");
    setFormPrice("");
    setFormSortOrder(String(items.length));
    setFormRarity("common");
    setFormIsActive(true);
    setPickedFile(null);
    setShowDialog(true);
  };

  const openEditDialog = (item: ProfilePictureItem) => {
    setEditItem(item);
    setFormItemId(item.itemId);
    setFormName(item.name);
    setFormPrice(String(item.price));
    setFormSortOrder(String(item.sortOrder));
    setFormRarity(item.rarity || "common");
    setFormIsActive(item.isActive);
    setPickedFile(null);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formItemId.trim() || !formName.trim()) return;
    if (!editItem && !imageFile) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("type", "profilePicture");
      formData.append("name", formName.trim());
      formData.append("price", String(Number(formPrice) || 0));
      formData.append("sortOrder", String(Number(formSortOrder) || 0));
      formData.append("rarity", formRarity);
      formData.append("isActive", String(formIsActive));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editItem) {
        await api.put(`/admin/shop-items/${editItem._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        formData.append("itemId", formItemId.trim());
        await api.post("/admin/shop-items", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setShowDialog(false);
      fetchItems();
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: ProfilePictureItem) => {
    try {
      const formData = new FormData();
      formData.append("isActive", String(!item.isActive));
      await api.put(`/admin/shop-items/${item._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Optimistic update — no full refetch flicker
      setItems((prev) =>
        prev.map((i) =>
          i._id === item._id ? { ...i, isActive: !i.isActive } : i,
        ),
      );
    } catch {
      /* handled by interceptor */
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/shop-items/${deleteItem._id}`);
      setItems((prev) => prev.filter((i) => i._id !== deleteItem._id));
      setDeleteItem(null);
    } catch {
      /* handled by interceptor */
    } finally {
      setDeleting(false);
    }
  };

  const currentImageSrc = editItem ? imageSrc(editItem.imageUrl) : null;

  return (
    <>
      <PageHeader
        title="Profile Pictures"
        description={
          counts.total > 0
            ? `${counts.total} picture${counts.total === 1 ? "" : "s"} · ${counts.active} active`
            : "Purchasable profile pictures for the in-app shop."
        }
        actions={
          <Button onClick={openAddDialog}>
            <Plus size={14} className="mr-1.5" />
            Add Picture
          </Button>
        }
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative w-full lg:w-72">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              placeholder="Search by name or item ID…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 lg:flex lg:items-center gap-2">
            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="h-9 w-full lg:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RARITY_FILTERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full lg:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 w-full lg:w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState
          title="Failed to load profile pictures"
          onRetry={fetchItems}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex justify-center">
                <Skeleton className="h-20 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto" />
              <div className="flex justify-between pt-3 border-t">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card/50 py-16 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Inbox size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">
            {items.length === 0
              ? "No profile pictures yet"
              : "No pictures match these filters"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            {items.length === 0
              ? "Upload your first profile picture to populate the in-app shop."
              : "Try clearing filters or changing the search."}
          </p>
          {items.length === 0 ? (
            <Button onClick={openAddDialog} size="sm">
              <Plus size={14} className="mr-1.5" />
              Add Picture
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setRarityFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleItems.map((item) => (
            <PictureCard
              key={item._id}
              item={item}
              onToggle={handleToggleActive}
              onEdit={openEditDialog}
              onDelete={setDeleteItem}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editItem ? `Edit · ${editItem.name}` : "Add Picture"}
            </DialogTitle>
          </DialogHeader>

          {/* Image upload + live preview */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Image{" "}
              {editItem ? (
                <span className="text-muted-foreground font-normal">
                  (leave empty to keep current)
                </span>
              ) : (
                <span className="text-destructive">*</span>
              )}
            </label>
            <div className="rounded-xl border bg-gradient-to-br from-muted/30 to-muted/10 p-5 flex items-center justify-center mb-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border bg-muted"
                />
              ) : currentImageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentImageSrc}
                  alt="Current"
                  className="w-24 h-24 rounded-full object-cover border bg-muted"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border bg-muted flex items-center justify-center text-muted-foreground">
                  <CircleUserRound size={40} />
                </div>
              )}
            </div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Item ID */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Item ID</label>
              <Input
                placeholder="e.g. pic_galaxy, pic_cat"
                value={formItemId}
                onChange={(e) => setFormItemId(e.target.value)}
                disabled={!!editItem}
                className="font-mono text-sm"
              />
              {editItem && (
                <p className="text-xs text-muted-foreground mt-1">
                  Item ID is immutable.
                </p>
              )}
            </div>

            {/* Name */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">
                Name (Arabic)
              </label>
              <Input
                placeholder="اسم الصورة"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                dir="rtl"
              />
            </div>

            {/* Rarity */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Rarity</label>
              <Select
                value={formRarity}
                onValueChange={(v) =>
                  setFormRarity(v as ProfilePictureItem["rarity"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Status</label>
              <label className="flex items-center gap-2 h-9 px-3 rounded-md border bg-transparent cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border cursor-pointer accent-primary"
                />
                <span>{formIsActive ? "Active" : "Inactive"}</span>
              </label>
            </div>

            {/* Price */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Price (coins)
              </label>
              <div className="relative">
                <Coins
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Sort order */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Sort Order
              </label>
              <Input
                type="number"
                value={formSortOrder}
                onChange={(e) => setFormSortOrder(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                !formItemId.trim() ||
                !formName.trim() ||
                (!editItem && !imageFile)
              }
            >
              {saving ? "Saving…" : editItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{deleteItem?.name}&quot;?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently removes the picture from the shop. Players who
            already own it keep it, but no one new can purchase. This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
