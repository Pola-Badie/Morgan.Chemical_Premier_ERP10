#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Starting for Railway...');

try {
  // Build client assets
  console.log('🌐 Building client...');
  execSync('npm run build:client', { stdio: 'inherit' });

  // Start server using tsx (no TypeScript compilation needed)
  console.log('⚡ Starting production server with tsx...');
  execSync('NODE_ENV=production npx tsx server/index.production.ts', { stdio: 'inherit' });

} catch (error) {
  console.error('❌ Start failed:', error.message);
  process.exit(1);
}