#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "================================================"
echo "  LifeLog — Setup & Run"
echo "================================================"

echo ""
echo "→ Installing root dependencies..."
npm install

echo ""
echo "→ Installing server dependencies..."
npm install --workspace=server

echo ""
echo "→ Installing client dependencies..."
npm install --workspace=client

echo ""
echo "→ Creating required directories..."
mkdir -p server/data output
[ -f server/data/memories.json ] || echo "[]" > server/data/memories.json

echo ""
echo "================================================"
echo "  Starting LifeLog..."
echo "  Frontend : http://localhost:5173"
echo "  Backend  : http://localhost:3001"
echo "  Press Ctrl+C to stop"
echo "================================================"
echo ""

npm run dev
