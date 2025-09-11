#!/bin/bash

echo "🚀 Railway Database Migration Script"
echo "=================================="

# Set environment variables for Railway
export DATABASE_URL="postgresql://postgres:yeGIOHjGTAthVaeVodcHBgQEPayCtQTX@postgres.railway.internal:5432/railway"

echo "📊 Generating Prisma client..."
npx prisma generate

echo "🗃️ Deploying database migrations..."
npx prisma migrate deploy

echo "🌱 Running database seed (if needed)..."
npx prisma db seed

echo "✅ Railway deployment complete!"