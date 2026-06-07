"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
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
  "6": "بله اب سيف",
  "7": "بعاتي كبير",
  "8": "جنابو",
  "9": "وَد الزلط",
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
    <>
      <PageHeader
        title={game ? `Room: ${game.roomId}` : "Game"}
        backHref="/games"
        backLabel="Back to Games"
        actions={game ? <Badge>{game.status}</Badge> : null}
      />
      {!game ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Round
                  </p>
                  <p className="font-semibold tabular-nums">
                    {game.roundNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Players
                  </p>
                  <p className="font-semibold tabular-nums">
                    {game.players.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Created
                  </p>
                  <p>{new Date(game.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <h2 className="text-base font-semibold mb-3">Players</h2>
          <div className="border rounded-xl overflow-x-auto bg-card">
            <Table className="min-w-[400px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Role
                  </TableHead>
                  <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kills
                  </TableHead>
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
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.roleId ? ROLES[p.roleId] || p.roleId : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(p.status)}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">{p.kills}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </>
  );
}
