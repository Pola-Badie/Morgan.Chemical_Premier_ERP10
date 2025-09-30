
#!/bin/bash

echo "🚀 Premier ERP System - Production Deployment"
echo "=============================================="

# Exit on any error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_status "Node.js version: $(node -v) ✓"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

print_status "npm version: $(npm -v) ✓"

# Create logs directory
mkdir -p logs
print_status "Created logs directory"

# Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# Build the application
print_status "Building application..."
npm run build

# Copy environment file
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        print_status "Using production environment configuration"
    else
        print_warning "No .env file found. Please create one based on .env.example"
    fi
fi

# Create uploads directory
mkdir -p uploads
mkdir -p attached_assets
print_status "Created upload directories"

# Run health check
print_status "Starting health check..."
npm run start &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Check if server is running
if ! curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_error "Health check failed. Server may not be running properly."
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

print_status "Health check passed ✓"

# Stop test server
kill $SERVER_PID 2>/dev/null || true

print_status "Deployment completed successfully! 🎉"
print_status ""
print_status "To start the server:"
print_status "  npm start"
print_status ""
print_status "Server will be available at: http://localhost:5000"
