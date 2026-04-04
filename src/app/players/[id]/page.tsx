"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface FrameOption {
  itemId: string;
  name: string;
  rarity: string;
  frameType: string;
  frameData: Record<string, any>;
}

interface Player {
  _id: string;
  name: string;
  deviceId: string | null;
  createdAt: string;
  frame: string | null;
}

interface Game {
  _id: string;
  roomId: string;
  status: string;
  roundNumber: number;
  createdAt: string;
  players: { player: string; roleId: string; status: string }[];
}

interface PlayerFriend {
  friendshipId: string;
  _id: string;
  name: string;
  frame: string | null;
  stats: { gamesWon: number; gamesPlayed: number };
  since: string;
}

export default function PlayerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [deviceBanned, setDeviceBanned] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banExpiresAt, setBanExpiresAt] = useState("");
  const [banLoading, setBanLoading] = useState(false);
  const [showUnbanDialog, setShowUnbanDialog] = useState(false);

  // Notification state
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyBody, setNotifyBody] = useState("");
  const [notifySending, setNotifySending] = useState(false);
  const [notifySent, setNotifySent] = useState(false);

  // Frame state
  const [frameLoading, setFrameLoading] = useState(false);
  const [frameSaved, setFrameSaved] = useState(false);
  const [frameOptions, setFrameOptions] = useState<FrameOption[]>([]);

  // Friends state
  const [friends, setFriends] = useState<PlayerFriend[]>([]);
  const [removingFriend, setRemovingFriend] = useState<PlayerFriend | null>(
    null,
  );
  const [removeLoading, setRemoveLoading] = useState(false);

  // Coin state
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [coinTransactions, setCoinTransactions] = useState<any[]>([]);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    async function fetch() {
      try {
        const [playerRes, friendsRes, coinsRes, shopRes] = await Promise.all([
          api.get(`/admin/players/${id}`),
          api.get(`/admin/players/${id}/friends`),
          api.get(`/admin/players/${id}/coins`),
          api.get("/admin/shop-items"),
        ]);
        setPlayer(playerRes.data.data.player);
        setGames(playerRes.data.data.games);
        setDeviceBanned(playerRes.data.data.deviceBanned);
        setFriends(friendsRes.data.data.friends);
        setCoinBalance(coinsRes.data.data.coins);
        setCoinTransactions(coinsRes.data.data.transactions);
        setFrameOptions(shopRes.data.data.items);
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
        ...(banExpiresAt && {
          expiresAt: new Date(banExpiresAt).toISOString(),
        }),
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
    try {
      await api.delete(`/admin/bans/${player.deviceId}`);
      setDeviceBanned(false);
      setShowUnbanDialog(false);
    } catch {
      /* handled by interceptor */
    }
  };

  const handleSendNotification = async () => {
    if (!notifyTitle.trim() || !notifyBody.trim() || !player) return;
    setNotifySending(true);
    try {
      await api.post("/admin/notifications/send", {
        title: notifyTitle.trim(),
        body: notifyBody.trim(),
        userIds: [player._id],
      });
      setShowNotifyDialog(false);
      setNotifyTitle("");
      setNotifyBody("");
      setNotifySent(true);
      setTimeout(() => setNotifySent(false), 3000);
    } catch {
      /* handled by interceptor */
    } finally {
      setNotifySending(false);
    }
  };

  const handleAssignFrame = async (frameId: string | null) => {
    if (!player) return;
    setFrameLoading(true);
    try {
      await api.patch(`/admin/players/${player._id}/frame`, { frame: frameId });
      setPlayer((prev) => (prev ? { ...prev, frame: frameId } : prev));
      setFrameSaved(true);
      setTimeout(() => setFrameSaved(false), 2500);
    } catch {
      /* handled by interceptor */
    } finally {
      setFrameLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "playing") return "default";
    if (s === "ended") return "secondary";
    return "outline";
  };

  const handleRemoveFriend = async () => {
    if (!removingFriend) return;
    setRemoveLoading(true);
    try {
      await api.delete(`/admin/friendships/${removingFriend.friendshipId}`);
      setFriends((prev) =>
        prev.filter((f) => f.friendshipId !== removingFriend.friendshipId),
      );
      setRemovingFriend(null);
    } catch {
      /* handled by interceptor */
    } finally {
      setRemoveLoading(false);
    }
  };

  const handleAdjustCoins = async () => {
    const amount = parseInt(adjustAmount);
    if (!amount || amount === 0) return;
    setAdjustLoading(true);
    try {
      const res = await api.post(`/admin/players/${id}/adjust-coins`, {
        amount,
        reason: adjustReason.trim(),
      });
      setCoinBalance(res.data.data.newBalance);
      // Refresh transactions
      const coinsRes = await api.get(`/admin/players/${id}/coins`);
      setCoinTransactions(coinsRes.data.data.transactions);
      setShowAdjustDialog(false);
      setAdjustAmount("");
      setAdjustReason("");
    } catch {
      /* handled by interceptor */
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleDeletePlayer = async () => {
    if (!player) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/players/${player._id}`);
      router.push("/players");
    } catch {
      /* handled by interceptor */
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <Link
            href="/players"
            className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
          >
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
                    Device ID:{" "}
                    {player.deviceId ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-xs">
                        {player.deviceId}
                      </code>
                    ) : (
                      <span className="italic">None</span>
                    )}
                  </p>
                  <div className="pt-2 flex items-center gap-3 flex-wrap">
                    {player.deviceId && (
                      <>
                        {deviceBanned ? (
                          <>
                            <Badge variant="destructive">Device Banned</Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowUnbanDialog(true)}
                            >
                              Unban
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setShowBanDialog(true)}
                          >
                            Ban Device
                          </Button>
                        )}
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNotifyDialog(true)}
                    >
                      Send Notification
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete Player
                    </Button>
                    {notifySent && (
                      <span className="text-sm text-green-500 font-medium">
                        Sent!
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Frame assignment */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Avatar Frame</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleAssignFrame(null)}
                      disabled={frameLoading}
                      className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                        player.frame === null
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      None
                    </button>
                    {frameOptions.map((f) => (
                      <button
                        key={f.itemId}
                        onClick={() => handleAssignFrame(f.itemId)}
                        disabled={frameLoading}
                        className={`px-3 py-1.5 rounded-md text-sm border transition-colors flex items-center gap-1.5 ${
                          player.frame === f.itemId
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        {f.frameType === "color" && f.frameData?.color && (
                          <span
                            className="w-3 h-3 rounded-full inline-block"
                            style={{ backgroundColor: f.frameData.color }}
                          />
                        )}
                        {f.frameType === "gradient" &&
                          f.frameData?.colors?.length >= 2 && (
                            <span
                              className="w-3 h-3 rounded-full inline-block"
                              style={{
                                background: `linear-gradient(135deg, ${f.frameData.colors[0]}, ${f.frameData.colors[1]})`,
                              }}
                            />
                          )}
                        {f.name}
                        <span className="text-xs opacity-50">({f.rarity})</span>
                      </button>
                    ))}
                  </div>
                  {frameSaved && (
                    <p className="text-sm text-green-500 font-medium mt-2">
                      Frame saved!
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Coin Balance */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Coin Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-3xl font-bold">{coinBalance}</span>
                    <span className="text-muted-foreground">coins</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAdjustDialog(true)}
                    >
                      Adjust Coins
                    </Button>
                  </div>
                  {coinTransactions.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium mb-2">
                        Recent Transactions
                      </h4>
                      <div className="border rounded-lg overflow-x-auto">
                        <Table className="min-w-[400px]">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Balance</TableHead>
                              <TableHead>Date</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {coinTransactions.map((tx: any) => (
                              <TableRow key={tx._id}>
                                <TableCell>
                                  <Badge
                                    variant={
                                      tx.type === "admin_adjust"
                                        ? "destructive"
                                        : tx.type.startsWith("game")
                                          ? "default"
                                          : tx.type === "shop_purchase"
                                            ? "secondary"
                                            : "outline"
                                    }
                                  >
                                    {tx.type.replace(/_/g, " ")}
                                  </Badge>
                                </TableCell>
                                <TableCell
                                  className={
                                    tx.amount >= 0
                                      ? "text-green-500 font-medium"
                                      : "text-red-500 font-medium"
                                  }
                                >
                                  {tx.amount >= 0 ? `+${tx.amount}` : tx.amount}
                                </TableCell>
                                <TableCell>{tx.balance}</TableCell>
                                <TableCell>
                                  {new Date(tx.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Friends */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-base">
                    Friends ({friends.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {friends.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground">
                      No friends
                    </p>
                  ) : (
                    <div className="border rounded-lg overflow-x-auto">
                      <Table className="min-w-[400px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Frame</TableHead>
                            <TableHead>Games Won</TableHead>
                            <TableHead>Since</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {friends.map((f) => (
                            <TableRow key={f.friendshipId}>
                              <TableCell>
                                <Link
                                  href={`/players/${f._id}`}
                                  className="hover:underline text-primary"
                                >
                                  {f.name}
                                </Link>
                              </TableCell>
                              <TableCell>
                                {f.frame ? (
                                  <Badge variant="outline">{f.frame}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{f.stats?.gamesWon ?? 0}</TableCell>
                              <TableCell>
                                {f.since
                                  ? new Date(f.since).toLocaleDateString()
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setRemovingFriend(f)}
                                >
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <h2 className="text-lg font-semibold mb-4">Game History</h2>
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[400px]">
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
                        <TableCell
                          colSpan={4}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No games found
                        </TableCell>
                      </TableRow>
                    ) : (
                      games.map((g) => (
                        <TableRow key={g._id}>
                          <TableCell>
                            <Link
                              href={`/games/${g._id}`}
                              className="hover:underline text-primary"
                            >
                              {g.roomId}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColor(g.status)}>
                              {g.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{g.roundNumber}</TableCell>
                          <TableCell>
                            {new Date(g.createdAt).toLocaleDateString()}
                          </TableCell>
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
              This will ban the device{" "}
              <code className="bg-muted px-1 rounded">{player?.deviceId}</code>{" "}
              from using the app.
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
              <label className="text-sm font-medium mb-1 block">
                Expires At (optional)
              </label>
              <Input
                type="datetime-local"
                value={banExpiresAt}
                onChange={(e) => setBanExpiresAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for a permanent ban
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={banLoading || !banReason.trim()}
            >
              {banLoading ? "Banning..." : "Confirm Ban"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showUnbanDialog} onOpenChange={setShowUnbanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Unban</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to unban the device{" "}
            <code className="bg-muted px-1 rounded">{player?.deviceId}</code>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUnbanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnban}>Confirm Unban</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Notification to {player?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                placeholder="Notification title"
                value={notifyTitle}
                onChange={(e) => setNotifyTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Body</label>
              <Textarea
                placeholder="Notification body"
                value={notifyBody}
                onChange={(e) => setNotifyBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotifyDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={
                notifySending || !notifyTitle.trim() || !notifyBody.trim()
              }
            >
              {notifySending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!removingFriend}
        onOpenChange={(open) => !open && setRemovingFriend(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Friendship</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove the friendship between{" "}
            <strong>{player?.name}</strong> and{" "}
            <strong>{removingFriend?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovingFriend(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveFriend}
              disabled={removeLoading}
            >
              {removeLoading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Coins for {player?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Amount (positive to add, negative to deduct)
              </label>
              <Input
                type="number"
                placeholder="e.g. 50 or -20"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason</label>
              <Textarea
                placeholder="Reason for adjustment"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustCoins}
              disabled={
                adjustLoading || !adjustAmount || parseInt(adjustAmount) === 0
              }
            >
              {adjustLoading ? "Adjusting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to permanently delete{" "}
            <strong>{player?.name}</strong>? This will remove the player
            account, all friendships, and coin transactions. This action cannot
            be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlayer}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Player"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  );
}
