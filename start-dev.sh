
#!/bin/bash

echo "🚀 Starting Premier ERP System Development Environment"

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "On Ubuntu/Debian: sudo systemctl start postgresql"
    echo "On macOS: brew services start postgresql"
    exit 1
fi

# Setup database
echo "📊 Setting up database..."
node setup-database.js

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting development server..."
npm run dev
