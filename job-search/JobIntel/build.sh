#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building backend..."
npm run build:backend

echo "Build completed successfully!"
