#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building for Railway deployment...');

try {
  // Step 1: Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Step 2: Compile TypeScript to JavaScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // Step 3: Resolve path aliases
  console.log('🔗 Resolving path aliases...');
  execSync('npx tsc-alias -p tsconfig.json', { stdio: 'inherit' });

  // Step 4: Build client (if needed)
  console.log('🌐 Building client...');
  execSync('npm run build:client', { stdio: 'inherit' });

  // Step 5: Ensure the correct entry file exists
  const sourceFile = 'dist/server/index.production.js';
  const targetFile = 'dist/server/index.js';
  
  if (fs.existsSync(sourceFile) && !fs.existsSync(targetFile)) {
    console.log('📁 Creating symlink for Railway compatibility...');
    fs.copyFileSync(sourceFile, targetFile);
  }

  console.log('✅ Railway build completed successfully!');
  console.log('📄 Entry points created:');
  console.log(`   - ${sourceFile}`);
  console.log(`   - ${targetFile}`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}