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
  // @ts-expect-error - WebSocketPair is available only in Edge runtime
  const { 0: client, 1: server } = Object.values(new WebSocketPair());
  const ws = server as WebSocket;
  const c = client as WebSocket;
  (ws as unknown as { accept: () => void }).accept();
  subscribe(channel, ws);
  // Cast to any to allow Edge-only 'webSocket' option without TS DOM type support
  return new Response(null, { status: 101, webSocket: c } as any);
}



