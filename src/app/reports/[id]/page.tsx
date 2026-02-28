"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import api from "@/lib/api";

interface ReportDetail {
  _id: string;
  reporter: { _id: string; name: string } | null;
  reporterName: string;
  reportedPlayer: { _id: string; name: string; deviceId?: string } | null;
  reportedPlayerName: string;
  room: { _id: string; roomId: string; status: string; createdAt: string } | null;
  roomId: string;
  reason: string;
  details: string;
  status: string;
  adminNote: string | null;
  resolvedBy: { _id: string; username: string } | null;
  resolvedAt: string | null;
  createdAt: string;
}

const reasonLabels: Record<string, string> = {
  inappropriate_language: "Inappropriate Language",
  cheating: "Cheating",
  harassment: "Harassment",
  inappropriate_name: "Inappropriate Name",
  other: "Other",
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [action, setAction] = useState<string>("");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);

  useEffect(() => {
    async function fetchReport() {
      try {
        const { data } = await api.get(`/admin/reports/${id}`);
        setReport(data.data.report);
      } catch {
        /* handled by interceptor */
      }
    }
    fetchReport();
  }, [id]);

  const handleResolve = async () => {
    if (!action) return;

    // If banning, show confirmation dialog first
    if (action === "banned" && !showBanDialog) {
      if (!adminNote.trim() && report) {
        setAdminNote(`Report: ${reasonLabels[report.reason] || report.reason}${report.details ? " — " + report.details : ""}`);
      }
      setShowBanDialog(true);
      return;
    }

    setShowBanDialog(false);
    setSubmitting(true);
    try {
      const { data } = await api.put(`/admin/reports/${id}/resolve`, {
        action,
        adminNote: adminNote.trim() || undefined,
      });
      setReport(data.data.report);
      setAction("");
      setAdminNote("");
    } catch {
      /* handled by interceptor */
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "pending") return "secondary" as const;
    if (s === "dismissed") return "outline" as const;
    if (s === "warned") return "default" as const;
    if (s === "banned") return "destructive" as const;
    return "outline" as const;
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <Link
            href="/reports"
            className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
          >
            &larr; Back to Reports
          </Link>

          {report ? (
            <>
              {/* Info Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Report: {reasonLabels[report.reason] || report.reason}
                    <Badge variant={statusColor(report.status)}>{report.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Reporter</p>
                      {report.reporter ? (
                        <Link
                          href={`/players/${report.reporter._id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {report.reporter.name}
                        </Link>
                      ) : (
                        <p>{report.reporterName}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Reported Player</p>
                      {report.reportedPlayer ? (
                        <Link
                          href={`/players/${report.reportedPlayer._id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {report.reportedPlayer.name}
                        </Link>
                      ) : (
                        <p>{report.reportedPlayerName}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Game Room</p>
                      {report.room ? (
                        <Link
                          href={`/games/${report.room._id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {report.room.roomId}
                        </Link>
                      ) : (
                        <p>{report.roomId}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Date</p>
                      <p>{new Date(report.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {report.details && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Details</p>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{report.details}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action or Resolution Card */}
              {report.status === "pending" ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Take Action</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Action</label>
                      <Select value={action} onValueChange={setAction}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dismissed">Dismiss</SelectItem>
                          <SelectItem value="warned">Warn Player</SelectItem>
                          <SelectItem value="banned">Ban Player Device</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Admin Note (optional)
                      </label>
                      <Textarea
                        placeholder="Add a note..."
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleResolve}
                      disabled={submitting || !action}
                      variant={action === "banned" ? "destructive" : "default"}
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Action Taken</p>
                      <Badge variant={statusColor(report.status)}>{report.status}</Badge>
                    </div>
                    {report.adminNote && (
                      <div>
                        <p className="text-muted-foreground">Admin Note</p>
                        <p className="whitespace-pre-wrap">{report.adminNote}</p>
                      </div>
                    )}
                    {report.resolvedBy && (
                      <div>
                        <p className="text-muted-foreground">Resolved By</p>
                        <p>{report.resolvedBy.username}</p>
                      </div>
                    )}
                    {report.resolvedAt && (
                      <div>
                        <p className="text-muted-foreground">Resolved At</p>
                        <p>{new Date(report.resolvedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>

      {/* Ban Confirmation Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Device Ban</DialogTitle>
            <DialogDescription>
              This will ban the reported player&apos;s device. They will not be able to register or
              play on this device anymore. This action can be reversed from the Bans page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleResolve} disabled={submitting}>
              {submitting ? "Banning..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
