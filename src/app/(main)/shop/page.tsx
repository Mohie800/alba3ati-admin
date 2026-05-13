"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
  ImageIcon,
  Inbox,
  Search,
  Eye,
  EyeOff,
  Type,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface ShopItem {
  _id: string;
  itemId: string;
  type: "frame" | "nameColor";
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  rarity: "common" | "rare" | "legendary";
  frameType: "color" | "gradient" | "image";
  frameData: {
    color?: string;
    colors?: string[];
    borderWidth?: number;
  };
  createdAt: string;
}

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "frame", label: "Frames" },
  { value: "nameColor", label: "Name Colors" },
] as const;

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
  ShopItem["rarity"],
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

const SAMPLE_NAME = "محمد";

// ---------- Preview components ----------

function FramePreview({
  item,
  size = 80,
}: {
  item: Pick<ShopItem, "type" | "frameType" | "frameData" | "name" | "itemId">;
  size?: number;
}) {
  if (item.type === "nameColor") {
    const color = item.frameData?.color || "#888";
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900"
        style={{ width: size, height: size }}
      >
        <span
          dir="rtl"
          style={{ color }}
          className="font-bold text-base tracking-wide"
        >
          {SAMPLE_NAME}
        </span>
      </div>
    );
  }

  const borderWidth = item.frameData?.borderWidth ?? 3;
  const inner = size - borderWidth * 2;

  if (item.frameType === "color") {
    const color = item.frameData?.color || "#888";
    return (
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          border: `${borderWidth}px solid ${color}`,
        }}
      >
        <Avatar size={inner} />
      </div>
    );
  }

  if (item.frameType === "gradient") {
    const c1 = item.frameData?.colors?.[0] || "#888";
    const c2 = item.frameData?.colors?.[1] || "#CCC";
    return (
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: size,
          height: size,
          padding: borderWidth,
          background: `linear-gradient(135deg, ${c1}, ${c2})`,
        }}
      >
        <Avatar size={inner} />
      </div>
    );
  }

  // image
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Avatar size={size - 8} />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-amber-500 text-white px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide">
        <ImageIcon size={9} />
        IMG
      </div>
    </div>
  );
}

function Avatar({ size }: { size: number }) {
  return (
    <div
      className="rounded-full bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-inner"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      أ
    </div>
  );
}

// ---------- Card ----------

interface ShopCardProps {
  item: ShopItem;
  onToggle: (item: ShopItem) => void;
  onEdit: (item: ShopItem) => void;
  onDelete: (item: ShopItem) => void;
}

function ShopCard({ item, onToggle, onEdit, onDelete }: ShopCardProps) {
  const rarity = RARITY_STYLES[item.rarity] || RARITY_STYLES.common;
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
        <FramePreview item={item} size={80} />
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
        <Badge variant="outline" className="text-[10px] font-semibold">
          {item.type === "nameColor" ? (
            <>
              <Type size={10} className="mr-0.5" />
              Name Color
            </>
          ) : (
            <>
              <Sparkles size={10} className="mr-0.5" />
              {item.frameType === "image"
                ? "Image"
                : item.frameType === "gradient"
                  ? "Gradient"
                  : "Color"}
            </>
          )}
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

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [rarityFilter, setRarityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("sortOrder");

  // Add/Edit dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<ShopItem | null>(null);
  const [formItemId, setFormItemId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");
  const [formType, setFormType] = useState<"frame" | "nameColor">("frame");
  const [formRarity, setFormRarity] = useState<ShopItem["rarity"]>("common");
  const [formFrameType, setFormFrameType] =
    useState<ShopItem["frameType"]>("color");
  const [formColor, setFormColor] = useState("#E74C3C");
  const [formGradientColor1, setFormGradientColor1] = useState("#FF6B35");
  const [formGradientColor2, setFormGradientColor2] = useState("#F1C40F");
  const [formBorderWidth, setFormBorderWidth] = useState("3");
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteItem, setDeleteItem] = useState<ShopItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/shop-items");
      setItems(data.data.items);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtered + sorted list
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items.filter((i) => {
      if (typeFilter !== "all" && i.type !== typeFilter) return false;
      if (rarityFilter !== "all" && i.rarity !== rarityFilter) return false;
      if (statusFilter === "active" && !i.isActive) return false;
      if (statusFilter === "inactive" && i.isActive) return false;
      if (q && !i.name.toLowerCase().includes(q) && !i.itemId.toLowerCase().includes(q))
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
  }, [items, typeFilter, rarityFilter, statusFilter, search, sortBy]);

  // Counts for filter chips
  const counts = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.isActive).length,
      inactive: items.filter((i) => !i.isActive).length,
    };
  }, [items]);

  const handleTypeChange = (type: "frame" | "nameColor") => {
    setFormType(type);
    if (type === "nameColor") setFormFrameType("color");
  };

  const openAddDialog = () => {
    setEditItem(null);
    setFormItemId("");
    setFormName("");
    setFormPrice("");
    setFormSortOrder(String(items.length));
    setFormType("frame");
    setFormRarity("common");
    setFormFrameType("color");
    setFormColor("#E74C3C");
    setFormGradientColor1("#FF6B35");
    setFormGradientColor2("#F1C40F");
    setFormBorderWidth("3");
    setShowDialog(true);
  };

  const openEditDialog = (item: ShopItem) => {
    setEditItem(item);
    setFormItemId(item.itemId);
    setFormName(item.name);
    setFormPrice(String(item.price));
    setFormSortOrder(String(item.sortOrder));
    setFormType(item.type);
    setFormRarity(item.rarity || "common");
    setFormFrameType(item.frameType || "color");
    setFormColor(item.frameData?.color || "#E74C3C");
    setFormGradientColor1(item.frameData?.colors?.[0] || "#FF6B35");
    setFormGradientColor2(item.frameData?.colors?.[1] || "#F1C40F");
    setFormBorderWidth(String(item.frameData?.borderWidth ?? 3));
    setShowDialog(true);
  };

  const buildFrameData = () => {
    if (formType === "nameColor") return { color: formColor };
    if (formFrameType === "color")
      return { color: formColor, borderWidth: Number(formBorderWidth) };
    if (formFrameType === "gradient")
      return {
        colors: [formGradientColor1, formGradientColor2],
        borderWidth: Number(formBorderWidth),
      };
    return {};
  };

  const handleSave = async () => {
    if (!formItemId.trim() || !formName.trim()) return;
    setSaving(true);
    try {
      const frameData = buildFrameData();
      const payload = {
        type: formType,
        name: formName.trim(),
        price: Number(formPrice) || 0,
        sortOrder: Number(formSortOrder) || 0,
        rarity: formRarity,
        frameType: formFrameType,
        frameData,
      };
      if (editItem) {
        await api.put(`/admin/shop-items/${editItem._id}`, {
          ...payload,
          isActive: editItem.isActive,
        });
      } else {
        await api.post("/admin/shop-items", {
          itemId: formItemId.trim(),
          ...payload,
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

  const handleToggleActive = async (item: ShopItem) => {
    try {
      await api.put(`/admin/shop-items/${item._id}`, {
        isActive: !item.isActive,
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

  // Preview shop item used inside the dialog
  const previewItem: Pick<
    ShopItem,
    "type" | "frameType" | "frameData" | "name" | "itemId"
  > = {
    type: formType,
    frameType: formFrameType,
    name: formName || SAMPLE_NAME,
    itemId: formItemId || "preview",
    frameData:
      formType === "nameColor"
        ? { color: formColor }
        : formFrameType === "color"
          ? { color: formColor, borderWidth: Number(formBorderWidth) }
          : formFrameType === "gradient"
            ? {
                colors: [formGradientColor1, formGradientColor2],
                borderWidth: Number(formBorderWidth),
              }
            : {},
  };

  return (
    <>
      <PageHeader
        title="Shop Items"
        description={
          counts.total > 0
            ? `${counts.total} item${counts.total === 1 ? "" : "s"} · ${counts.active} active`
            : "Frames, name colors, and other cosmetics."
        }
        actions={
          <Button onClick={openAddDialog}>
            <Plus size={14} className="mr-1.5" />
            Add Item
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-full lg:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_FILTERS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        <ErrorState title="Failed to load shop items" onRetry={fetchItems} />
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
            {items.length === 0 ? "No shop items yet" : "No items match these filters"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            {items.length === 0
              ? "Create your first frame or name color to populate the in-app shop."
              : "Try clearing filters or changing the search."}
          </p>
          {items.length === 0 ? (
            <Button onClick={openAddDialog} size="sm">
              <Plus size={14} className="mr-1.5" />
              Add Item
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setTypeFilter("all");
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
            <ShopCard
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
              {editItem ? `Edit · ${editItem.name}` : "Add Item"}
            </DialogTitle>
          </DialogHeader>

          {/* Live preview */}
          <div className="rounded-xl border bg-gradient-to-br from-muted/30 to-muted/10 p-5 flex items-center justify-center mb-1">
            <FramePreview item={previewItem} size={100} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type</label>
              <Select
                value={formType}
                onValueChange={(v) =>
                  handleTypeChange(v as "frame" | "nameColor")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frame">Frame</SelectItem>
                  <SelectItem value="nameColor">Name Color</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rarity */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Rarity</label>
              <Select
                value={formRarity}
                onValueChange={(v) =>
                  setFormRarity(v as ShopItem["rarity"])
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

            {/* Frame type (frame only) */}
            {formType === "frame" && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">
                  Frame Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["color", "gradient", "image"] as const).map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setFormFrameType(ft)}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm border transition-colors capitalize",
                        formFrameType === ft
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      {ft}
                    </button>
                  ))}
                </div>
                {formFrameType === "image" && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Image asset is loaded by the mobile app using <code>itemId</code>.
                  </p>
                )}
              </div>
            )}

            {/* Item ID */}
            <div className="sm:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Item ID</label>
              <Input
                placeholder={
                  formType === "nameColor"
                    ? "e.g. crimson, royal_blue"
                    : formFrameType === "image"
                      ? "e.g. wreath, wings1 (must match an asset in the app)"
                      : "e.g. color_red, gradient_sunset"
                }
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
                placeholder="اسم العنصر"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                dir="rtl"
              />
            </div>

            {/* Color config */}
            {(formType === "nameColor" ||
              (formType === "frame" && formFrameType === "color")) && (
              <div className="sm:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">
                  {formType === "nameColor" ? "Text Color" : "Frame Color"}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer shrink-0"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="#FF0000"
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Gradient config */}
            {formType === "frame" && formFrameType === "gradient" && (
              <div className="sm:col-span-2 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      Start Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formGradientColor1}
                        onChange={(e) =>
                          setFormGradientColor1(e.target.value)
                        }
                        className="w-10 h-10 rounded border cursor-pointer shrink-0"
                      />
                      <Input
                        value={formGradientColor1}
                        onChange={(e) =>
                          setFormGradientColor1(e.target.value)
                        }
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      End Color
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formGradientColor2}
                        onChange={(e) =>
                          setFormGradientColor2(e.target.value)
                        }
                        className="w-10 h-10 rounded border cursor-pointer shrink-0"
                      />
                      <Input
                        value={formGradientColor2}
                        onChange={(e) =>
                          setFormGradientColor2(e.target.value)
                        }
                        className="flex-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Border width (frame only, not image) */}
            {formType === "frame" && formFrameType !== "image" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  Border Width
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={formBorderWidth}
                  onChange={(e) => setFormBorderWidth(e.target.value)}
                />
              </div>
            )}

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
              disabled={saving || !formItemId.trim() || !formName.trim()}
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
            This permanently removes the item from the shop. Players who already
            own it keep it, but no one new can purchase. This action cannot be
            undone.
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
