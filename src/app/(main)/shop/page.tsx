"use client";

import { useEffect, useState, useCallback } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Inbox } from "lucide-react";
import api from "@/lib/api";

interface ShopItem {
  _id: string;
  itemId: string;
  type: string;
  name: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  rarity: "common" | "rare" | "legendary";
  frameType: "color" | "gradient" | "image";
  frameData: Record<string, any>;
  createdAt: string;
}

const RARITY_OPTIONS = [
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "legendary", label: "Legendary" },
] as const;

const TYPE_OPTIONS = [
  { value: "frame", label: "Frame" },
  { value: "nameColor", label: "Name Color" },
] as const;

const SWATCH_BACKGROUNDS = ["#2C3E50", "#74B9FF", "#FF8C42"];

const RARITY_BADGE: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
  common: { variant: "secondary", className: "" },
  rare: { variant: "default", className: "bg-purple-600 hover:bg-purple-600" },
  legendary: { variant: "default", className: "bg-yellow-600 hover:bg-yellow-600" },
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Add/Edit dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<ShopItem | null>(null);
  const [formItemId, setFormItemId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");
  const [formType, setFormType] = useState<string>("frame");
  const [formRarity, setFormRarity] = useState<string>("common");
  const [formFrameType, setFormFrameType] = useState<string>("color");
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

  // Auto-derive frameType from rarity when adding new items
  const handleRarityChange = (rarity: string) => {
    setFormRarity(rarity);
    if (!editItem && formType === "frame") {
      if (rarity === "common") setFormFrameType("color");
      else if (rarity === "rare") setFormFrameType("gradient");
      else setFormFrameType("image");
    }
  };

  const handleTypeChange = (type: string) => {
    setFormType(type);
    if (type === "nameColor") {
      setFormFrameType("color");
    } else if (!editItem) {
      if (formRarity === "common") setFormFrameType("color");
      else if (formRarity === "rare") setFormFrameType("gradient");
      else setFormFrameType("image");
    }
  };

  const openAddDialog = () => {
    setEditItem(null);
    setFormItemId("");
    setFormName("");
    setFormPrice("");
    setFormSortOrder("");
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
    setFormType(item.type || "frame");
    setFormRarity(item.rarity || "legendary");
    setFormFrameType(item.frameType || "image");
    setFormColor(item.frameData?.color || "#E74C3C");
    setFormGradientColor1(item.frameData?.colors?.[0] || "#FF6B35");
    setFormGradientColor2(item.frameData?.colors?.[1] || "#F1C40F");
    setFormBorderWidth(String(item.frameData?.borderWidth || 3));
    setShowDialog(true);
  };

  const buildFrameData = () => {
    if (formType === "nameColor") {
      return { color: formColor };
    }
    if (formFrameType === "color") {
      return { color: formColor, borderWidth: Number(formBorderWidth) };
    }
    if (formFrameType === "gradient") {
      return { colors: [formGradientColor1, formGradientColor2], borderWidth: Number(formBorderWidth) };
    }
    return {};
  };

  const handleSave = async () => {
    if (!formItemId || !formName.trim()) return;
    setSaving(true);
    try {
      const frameData = buildFrameData();
      if (editItem) {
        await api.put(`/admin/shop-items/${editItem._id}`, {
          type: formType,
          name: formName.trim(),
          price: Number(formPrice),
          isActive: editItem.isActive,
          sortOrder: Number(formSortOrder),
          rarity: formRarity,
          frameType: formFrameType,
          frameData,
        });
      } else {
        await api.post("/admin/shop-items", {
          itemId: formItemId,
          type: formType,
          name: formName.trim(),
          price: Number(formPrice),
          sortOrder: Number(formSortOrder),
          rarity: formRarity,
          frameType: formFrameType,
          frameData,
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
      fetchItems();
    } catch {
      /* handled by interceptor */
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/shop-items/${deleteItem._id}`);
      setDeleteItem(null);
      fetchItems();
    } catch {
      /* handled by interceptor */
    } finally {
      setDeleting(false);
    }
  };

  const renderColorPreview = (item: ShopItem) => {
    if (item.type === "nameColor" && item.frameData?.color) {
      return (
        <span
          className="font-bold text-sm"
          style={{ color: item.frameData.color }}
        >
          A
        </span>
      );
    }
    if (item.frameType === "color" && item.frameData?.color) {
      return (
        <div
          className="w-5 h-5 rounded-full border border-border inline-block"
          style={{ backgroundColor: item.frameData.color }}
        />
      );
    }
    if (item.frameType === "gradient" && item.frameData?.colors?.length >= 2) {
      return (
        <div
          className="w-5 h-5 rounded-full border border-border inline-block"
          style={{
            background: `linear-gradient(135deg, ${item.frameData.colors[0]}, ${item.frameData.colors[1]})`,
          }}
        />
      );
    }
    return null;
  };

  return (
    <>
      <PageHeader
        title="Shop Items"
        description="Frames, name colors, and other cosmetics."
        actions={
          <Button onClick={openAddDialog}>
            <Plus size={14} className="mr-1.5" />
            Add Item
          </Button>
        }
      />
      {error ? (
        <ErrorState title="Failed to load shop items" onRetry={fetchItems} />
      ) : (
        <div className="border rounded-xl overflow-x-auto bg-card">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {[
                  "Name",
                  "Item ID",
                  "Kind",
                  "Rarity",
                  "Frame Type",
                  "Price",
                  "Active",
                  "Order",
                  "",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="text-center py-14">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Inbox size={18} />
                      </div>
                      <p className="text-sm">No shop items yet</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                      const rarityStyle = RARITY_BADGE[item.rarity] || RARITY_BADGE.common;
                      return (
                        <TableRow key={item._id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {renderColorPreview(item)}
                              {item.name}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.itemId}</TableCell>
                          <TableCell className="text-sm">{item.type === "nameColor" ? "Name Color" : "Frame"}</TableCell>
                          <TableCell>
                            <Badge variant={rarityStyle.variant} className={rarityStyle.className}>
                              {item.rarity || "legendary"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{item.frameType || "image"}</TableCell>
                          <TableCell>{item.price}</TableCell>
                          <TableCell>
                            <Badge
                              variant={item.isActive ? "default" : "secondary"}
                            >
                              {item.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.sortOrder}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleActive(item)}
                              >
                                {item.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(item)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteItem(item)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Type */}
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <div className="flex gap-2">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => handleTypeChange(t.value)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      formType === t.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rarity */}
            <div>
              <label className="text-sm font-medium mb-1 block">Rarity</label>
              <div className="flex gap-2">
                {RARITY_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => handleRarityChange(r.value)}
                    className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                      formRarity === r.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Item ID */}
            <div>
              <label className="text-sm font-medium mb-1 block">
                Item ID
              </label>
              <Input
                placeholder={formFrameType === "image" ? "e.g. wreath, wings1" : "e.g. color_red, gradient_sunset"}
                value={formItemId}
                onChange={(e) => setFormItemId(e.target.value)}
                disabled={!!editItem}
              />
            </div>

            {/* Name color preview */}
            {formType === "nameColor" && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      placeholder="#FF0000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Preview</label>
                  <div className="flex gap-2">
                    {SWATCH_BACKGROUNDS.map((bg) => (
                      <div
                        key={bg}
                        className="flex-1 rounded-md py-2 px-2 text-center"
                        style={{ backgroundColor: bg }}
                      >
                        <span
                          className="font-bold"
                          style={{ color: formColor }}
                        >
                          {formName || "Ø§Ø³Ù…"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Color config (frame) */}
            {formType === "frame" && formFrameType === "color" && (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Color</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      className="w-10 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      placeholder="#FF0000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="w-24">
                  <label className="text-sm font-medium mb-1 block">Width</label>
                  <Input
                    type="number"
                    value={formBorderWidth}
                    onChange={(e) => setFormBorderWidth(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Gradient config */}
            {formType === "frame" && formFrameType === "gradient" && (
              <div className="space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Color 1</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formGradientColor1}
                        onChange={(e) => setFormGradientColor1(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formGradientColor1}
                        onChange={(e) => setFormGradientColor1(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1 block">Color 2</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={formGradientColor2}
                        onChange={(e) => setFormGradientColor2(e.target.value)}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={formGradientColor2}
                        onChange={(e) => setFormGradientColor2(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 items-end">
                  <div className="w-24">
                    <label className="text-sm font-medium mb-1 block">Width</label>
                    <Input
                      type="number"
                      value={formBorderWidth}
                      onChange={(e) => setFormBorderWidth(e.target.value)}
                    />
                  </div>
                  <div
                    className="w-8 h-8 rounded-full border"
                    style={{
                      background: `linear-gradient(135deg, ${formGradientColor1}, ${formGradientColor2})`,
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">
                Arabic Name
              </label>
              <Input
                placeholder="Item name in Arabic"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Price</label>
                <Input
                  type="number"
                  placeholder="Price in coins"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
              <div className="w-24">
                <label className="text-sm font-medium mb-1 block">Order</label>
                <Input
                  type="number"
                  placeholder="Sort"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formItemId || !formName.trim()}
            >
              {saving ? "Saving..." : editItem ? "Update" : "Create"}
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
            <DialogTitle>Delete Item</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteItem?.name}&quot;? This
            action cannot be undone.
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
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
