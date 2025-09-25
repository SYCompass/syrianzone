# Poll (Tierlist) App

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

Dev: `pnpm dev`
Build: `pnpm build`
Start: `pnpm start`

Notes:
- Links to the hub `/` must be plain `<a href="/">` (basePath).
- Static subapps are linked from repo root into `public/` by `scripts/link-static.mjs`.

