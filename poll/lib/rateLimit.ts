import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : undefined as unknown as Redis;

export const rateLimit10PerMin = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "1 m"), analytics: false, prefix: "rate:ballot" })
  : ({ limit: async () => ({ success: true }) } as unknown as Ratelimit);

export const rateLimit1PerMin = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(1, "1 m"), analytics: false, prefix: "rate:ballot:1m" })
  : ({ limit: async () => ({ success: true }) } as unknown as Ratelimit);


