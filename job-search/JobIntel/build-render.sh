#!/bin/sh
set -e

echo "🔍 Render Monorepo Build Script"
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# Step 1: Install all dependencies from ROOT
echo "📦 Installing dependencies from root package-lock.json..."
cd /opt/build
npm ci

# Step 2: Build backend workspace
echo "🏗️  Building backend service..."
npm run build -w backend

echo "✅ Build completed successfully!"
