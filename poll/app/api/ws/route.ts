import { subscribe } from "@/server/realtime/broker";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel");
  if (!channel) return new Response("Missing channel", { status: 400 });
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected websocket", { status: 426 });
  }
  const pair = new (globalThis as any).WebSocketPair();
  const client = pair[0] as WebSocket;
  const server = pair[1] as WebSocket;
  (server as any).accept();
  subscribe(channel, server);
  return new Response(null, { status: 101, webSocket: client } as any);
}



