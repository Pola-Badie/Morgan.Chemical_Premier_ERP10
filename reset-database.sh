#!/bin/bash

# Premier ERP System - Database Reset Script
# This script cleans up the PostgreSQL volume and prepares for fresh initialization

set -e

echo "🗄️ Premier ERP Database Reset"
echo "==============================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Stop all related containers
echo "Stopping Premier ERP containers..."
docker stop premier-erp-db premier-erp-app premier-erp-frontend premier-erp-nginx premier-erp-certbot 2>/dev/null || true

# Remove containers
echo "Removing containers..."
docker rm premier-erp-db premier-erp-app premier-erp-frontend premier-erp-nginx premier-erp-certbot 2>/dev/null || true

# Remove PostgreSQL volumes
echo "Removing PostgreSQL data volumes..."
docker volume rm $(docker volume ls -q | grep -E "(postgres|erp.*postgres)" | head -10) 2>/dev/null || true

# Clean up any remaining data directories
echo "Cleaning up local data directories..."
rm -rf ./postgres-data 2>/dev/null || true

# Remove and recreate network
echo "Resetting Docker network..."
docker network rm erp-network 2>/dev/null || true
docker network create erp-network

echo "✅ Database reset completed successfully"
echo "You can now run the deployment script for a fresh installation."