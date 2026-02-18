#!/bin/bash

# Database Setup Script for Ultralearn
# This script creates the Prisma migration and applies the schema to Neon

echo "🚀 Setting up Ultralearn database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "📝 Creating Prisma migration..."
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
  echo "✅ Migration created successfully"
  echo "✅ Schema applied to database"
else
  echo "❌ Migration failed"
  exit 1
fi

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Your database tables:"
echo "  - users (authentication & profiles)"
echo "  - courses"
echo "  - modules"
echo "  - lessons"
echo "  - quizzes"
echo "  - questions"
echo "  - userProgress"
echo "  - bookmarks"
echo "  - notes"
echo "  - chatMessages"
