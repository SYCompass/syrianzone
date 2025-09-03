const channels = new Map<string, Set<WebSocket>>();

export function subscribe(channel: string, ws: WebSocket) {
  let set = channels.get(channel);
  if (!set) {
    set = new Set();
    channels.set(channel, set);
  }
  set.add(ws);
  ws.addEventListener("close", () => {
    set?.delete(ws);
    if (set && set.size === 0) channels.delete(channel);
  });
}

export function publish(channel: string, message: unknown) {
  const data = JSON.stringify(message);
  const set = channels.get(channel);
  if (!set) return;
  for (const ws of set) {
    try {
      ws.send(data);
    } catch {}
  }
}


