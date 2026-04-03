"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const RARITY_BADGE: Record<string, { variant: "default" | "secondary" | "outline"; className: string }> = {
  common: { variant: "secondary", className: "" },
  rare: { variant: "default", className: "bg-purple-600 hover:bg-purple-600" },
  legendary: { variant: "default", className: "bg-yellow-600 hover:bg-yellow-600" },
};

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [error, setError] = useState(false);

  // Add/Edit dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editItem, setEditItem] = useState<ShopItem | null>(null);
  const [formItemId, setFormItemId] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("");
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
    try {
      setError(false);
      const { data } = await api.get("/admin/shop-items");
      setItems(data.data.items);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Auto-derive frameType from rarity when adding new items
  const handleRarityChange = (rarity: string) => {
    setFormRarity(rarity);
    if (!editItem) {
      if (rarity === "common") setFormFrameType("color");
      else if (rarity === "rare") setFormFrameType("gradient");
      else setFormFrameType("image");
    }
  };

  const openAddDialog = () => {
    setEditItem(null);
    setFormItemId("");
    setFormName("");
    setFormPrice("");
    setFormSortOrder("");
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
    setFormRarity(item.rarity || "legendary");
    setFormFrameType(item.frameType || "image");
    setFormColor(item.frameData?.color || "#E74C3C");
    setFormGradientColor1(item.frameData?.colors?.[0] || "#FF6B35");
    setFormGradientColor2(item.frameData?.colors?.[1] || "#F1C40F");
    setFormBorderWidth(String(item.frameData?.borderWidth || 3));
    setShowDialog(true);
  };

  const buildFrameData = () => {
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
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Shop Items</h1>
            <Button onClick={openAddDialog}>Add Item</Button>
          </div>
          {error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Failed to load shop items
              </p>
              <Button variant="outline" onClick={fetchItems}>
                Retry
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Frame ID</TableHead>
                    <TableHead>Rarity</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No shop items found
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
        </main>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editItem ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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

            {/* Color config */}
            {formFrameType === "color" && (
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
            {formFrameType === "gradient" && (
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
    </AuthGuard>
  );
}
