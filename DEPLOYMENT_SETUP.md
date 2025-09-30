# Syrian Zone Monorepo Deployment Setup

This document outlines the setup for deploying both the `/poll` and `/syrian-contributors` apps from the same monorepo using Coolify.

## Setup Summary

The monorepo has been configured to run both Next.js applications:
- **Poll app**: Serves the main site from domain root (`/`)
- **Syrian Contributors app**: Serves from `/syriangit` path on port 3001

## Configuration Changes Made

### 1. Root Package.json Updates
- Added workspace configuration for both `poll` and `syrian-contributors`
- Updated build and start scripts to handle both applications
- Added reverse proxy script integration

### 2. Syrian Contributors App Changes
- Modified `next.config.mjs` to use `basePath: '/syriangit'` and `assetPrefix: '/syriangit'`
- Updated start script to run on port 3001 instead of port 80

### 3. Reverse Proxy Setup
- Created `reverse-proxy.js` to route traffic:
  - `/syriangit/*` → Syrian Contributors app (port 3001)
  - `/*` → Poll app (port 3000)

### 4. Nixpacks Configuration
- Created `nixpacks.toml` for automated deployment with proper build phases

## Coolify Deployment Settings

Use these exact settings in your Coolify deployment:

### Basic Settings
- **Base Directory**: `/`
- **Publish Directory**: `/`
- **Port**: `3000` (exposed and mapped as 3000:3000)

### Build Settings (Nixpacks)
- **Install Command**:
  ```bash
  pnpm i --no-frozen-lockfile && cd poll && pnpm i --frozen-lockfile && cd ../syrian-contributors && pnpm i --frozen-lockfile
  ```

- **Build Command**:
  ```bash
  pnpm -C poll -s link:static && pnpm build:poll && pnpm build:syrian-contributors
  ```

- **Start Command**:
  ```bash
  node reverse-proxy.js
  ```

## URL Structure

After deployment:
- **Main site (Poll app)**: `https://yourdomain.com/`
- **Syrian Contributors**: `https://yourdomain.com/syriangit`

## Development vs Production

### Development
- Poll app: `pnpm dev` (from root)
- Syrian Contributors app: `pnpm dev` (from syrian-contributors directory)

### Production Deployment
The nixpacks configuration handles the full build and deployment process automatically.

## File Structure
```
/run/media/hadi/SSD2/Coding/syrianzone/
├── poll/                    # Main poll application
├── syrian-contributors/     # Contributors leaderboard app
├── reverse-proxy.js         # Routes traffic between apps
├── nixpacks.toml           # Deployment configuration
└── package.json            # Updated with workspace config
```

## Next Steps

1. **Deploy to Coolify** using the settings above
2. **Test both applications**:
   - Main site should load at domain root
   - Syrian Contributors should load at `/syriangit`
3. **Update any hardcoded URLs** in the applications if needed
4. **Monitor deployment logs** to ensure both apps start correctly

## Troubleshooting

If you encounter issues:
1. Check that both apps build successfully
2. Verify the reverse proxy is routing correctly
3. Ensure port 3001 is accessible within the container
4. Check application logs for any path-related errors
