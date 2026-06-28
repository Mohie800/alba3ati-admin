import { io, Socket } from "socket.io-client";

// Same host the axios client points at, without the `/api` suffix — the chat
// namespace lives on the Socket.IO server (see alba3ati-backend chat.service.js).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";

// Shape broadcast by the backend `/chat` namespace on `newMessage`.
// `sender` is the username; `senderName`/`senderColor` are optional extras the
// app sends through.
export interface ChatMessage {
  room: string;
  message: string;
  sender: string;
  senderName?: string;
  senderColor?: string | null;
  timestamp?: number;
}

/**
 * Connect to the `/chat` namespace as a silent, read-only spectator for one
 * room and stream its messages. Mirrors the app's `chatJoinRoom(roomId, true)`
 * — `isSpectator: true` makes the server drop any outgoing message, so the
 * admin can only observe. Returns a teardown function that unsubscribes and
 * disconnects.
 */
export function monitorChat(
  roomId: string,
  onMessage: (msg: ChatMessage) => void,
): () => void {
  const socket: Socket = io(`${API_BASE_URL}/chat`, {
    transports: ["websocket", "polling"],
  });

  // (Re)join on every connect so a reconnect re-subscribes to the room.
  const join = () => socket.emit("joinRoom", { room: roomId, isSpectator: true });
  socket.on("connect", join);
  socket.on("newMessage", onMessage);

  return () => {
    socket.off("newMessage", onMessage);
    socket.off("connect", join);
    socket.disconnect();
  };
}
