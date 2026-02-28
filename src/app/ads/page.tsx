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
import api from "@/lib/api";

interface Ad {
  _id: string;
  title: string;
  imageUrl: string;
  link: string | null;
  isActive: boolean;
  createdAt: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState(false);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAds = useCallback(async () => {
    try {
      setError(false);
      const { data } = await api.get("/admin/ads", { params: { page, limit: 20 } });
      setAds(data.data.ads);
      setPages(data.data.pages);
    } catch {
      setError(true);
    }
  }, [page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const openCreateDialog = () => {
    setEditingAd(null);
    setTitle("");
    setLink("");
    setImageFile(null);
    setShowDialog(true);
  };

  const openEditDialog = (ad: Ad) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setLink(ad.link || "");
    setImageFile(null);
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    if (!editingAd && !imageFile) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("link", link.trim());
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingAd) {
        await api.put(`/admin/ads/${editingAd._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/ads", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setShowDialog(false);
      fetchAds();
    } catch {
      /* handled by interceptor */
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (ad: Ad) => {
    try {
      const formData = new FormData();
      formData.append("isActive", String(!ad.isActive));
      await api.put(`/admin/ads/${ad._id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchAds();
    } catch {
      /* handled by interceptor */
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/ads/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchAds();
    } catch {
      /* handled by interceptor */
    } finally {
      setDeleting(false);
    }
  };

  const columns: Column<Ad>[] = [
    {
      key: "imageUrl",
      label: "Image",
      render: (ad) => (
        <img
          src={`${API_BASE_URL}${ad.imageUrl}`}
          alt={ad.title}
          className="w-16 h-10 object-cover rounded"
        />
      ),
    },
    { key: "title", label: "Title" },
    {
      key: "link",
      label: "Link",
      render: (ad) =>
        ad.link ? (
          <a
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm truncate max-w-[200px] block"
          >
            {ad.link}
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (ad) => (
        <Badge variant={ad.isActive ? "default" : "outline"}>
          {ad.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (ad) => new Date(ad.createdAt).toLocaleDateString(),
    },
    {
      key: "_id",
      label: "Actions",
      render: (ad) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => handleToggleActive(ad)}>
            {ad.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => openEditDialog(ad)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(ad)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Ads</h1>
            <Button onClick={openCreateDialog}>Create Ad</Button>
          </div>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">Failed to load ads</p>
              <Button variant="outline" onClick={fetchAds}>Retry</Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={ads}
              page={page}
              pages={pages}
              onPageChange={setPage}
            />
          )}
        </main>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Ad" : "Create Ad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="Ad title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Link (optional)</label>
              <Input
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                Image {editingAd ? "(leave empty to keep current)" : ""}
              </label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {editingAd && !imageFile && (
                <img
                  src={`${API_BASE_URL}${editingAd.imageUrl}`}
                  alt="Current"
                  className="mt-2 w-full h-32 object-cover rounded"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !title.trim() || (!editingAd && !imageFile)}
            >
              {saving ? "Saving..." : editingAd ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
