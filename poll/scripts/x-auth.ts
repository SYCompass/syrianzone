import { writeFileSync, readFileSync, mkdirSync } from "fs";
import { join } from "path";
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const STORE_DIR = join(process.cwd(), "tmp");
const STORE_FILE = join(STORE_DIR, "x-oauth2.json");

type Store = { state: string; codeVerifier: string; redirectUri: string };

function saveStore(data: Store) {
  mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
}

function loadStore(): Store {
  const raw = readFileSync(STORE_FILE, "utf8");
  return JSON.parse(raw) as Store;
}

async function init() {
  const clientId = process.env.TWITTER_CLIENT_ID || "";
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || "";
  const redirectUri = process.env.TWITTER_REDIRECT_URI || "https://syrian.zone/oauth/x/callback";
  if (!clientId || !clientSecret) throw new Error("Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
  const client = new TwitterApi({ clientId, clientSecret });
  const scope = ["tweet.read", "tweet.write", "users.read", "offline.access"];
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(redirectUri, { scope, state: Math.random().toString(36).slice(2) });
  saveStore({ state, codeVerifier, redirectUri });
  console.log("Open this URL in a browser and authorize the app:\n\n" + url + "\n\nThen run: pnpm x:auth:exchange <code> <state>");
}

async function exchange(code: string, stateInput?: string) {
  const { state, codeVerifier, redirectUri } = loadStore();
  if (stateInput && stateInput !== state) {
    throw new Error("State mismatch. Expected " + state + ", got " + stateInput);
  }
  const clientId = process.env.TWITTER_CLIENT_ID || "";
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) throw new Error("Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET");
  const client = new TwitterApi({ clientId, clientSecret });
  const { client: loggedClient, accessToken, refreshToken, expiresIn, scope } = await client.loginWithOAuth2({ code, codeVerifier, redirectUri });
  console.log("Success. Save this refresh token to .env.local as TWITTER_OAUTH2_REFRESH_TOKEN=\n\n" + refreshToken + "\n");
  console.log("Optional info:", { expiresIn, scope });
  // Try a no-op call to verify
  const me = await loggedClient.v2.me();
  console.log("Authenticated as:", me.data?.username || me.data?.name || me.data?.id);
}

async function main() {
  const sub = process.argv[2];
  if (sub === "init") {
    await init();
    return;
  }
  if (sub === "exchange") {
    const code = process.argv[3];
    const state = process.argv[4];
    if (!code) throw new Error("Usage: pnpm x:auth:exchange <code> [state]");
    await exchange(code, state);
    return;
  }
  console.log("Usage:\n pnpm x:auth:init\n pnpm x:auth:exchange <code> [state]");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


