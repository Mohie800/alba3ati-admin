"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type Participant,
} from "livekit-client";
import {
  Radio,
  RefreshCw,
  Headphones,
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  Users,
  ShieldAlert,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import ErrorState from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const POLL_MS = 5000;
const MONITOR_PREFIX = "admin-monitor-";

interface Participant_ {
  identity: string;
  name: string;
  joinedAt: number | null;
  hasMic: boolean;
  micOn: boolean;
}

interface VoiceRoom {
  roomId: string;
  livekitRoom: string;
  createdAt: number | null;
  numParticipants: number;
  status: string | null;
  gamePhase: string | null;
  host: string | null;
  playerCount: number;
  participants: Participant_[];
}

interface LiveParticipant {
  identity: string;
  name: string;
  speaking: boolean;
  micOn: boolean;
}

function phaseTone(phase: string | null): string {
  switch (phase) {
    case "lobby":
      return "secondary";
    case "discussion":
      return "default";
    case "night":
      return "outline";
    default:
      return "secondary";
  }
}

export default function VoiceMonitorPage() {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Active listen session state
  const [listeningRoom, setListeningRoom] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [listenError, setListenError] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [live, setLive] = useState<LiveParticipant[]>([]);

  const roomRef = useRef<Room | null>(null);
  const audioContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      setError(false);
      const { data } = await api.get("/admin/voice/rooms");
      setRooms(data.data.rooms);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll the room list so the admin always sees who's connected right now.
  useEffect(() => {
    fetchRooms();
    const id = setInterval(fetchRooms, POLL_MS);
    return () => clearInterval(id);
  }, [fetchRooms]);

  const syncParticipants = useCallback(() => {
    const room = roomRef.current;
    if (!room) {
      setLive([]);
      return;
    }
    const list = Array.from(room.remoteParticipants.values())
      .filter((p) => !p.identity.startsWith(MONITOR_PREFIX))
      .map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        speaking: p.isSpeaking,
        micOn: p.isMicrophoneEnabled,
      }));
    setLive(list);
  }, []);

  const teardown = useCallback(async () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      try {
        await room.disconnect();
      } catch {
        /* ignore */
      }
    }
    if (audioContainerRef.current) {
      audioContainerRef.current.innerHTML = "";
    }
    setLive([]);
    setAudioBlocked(false);
  }, []);

  const stopListening = useCallback(async () => {
    await teardown();
    setListeningRoom(null);
  }, [teardown]);

  const listen = useCallback(
    async (roomId: string) => {
      setListenError(null);
      await teardown();
      setListeningRoom(null);
      setConnecting(roomId);

      try {
        const { data } = await api.get("/admin/voice/token", {
          params: { roomId },
        });
        const { token, url } = data.data;

        const room = new Room();
        roomRef.current = room;

        room
          .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
            if (track.kind === Track.Kind.Audio) {
              const el = track.attach();
              el.setAttribute("autoplay", "true");
              audioContainerRef.current?.appendChild(el);
            }
            syncParticipants();
          })
          .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
            if (track.kind === Track.Kind.Audio) {
              track.detach().forEach((el) => el.remove());
            }
            syncParticipants();
          })
          .on(RoomEvent.ActiveSpeakersChanged, (_s: Participant[]) =>
            syncParticipants(),
          )
          .on(RoomEvent.ParticipantConnected, syncParticipants)
          .on(RoomEvent.ParticipantDisconnected, syncParticipants)
          .on(RoomEvent.TrackMuted, syncParticipants)
          .on(RoomEvent.TrackUnmuted, syncParticipants)
          .on(RoomEvent.AudioPlaybackStatusChanged, () =>
            setAudioBlocked(!room.canPlaybackAudio),
          )
          .on(RoomEvent.Disconnected, () => {
            if (roomRef.current === room) {
              roomRef.current = null;
              setListeningRoom(null);
              setLive([]);
            }
          });

        await room.connect(url, token);
        // The click is a user gesture, so this satisfies browser autoplay rules.
        try {
          await room.startAudio();
        } catch {
          /* ignore — surfaced via audioBlocked */
        }
        setAudioBlocked(!room.canPlaybackAudio);
        setListeningRoom(roomId);
        syncParticipants();
      } catch (err) {
        const msg =
          (err as { userMessage?: string })?.userMessage ||
          "Failed to connect to room audio";
        setListenError(msg);
        await teardown();
      } finally {
        setConnecting(null);
      }
    },
    [teardown, syncParticipants],
  );

  const enableAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.startAudio();
      setAudioBlocked(!room.canPlaybackAudio);
    } catch {
      /* ignore */
    }
  }, []);

  // Clean up the LiveKit connection if the admin navigates away.
  useEffect(() => {
    return () => {
      teardown();
    };
  }, [teardown]);

  const listeningRoomData = rooms.find((r) => r.roomId === listeningRoom);

  return (
    <>
      <PageHeader
        title="Voice Monitor"
        description="Live voice rooms across the game. Listen in silently for moderation."
        actions={
          <Button variant="outline" onClick={fetchRooms} disabled={loading}>
            <RefreshCw
              size={14}
              className={cn("mr-1.5", loading && "animate-spin")}
            />
            Refresh
          </Button>
        }
      />

      {/* Privacy / moderation notice */}
      <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
        <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-muted-foreground">
          Moderator listening is silent and invisible to players — you cannot be
          heard and do not appear in the room. Use only for moderation, and make
          sure your terms of service disclose that rooms may be monitored.
        </p>
      </div>

      {/* Hidden sink for the remote audio elements */}
      <div ref={audioContainerRef} className="hidden" aria-hidden />

      {/* Active listen session panel */}
      {listeningRoom && (
        <Card className="mb-6 gap-3 border-primary/40 bg-primary/5 py-4">
          <div className="flex flex-col gap-3 px-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Headphones size={18} />
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  Listening to room{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                    {listeningRoom}
                  </code>
                </p>
                <p className="text-xs text-muted-foreground">
                  {listeningRoomData
                    ? `${listeningRoomData.numParticipants} connected`
                    : "Connected"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {audioBlocked && (
                <Button variant="default" size="sm" onClick={enableAudio}>
                  <Volume2 size={14} className="mr-1.5" />
                  Enable audio
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={stopListening}>
                <Square size={13} className="mr-1.5" />
                Stop
              </Button>
            </div>
          </div>

          {audioBlocked && (
            <div className="flex items-center gap-2 px-6 text-xs text-amber-600 dark:text-amber-500">
              <VolumeX size={13} />
              Audio is blocked by the browser — click “Enable audio”.
            </div>
          )}

          {/* Live speakers */}
          <div className="px-6">
            {live.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No one else is connected.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {live.map((p) => (
                  <span
                    key={p.identity}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                      p.speaking
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {p.micOn ? (
                      <Mic
                        size={12}
                        className={cn(
                          p.speaking
                            ? "text-emerald-500"
                            : "text-muted-foreground",
                        )}
                      />
                    ) : (
                      <MicOff size={12} className="text-muted-foreground/60" />
                    )}
                    {p.name}
                    {p.speaking && (
                      <span className="ml-0.5 flex h-1.5 w-1.5">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {listenError && (
        <div className="mb-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm text-destructive">
          {listenError}
        </div>
      )}

      {/* Room grid */}
      {error ? (
        <ErrorState title="Failed to load voice rooms" onRetry={fetchRooms} />
      ) : loading && rooms.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Loading voice rooms…
        </p>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Radio size={22} />
          </div>
          <h3 className="mb-1 text-base font-semibold">No active voice rooms</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            When players join voice in a lobby or game, the rooms will appear
            here in real time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const isThis = listeningRoom === room.roomId;
            const isConnecting = connecting === room.roomId;
            return (
              <Card
                key={room.roomId}
                className={cn(
                  "gap-4 py-5 transition-colors",
                  isThis && "border-primary/50 ring-1 ring-primary/20",
                )}
              >
                <div className="flex items-start justify-between gap-3 px-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-semibold">
                        {room.roomId}
                      </code>
                      {room.gamePhase && (
                        <Badge
                          variant={
                            phaseTone(room.gamePhase) as
                              | "default"
                              | "secondary"
                              | "outline"
                          }
                          className="capitalize"
                        >
                          {room.gamePhase}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users size={12} />
                      {room.numParticipants} in voice
                      {room.playerCount > 0 && ` · ${room.playerCount} players`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={isThis ? "destructive" : "default"}
                    disabled={isConnecting}
                    onClick={() =>
                      isThis ? stopListening() : listen(room.roomId)
                    }
                  >
                    {isThis ? (
                      <>
                        <Square size={13} className="mr-1.5" />
                        Stop
                      </>
                    ) : isConnecting ? (
                      <>
                        <RefreshCw size={13} className="mr-1.5 animate-spin" />
                        …
                      </>
                    ) : (
                      <>
                        <Headphones size={13} className="mr-1.5" />
                        Listen
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t px-5 pt-3">
                  {room.participants.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No participants.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {room.participants.map((p) => {
                        const isHost = room.host && p.identity === room.host;
                        return (
                          <li
                            key={p.identity}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate">{p.name}</span>
                              {isHost && (
                                <Badge
                                  variant="outline"
                                  className="px-1.5 py-0 text-[10px]"
                                >
                                  host
                                </Badge>
                              )}
                            </span>
                            {p.micOn ? (
                              <Mic size={13} className="shrink-0 text-emerald-500" />
                            ) : (
                              <MicOff
                                size={13}
                                className="shrink-0 text-muted-foreground/50"
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
