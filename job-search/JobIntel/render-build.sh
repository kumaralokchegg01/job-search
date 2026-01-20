#!/bin/bash
set -e

echo "🔍 Running monorepo build..."
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo "📦 Installing dependencies from root..."
npm ci

echo "🏗️  Building backend workspace..."
npm run build -w backend

echo "✅ Build completed successfully!"
