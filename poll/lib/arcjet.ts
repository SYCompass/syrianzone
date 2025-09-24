import arcjet, { fixedWindow } from "@arcjet/sdk";

// Arcjet client with simple 1 request per minute rule
export const aj = arcjet({
  key: process.env.ARCJET_KEY || "",
  rules: [
    fixedWindow({
      max: 1,
      window: "1m",
    }),
  ],
});


