"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Plus, ExternalLink } from "lucide-react";
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
const PAGE_SIZE = 20;

export default function AdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showDialog, setShowDialog] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Ad | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      setError(false);
      const { data } = await api.get("/admin/ads", {
        params: { page, limit: PAGE_SIZE },
      });
      setAds(data.data.ads);
      setPages(data.data.pages);
      setTotal(data.data.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
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
      className: "w-20",
      render: (ad) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${API_BASE_URL}${ad.imageUrl}`}
          alt={ad.title}
          className="w-16 h-10 object-cover rounded border"
        />
      ),
    },
    {
      key: "title",
      label: "Title",
      render: (ad) => <span className="font-medium">{ad.title}</span>,
    },
    {
      key: "link",
      label: "Link",
      render: (ad) =>
        ad.link ? (
          <a
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm truncate max-w-[220px]"
          >
            <span className="truncate">{ad.link}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (ad) =>
        ad.isActive ? (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/15">
            Active
          </Badge>
        ) : (
          <Badge variant="outline">Inactive</Badge>
        ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (ad) => new Date(ad.createdAt).toLocaleDateString(),
    },
    {
      key: "_id",
      label: "",
      className: "text-right",
      render: (ad) => (
        <div
          className="flex gap-1.5 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleToggleActive(ad)}
          >
            {ad.isActive ? "Deactivate" : "Activate"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openEditDialog(ad)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setDeleteTarget(ad)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Ads"
        description="In-app banner ads served to players."
        actions={
          <Button onClick={openCreateDialog}>
            <Plus size={14} className="mr-1.5" />
            Create Ad
          </Button>
        }
      />
      {error ? (
        <ErrorState title="Failed to load ads" onRetry={fetchAds} />
      ) : (
        <DataTable
          columns={columns}
          data={ads}
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
          emptyMessage="No ads yet — click Create Ad to add one"
          minWidth={700}
        />
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAd ? "Edit Ad" : "Create Ad"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Title</label>
              <Input
                placeholder="Ad title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Link (optional)
              </label>
              <Input
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Image {editingAd ? "(leave empty to keep current)" : ""}
              </label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
              {editingAd && !imageFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${API_BASE_URL}${editingAd.imageUrl}`}
                  alt="Current"
                  className="mt-2 w-full h-32 object-cover rounded border"
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
              {saving ? "Saving…" : editingAd ? "Update" : "Create"}
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
            <DialogTitle>Delete Ad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>&quot;{deleteTarget?.title}&quot;</strong>? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
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
