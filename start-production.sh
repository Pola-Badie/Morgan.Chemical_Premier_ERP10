
#!/bin/bash

echo "🚀 Starting Premier ERP System in Production Mode..."

# Set environment
export NODE_ENV=production
export PORT=5000

# Install dependencies
npm ci --only=production

# Build frontend
npm run build

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production

# Show status
pm2 status
pm2 logs premier-erp --lines 50

echo "✅ Premier ERP System is running in production mode"
echo "🌐 Access at: http://localhost:5000"
