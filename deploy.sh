#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Deployment..."

# 1. Environment Setup
echo "🔑 Checking environment files..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Action Required: Update backend/.env with production database credentials!"
fi

if [ ! -f "frontend/.env" ]; then
    # Create frontend .env if it doesn't exist
    # Note: frontend example might be .env.local or .env.example
    if [ -f "frontend/.env.example" ]; then
        cp frontend/.env.example frontend/.env
    elif [ -f "frontend/.env.local.example" ]; then
        cp frontend/.env.local.example frontend/.env
    else
        touch frontend/.env
    fi
    echo "⚠️  Action Required: Update frontend/.env with production API URLs!"
fi

# 3. Backend Deployment (Laravel)
echo "🐘 Deploying Backend (Laravel)..."
cd backend

# Install PHP dependencies
composer install --no-dev --optimize-autoloader

# Run migrations (only if DB is configured)
if grep -q "DB_DATABASE=laravel" .env; then
    echo "⚠️  Skipping migrations: Default database name detected. Please update .env"
else
    php artisan migrate --force
fi

# Optimize caches
php artisan optimize

cd ..

# 4. Frontend Deployment (Next.js)
echo "⚛️  Deploying Frontend (Next.js)..."
cd frontend

# Install Node dependencies
npm install

# Build the Next.js application
npm run build

# 5. Restart PM2 process
echo "🔄 Reloading PM2..."
pm2 startOrReload ../ecosystem.config.js

cd ..

# 6. Final Permissions Check
# Ensure all files are owned by the syrian user to prevent permission issues
echo "🔑 Correcting ownership to syrian:syrian..."
sudo chown -R syrian:syrian .

echo "✅ Deployment Finished Successfully!"
