#!/bin/bash
# Memory optimization script for Premier ERP

echo "Starting memory optimization for Premier ERP..."

# 1. Run memory cleanup API
echo "Running memory cleanup..."
curl -X POST http://localhost:5000/api/memory-cleanup -H "Content-Type: application/json" -s | jq '.'

# 2. Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force 2>/dev/null

# 3. Remove unused node_modules
echo "Removing development dependencies..."
cd /home/runner/workspace
# Keep only production dependencies
npm prune --production 2>/dev/null

# 4. Clear temporary files
echo "Clearing temporary files..."
rm -rf /tmp/*
rm -rf ./temp/*
rm -rf ./uploads/temp/*

# 5. Show memory status
echo "Current memory status:"
free -m | grep Mem | awk '{printf "Total: %sMB, Used: %sMB, Free: %sMB, Usage: %.1f%%\n", $2, $3, $4, ($3/$2)*100}'

echo "Memory optimization complete!"