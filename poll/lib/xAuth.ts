import { TwitterApi } from "twitter-api-v2";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const REFRESH_KEY = "x:oauth2:refresh";
const STORE_KEY = "x:oauth2:init"; // hash: { state, codeVerifier, redirectUri }

type Store = { state: string; codeVerifier: string; redirectUri: string };

function getClientCreds(): { clientId: string; clientSecret: string } {
  const clientId = process.env.TWITTER_CLIENT_ID || "";
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || "";
  return { clientId, clientSecret };
}

export async function startOAuth(redirectUri: string) {
  const { clientId, clientSecret } = getClientCreds();
  if (!clientId || !clientSecret) throw new Error("Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
  const client = new TwitterApi({ clientId, clientSecret });
  const scope = ["tweet.read", "tweet.write", "users.read", "offline.access"];
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(redirectUri, { scope, state: Math.random().toString(36).slice(2) });
  await redis.hset(STORE_KEY, { state, codeVerifier, redirectUri } satisfies Store);
  return { url, state };
}

export async function finishOAuth(code: string, stateInput?: string) {
  const data = (await redis.hgetall(STORE_KEY)) as unknown as Store | null;
  if (!data) throw new Error("OAuth init store not found");
  if (stateInput && stateInput !== data.state) throw new Error("State mismatch");
  const { clientId, clientSecret } = getClientCreds();
  if (!clientId || !clientSecret) throw new Error("Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
  const client = new TwitterApi({ clientId, clientSecret });
  const { client: loggedClient, refreshToken } = await client.loginWithOAuth2({ code, codeVerifier: data.codeVerifier, redirectUri: data.redirectUri });
  await redis.set(REFRESH_KEY, refreshToken);
  await redis.del(STORE_KEY);
  // Best-effort identity probe
  try {
    const me = await loggedClient.v2.me();
    return { ok: true, user: me.data?.username || me.data?.id };
  } catch {
    return { ok: true };
  }
}

export async function getReadWriteClient() {
  const { clientId, clientSecret } = getClientCreds();
  if (!clientId || !clientSecret) return null;
  const envFallback = process.env.TWITTER_OAUTH2_REFRESH_TOKEN || "";
  const stored = (await redis.get<string>(REFRESH_KEY)) || envFallback;
  if (!stored) return null;
  const oauth2Client = new TwitterApi({ clientId, clientSecret });
  const { client, refreshToken } = await oauth2Client.refreshOAuth2Token(stored);
  if (refreshToken && refreshToken !== stored) await redis.set(REFRESH_KEY, refreshToken);
  return client;
}

export async function hasRefreshToken(): Promise<boolean> {
  const v = await redis.get<string>(REFRESH_KEY);
  return !!v;
}


