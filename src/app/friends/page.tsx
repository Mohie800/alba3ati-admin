"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserPlus, Clock, ShieldBan } from "lucide-react";
import api from "@/lib/api";

interface RecentRequest {
  _id: string;
  requester: { _id: string; name: string };
  recipient: { _id: string; name: string };
  createdAt: string;
}

interface TopPlayer {
  _id: string;
  name: string;
  friendCount: number;
}

interface FriendshipStats {
  totalFriendships: number;
  totalBlocks: number;
  pendingRequests: number;
  friendshipsToday: number;
  recentRequests: RecentRequest[];
  topConnected: TopPlayer[];
}

export default function FriendsPage() {
  const [data, setData] = useState<FriendshipStats | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await api.get("/admin/friendship-stats");
      setData(res.data);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold mb-6">Friends</h1>

          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-3">
                Failed to load friendship stats
              </p>
              <Button variant="outline" onClick={fetchData}>
                Retry
              </Button>
            </div>
          ) : !data ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                  label="Total Friendships"
                  value={data.totalFriendships}
                  icon={<Users size={28} />}
                />
                <StatsCard
                  label="New Today"
                  value={data.friendshipsToday}
                  icon={<UserPlus size={28} />}
                />
                <StatsCard
                  label="Pending Requests"
                  value={data.pendingRequests}
                  icon={<Clock size={28} />}
                />
                <StatsCard
                  label="Total Blocks"
                  value={data.totalBlocks}
                  icon={<ShieldBan size={28} />}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Pending Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Recent Pending Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.recentRequests.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground">
                        No pending requests
                      </p>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>From</TableHead>
                              <TableHead>To</TableHead>
                              <TableHead>Sent</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.recentRequests.map((req) => (
                              <TableRow key={req._id}>
                                <TableCell>
                                  <Link
                                    href={`/players/${req.requester._id}`}
                                    className="hover:underline text-primary"
                                  >
                                    {req.requester.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/players/${req.recipient._id}`}
                                    className="hover:underline text-primary"
                                  >
                                    {req.recipient.name}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  {new Date(req.createdAt).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top Connected Players */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Top Connected Players
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.topConnected.length === 0 ? (
                      <p className="text-center py-6 text-muted-foreground">
                        No data yet
                      </p>
                    ) : (
                      <div className="border rounded-lg overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">#</TableHead>
                              <TableHead>Name</TableHead>
                              <TableHead>Friends</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {data.topConnected.map((player, i) => (
                              <TableRow key={player._id}>
                                <TableCell className="font-medium">
                                  {i + 1}
                                </TableCell>
                                <TableCell>
                                  <Link
                                    href={`/players/${player._id}`}
                                    className="hover:underline text-primary"
                                  >
                                    {player.name}
                                  </Link>
                                </TableCell>
                                <TableCell>{player.friendCount}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
