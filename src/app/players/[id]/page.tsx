"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";

interface Player {
  _id: string;
  name: string;
  deviceId: string | null;
  createdAt: string;
}

interface Game {
  _id: string;
  roomId: string;
  status: string;
  roundNumber: number;
  createdAt: string;
  players: { player: string; roleId: string; status: string }[];
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [deviceBanned, setDeviceBanned] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpiresAt, setBanExpiresAt] = useState("");
  const [banLoading, setBanLoading] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get(`/admin/players/${id}`);
        setPlayer(data.data.player);
        setGames(data.data.games);
        setDeviceBanned(data.data.deviceBanned);
      } catch {
        /* handled by interceptor */
      }
    }
    fetch();
  }, [id]);

  const handleBan = async () => {
    if (!player?.deviceId) return;
    setBanLoading(true);
    try {
      await api.post("/admin/bans", {
        deviceId: player.deviceId,
        reason: banReason.trim(),
        ...(banExpiresAt && { expiresAt: new Date(banExpiresAt).toISOString() }),
      });
      setDeviceBanned(true);
      setShowBanDialog(false);
      setBanReason("");
      setBanExpiresAt("");
    } catch {
      /* handled by interceptor */
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!player?.deviceId) return;
    if (!confirm("Unban this device?")) return;
    try {
      await api.delete(`/admin/bans/${player.deviceId}`);
      setDeviceBanned(false);
    } catch {
      /* handled by interceptor */
    }
  };

  const statusColor = (s: string) => {
    if (s === "playing") return "default";
    if (s === "ended") return "secondary";
    return "outline";
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8">
          <Link href="/players" className="text-sm text-muted-foreground hover:underline mb-4 inline-block">
            &larr; Back to Players
          </Link>
          {player ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{player.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Joined: {new Date(player.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Games played: {games.length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Device ID: {player.deviceId ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{player.deviceId}</code>
                    ) : (
                      <span className="italic">None</span>
                    )}
                  </p>
                  {player.deviceId && (
                    <div className="pt-2">
                      {deviceBanned ? (
                        <div className="flex items-center gap-3">
                          <Badge variant="destructive">Device Banned</Badge>
                          <Button variant="outline" size="sm" onClick={handleUnban}>
                            Unban
                          </Button>
                        </div>
                      ) : (
                        <Button variant="destructive" size="sm" onClick={() => setShowBanDialog(true)}>
                          Ban Device
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              <h2 className="text-lg font-semibold mb-4">Game History</h2>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rounds</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No games found
                        </TableCell>
                      </TableRow>
                    ) : (
                      games.map((g) => (
                        <TableRow key={g._id}>
                          <TableCell>
                            <Link href={`/games/${g._id}`} className="hover:underline text-primary">
                              {g.roomId}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor(g.status)}>{g.status}</Badge>
                          </TableCell>
                          <TableCell>{g.roundNumber}</TableCell>
                          <TableCell>{new Date(g.createdAt).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>

      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Device</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              This will ban the device <code className="bg-muted px-1 rounded">{player?.deviceId}</code> from using the app.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Textarea
                placeholder="Reason for banning"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expires At (optional)</label>
              <Input
                type="datetime-local"
                value={banExpiresAt}
                onChange={(e) => setBanExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for a permanent ban</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={banLoading || !banReason.trim()}>
              {banLoading ? "Banning..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
