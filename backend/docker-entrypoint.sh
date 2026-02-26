#!/bin/sh
set -e

echo "⏳ Running database migrations..."
npx prisma migrate deploy

echo "✅ Migrations done. Starting server..."
exec node dist/index.js
