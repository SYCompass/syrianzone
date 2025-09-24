import arcjet, { tokenBucket } from "@arcjet/next";

// Arcjet client with simple 1 request per minute rule (per IP)
export const aj = arcjet({
  key: process.env.ARCJET_KEY || "",
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 1, // 1 token per interval
      interval: 60,  // seconds
      capacity: 1,   // no burst
    }),
  ],
});


