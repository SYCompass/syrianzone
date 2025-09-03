Ministers Tier Poll

Stack: Next.js App Router (TS) + tRPC (internal write API) + GraphQL Yoga (public read) + Drizzle ORM + Postgres + Upstash Redis + Cloudflare Turnstile + basic WS.

Setup

1) Env

Create `.env.local` in `poll/`:

```
DATABASE_URL=postgres://user:pass@host:5432/db
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
POLL_TIMEZONE=Europe/Amsterdam
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

2) Install

```
pnpm i
```

3) Migrate

```
pnpm drizzle:generate
pnpm drizzle:migrate
```

4) Seed

```
pnpm copy-assets
pnpm seed
```

5) Dev

```
pnpm dev
```

- tRPC: `/api/trpc`
- GraphQL: `/api/graphql`
- WS: `/api/ws?channel=poll:{pollId}:{voteDayISO}`

Cron snapshot

Deploy and configure Vercel Cron to hit `/api/cron/snapshot` at 23:59 poll TZ.

Realtime adapter

`server/realtime/broker.ts` is an in-memory pubsub for demo. Swap with Ably/Pusher or Postgres LISTEN/NOTIFY by implementing `publish(channel, message)` and `subscribe(channel, ws)` equivalents.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
