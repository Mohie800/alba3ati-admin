"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import StatsCard from "@/components/StatsCard";
import ErrorState from "@/components/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <>
      <PageHeader
        title="Friends"
        description="Social graph: friendships, blocks, and most-connected players."
      />

      {error ? (
        <ErrorState title="Failed to load friendship stats" onRetry={fetchData} />
      ) : !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <StatsCard key={i} label="" value="" icon={null} loading />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total Friendships"
              value={data.totalFriendships.toLocaleString()}
              icon={<Users />}
              tone="rose"
            />
            <StatsCard
              label="New Today"
              value={data.friendshipsToday.toLocaleString()}
              icon={<UserPlus />}
              tone="emerald"
            />
            <StatsCard
              label="Pending Requests"
              value={data.pendingRequests.toLocaleString()}
              icon={<Clock />}
              tone="amber"
            />
            <StatsCard
              label="Total Blocks"
              value={data.totalBlocks.toLocaleString()}
              icon={<ShieldBan />}
              tone="red"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Recent Pending Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentRequests.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted-foreground">
                    No pending requests
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            From
                          </TableHead>
                          <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            To
                          </TableHead>
                          <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Sent
                          </TableHead>
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
                            <TableCell className="text-muted-foreground">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Top Connected Players
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.topConnected.length === 0 ? (
                  <p className="text-center py-6 text-sm text-muted-foreground">
                    No data yet
                  </p>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[50px] bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            #
                          </TableHead>
                          <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Name
                          </TableHead>
                          <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Friends
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topConnected.map((player, i) => (
                          <TableRow key={player._id}>
                            <TableCell className="font-mono text-sm text-muted-foreground">
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
                            <TableCell className="tabular-nums font-medium">
                              {player.friendCount}
                            </TableCell>
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
    </>
  );
}
