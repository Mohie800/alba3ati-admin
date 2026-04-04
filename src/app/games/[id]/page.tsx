"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";

const ROLES: Record<string, string> = {
  "1": "البعاتي",
  "2": "العمدة",
  "3": "شيخ الدمازين",
  "4": "الكاشف",
  "5": "ابو جنزير",
};

interface PlayerInGame {
  player: { _id: string; name: string } | null;
  roleId: string | null;
  status: string;
  kills: number;
}

interface GameDetail {
  _id: string;
  roomId: string;
  status: string;
  roundNumber: number;
  activePlayers: number;
  players: PlayerInGame[];
  createdAt: string;
}

export default function GameDetailPage() {
  const { id } = useParams();
  const [game, setGame] = useState<GameDetail | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get(`/admin/games/${id}`);
        setGame(data.data.game);
      } catch {
        /* handled by interceptor */
      }
    }
    fetch();
  }, [id]);

  const statusColor = (s: string) => {
    if (s === "alive") return "default" as const;
    if (s === "dead") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-4 pb-4 pt-16 lg:p-8 min-w-0">
          <Link
            href="/games"
            className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
          >
            &larr; Back to Games
          </Link>
          {game ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    Room: {game.roomId}
                    <Badge>{game.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>Round: {game.roundNumber}</p>
                  <p>Players: {game.players.length}</p>
                  <p>Created: {new Date(game.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>
              <h2 className="text-lg font-semibold mb-4">Players</h2>
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {game.players.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          {p.player ? (
                            <Link
                              href={`/players/${p.player._id}`}
                              className="hover:underline text-primary"
                            >
                              {p.player.name}
                            </Link>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>
                          {p.roleId ? ROLES[p.roleId] || p.roleId : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusColor(p.status)}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{p.kills}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Loading...</p>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
