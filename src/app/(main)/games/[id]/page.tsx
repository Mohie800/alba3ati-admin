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
import { roleName } from "@/lib/roles";

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
  isPublic?: boolean;
  isQuickPlay?: boolean;
  gamesCompleted?: number;
  gameHistory?: {
    result: string;
    endedAt: string;
    playerCount: number;
    rounds: number;
  }[];
  createdAt: string;
}

const RESULT_LABELS: Record<string, string> = {
  "1": "Ba3ati won",
  "2": "Villagers won",
  "3": "Abu Janzeer won",
  "0": "Draw",
};

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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Type
                  </p>
                  <p className="font-semibold">
                    {game.isQuickPlay
                      ? "Quick play"
                      : game.isPublic
                        ? "Public"
                        : "Private"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-0.5">
                    Games in room
                  </p>
                  <p className="font-semibold tabular-nums">
                    {game.gamesCompleted ?? 0}
                    {(game.gamesCompleted ?? 0) > 1 && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        ({(game.gamesCompleted ?? 0) - 1} rematch
                        {(game.gamesCompleted ?? 0) > 2 ? "es" : ""})
                      </span>
                    )}
                  </p>
                </div>
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
          {(game.gameHistory?.length ?? 0) > 0 && (
            <>
              <h2 className="text-base font-semibold mb-3">
                Games in this room
              </h2>
              <div className="border rounded-xl overflow-x-auto bg-card mb-6">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      {["#", "Result", "Players", "Rounds", "Ended"].map((h) => (
                        <TableHead
                          key={h}
                          className="bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                        >
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {game.gameHistory!.map((h, i) => (
                      <TableRow key={i}>
                        <TableCell className="tabular-nums">
                          {i + 1}
                          {i > 0 && (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              Rematch
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{RESULT_LABELS[h.result] ?? h.result}</TableCell>
                        <TableCell className="tabular-nums">{h.playerCount}</TableCell>
                        <TableCell className="tabular-nums">{h.rounds}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(h.endedAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          <h2 className="text-base font-semibold mb-3">
            {(game.gamesCompleted ?? 0) > 1 ? "Players (latest game)" : "Players"}
          </h2>
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
                    <TableCell>{roleName(p.roleId)}</TableCell>
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
