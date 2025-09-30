# Monorepo Deployment Setup - Task List

## Completed Tasks

- [x] Set up workspace configuration in root package.json
- [x] Update build scripts to handle both applications
- [x] Configure syrian-contributors app with basePath '/syriangit'
- [x] Create reverse proxy script for routing traffic
- [x] Create nixpacks.toml configuration for deployment
- [x] Update syrian-contributors to run on port 3001
- [x] Fix nixpacks configuration by removing incorrect package specifications
- [x] Fix syrian-contributors lockfile issue by using --no-frozen-lockfile
- [x] Fix port conflicts by assigning different ports to each app
- [x] Create deployment documentation

## In Progress Tasks

- [ ] Test deployment configuration locally
- [ ] Deploy to Coolify with new settings
- [ ] Verify both applications are accessible

## Future Tasks

- [ ] Monitor application performance
- [ ] Update CI/CD pipeline if needed
- [ ] Add health checks for both applications

## Implementation Details

### Files Modified/Created:
- ✅ `/package.json` - Added workspace config and updated scripts
- ✅ `/syrian-contributors/next.config.mjs` - Added basePath and assetPrefix
- ✅ `/syrian-contributors/package.json` - Updated port configuration
- ✅ `/reverse-proxy.js` - New reverse proxy script
- ✅ `/nixpacks.toml` - New deployment configuration
- ✅ `/DEPLOYMENT_SETUP.md` - Documentation

### Technical Approach:
- Both Next.js apps run in the same container
- Poll app serves from port 3000 (domain root)
- Syrian Contributors app serves from port 3001 with basePath '/syriangit'
- Reverse proxy routes `/syriangit/*` requests to the Contributors app
- All other requests go to the Poll app

### Deployment Commands:
- **Install**: `pnpm i --no-frozen-lockfile && cd poll && pnpm i --frozen-lockfile && cd ../syrian-contributors && pnpm i --frozen-lockfile`
- **Build**: `pnpm -C poll -s link:static && pnpm build:poll && pnpm build:syrian-contributors`
- **Start**: `node reverse-proxy.js`
