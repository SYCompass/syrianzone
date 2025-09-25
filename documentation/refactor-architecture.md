## Unified architecture (Turbopack + basePath)

```
                         Internet
                             |
                        Next server
                         (poll/)
                             |
          +------------------+------------------+
          |                                     |
      Next app                              Static apps
      basePath: /tierlist                   (symlinked into poll/public)
          |                                     |
   /tierlist, /tierlist/*                /, /syofficial, /party, ...
   /tierlist/api/*  (APIs)               and their assets
```

- Single runtime: Next.js in `poll` with Turbopack.
- Static subapps are symlinked into `poll/public` and served as-is.
- `basePath: "/tierlist"` confines Next pages/APIs under `/tierlist`.

### Routing rules
- Hub (static): `/` → `/index.html`
- Subapps (static): `/<app>` and `/<app>/` → `/<app>/index.html`
- Subapp assets: `/<app>/:path*` passthrough
- Global assets: `/assets`, `/styles`, `/components`, `/flag-replacer` passthrough
- API forwarder: `/api/:path*` → `/tierlist/api/:path*`

### Development and production
- Dev: `pnpm dev` (runs symlinks then `next dev --turbopack`)
- Prod: `pnpm build && pnpm start`

### Notes
- Links inside the Next app that should go to the hub `/` must use plain `<a href="/">` (not `next/link`) because of `basePath`.

