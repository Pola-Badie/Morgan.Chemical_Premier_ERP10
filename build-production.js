#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Building production version...');

try {
  // Step 1: Build client with Vite (this should work)
  console.log('📦 Building client...');
  execSync('npm run build:client', { stdio: 'inherit' });
  
  // Step 2: Copy server files directly without TypeScript compilation
  console.log('📁 Copying server files...');
  
  // Create dist/server directory
  if (!fs.existsSync('dist/server')) {
    fs.mkdirSync('dist/server', { recursive: true });
  }
  
  // Copy all server files and rename .ts to .js
  const copyServerFiles = (srcDir, destDir) => {
    const items = fs.readdirSync(srcDir);
    
    for (const item of items) {
      const srcPath = path.join(srcDir, item);
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        const destSubDir = path.join(destDir, item);
        if (!fs.existsSync(destSubDir)) {
          fs.mkdirSync(destSubDir, { recursive: true });
        }
        copyServerFiles(srcPath, destSubDir);
      } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
        // Copy .ts file as .js and update imports
        const destPath = path.join(destDir, item.replace('.ts', '.js'));
        let content = fs.readFileSync(srcPath, 'utf8');
        
        // Remove TypeScript syntax and update imports
        // Remove TypeScript type annotations from imports
        content = content.replace(/import\s+([^,{]+),\s*{\s*type\s+[^}]+\s*}\s+from/g, 'import $1 from');
        content = content.replace(/import\s*{\s*type\s+[^}]+,?\s*([^}]*)\s*}\s*from/g, (match, rest) => {
          if (rest.trim()) {
            return `import { ${rest.trim()} } from`;
          } else {
            return '// Type-only import removed';
          }
        });
        
        // Remove standalone type imports
        content = content.replace(/import\s*{\s*type\s+[^}]+\s*}\s+from[^;]+;/g, '// Type-only import removed');
        
        // Remove type annotations from function parameters (more precise patterns)
        // Only match function parameters, not object properties
        content = content.replace(/(\(.*?)(\w+):\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|\s]*(?=[,)])/g, '$1$2');
        content = content.replace(/(function\s+\w+\s*\([^)]*?)(\w+):\s*[a-zA-Z_$][a-zA-Z0-9_$<>[\]|\s]*(?=[,)])/g, '$1$2');
        
        // Remove return type annotations
        content = content.replace(/\):\s*[A-Z][a-zA-Z<>[\]|\s]*\s*=>/g, ') =>');
        content = content.replace(/\):\s*[A-Z][a-zA-Z<>[\]|\s]*\s*{/g, ') {');
        
        // Update import statements to use .js extensions
        content = content.replace(/from ['"](\.[^'"]*?)['"];/g, (match, importPath) => {
          if (!importPath.endsWith('.js') && !importPath.includes('.')) {
            return match.replace(importPath, importPath + '.js');
          }
          return match.replace(/\.ts(['"])/g, '.js$1');
        });
        
        fs.writeFileSync(destPath, content);
      } else if (!item.endsWith('.ts')) {
        // Copy non-TypeScript files as-is
        const destPath = path.join(destDir, item);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyServerFiles('server', 'dist/server');
  
  // Copy shared directory
  if (fs.existsSync('shared')) {
    if (!fs.existsSync('dist/shared')) {
      fs.mkdirSync('dist/shared', { recursive: true });
    }
    copyServerFiles('shared', 'dist/shared');
  }
  
  console.log('✅ Production build completed successfully!');
  console.log('📁 Generated files:');
  console.log('  - dist/server/index.js (production server)');
  console.log('  - dist/index.html (client app)');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}