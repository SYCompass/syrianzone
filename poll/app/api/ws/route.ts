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
  const { 0: client, 1: server } = Object.values(new WebSocketPair());
  // @ts-expect-error - Cloudflare runtime
  const ws = server as WebSocket;
  // @ts-expect-error - Cloudflare runtime
  const c = client as WebSocket;
  ws.accept();
  subscribe(channel, ws);
  return new Response(null, { status: 101, webSocket: c });
}



