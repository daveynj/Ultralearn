#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

console.log('🚀 Setting up Ultralearn database...');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

try {
  console.log('📝 Creating Prisma migration...');
  execSync('npx prisma migrate dev --name init', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('✅ Migration created successfully');
  console.log('✅ Schema applied to database');

  console.log('');
  console.log('✅ Database setup complete!');
  console.log('');
  console.log('Your database tables:');
  console.log('  - users (authentication & profiles)');
  console.log('  - courses');
  console.log('  - modules');
  console.log('  - lessons');
  console.log('  - quizzes');
  console.log('  - questions');
  console.log('  - userProgress');
  console.log('  - bookmarks');
  console.log('  - notes');
  console.log('  - chatMessages');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
