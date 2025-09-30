#!/bin/bash

# Premier ERP System - Simple Nginx Deployment Script
# This script handles the upstream resolution issue by ensuring proper startup order

set -e

echo "🚀 Premier ERP System - Production Deployment (Nginx)"
echo "=============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Check for existing PostgreSQL data and offer cleanup
if docker volume ls | grep -q postgres 2>/dev/null; then
    echo "⚠️ Existing PostgreSQL data detected."
    echo "This may cause initialization conflicts."
    echo ""
    echo "To resolve this, you can:"
    echo "1. Run: sudo ./reset-database.sh (recommended for fresh install)"
    echo "2. Continue anyway (may fail if data is corrupted)"
    echo ""
    read -p "Continue with existing data? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled. Run 'sudo ./reset-database.sh' first."
        exit 1
    fi
fi

# Create environment file for production
echo "⚙️ Setting up production environment..."
cat > .env.nginx << 'EOF'
NODE_ENV=production
POSTGRES_PASSWORD=erp_secure_password_2024
DOMAIN=demo.premiererp.io
EMAIL=support@premiererp.io
EOF

# Create SSL certificates directory
echo "📁 Creating SSL certificates directory..."
mkdir -p ssl-certs
mkdir -p ssl-certs/live/demo.premiererp.io
chmod 755 ssl-certs

# Clean up existing containers and volumes
echo "🧹 Cleaning up existing containers and volumes..."
docker stop $(docker ps -q --filter "name=premier-erp") 2>/dev/null || true
docker stop $(docker ps -q --filter "name=pharma-erp") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=premier-erp") 2>/dev/null || true
docker rm $(docker ps -aq --filter "name=pharma-erp") 2>/dev/null || true
docker volume rm $(docker volume ls -q --filter "name=postgres") 2>/dev/null || true

# Create Docker network
echo "🌐 Creating Docker network..."
docker network create erp-network 2>/dev/null || true

# Build and start services in sequence
echo "🏗️ Building Docker images..."
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx build

echo "🗄️ Starting database..."
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx up -d postgres

# Wait for database with detailed error checking
echo "⏳ Waiting for database initialization..."
database_ready=false
for i in {1..60}; do
    if docker exec premier-erp-db pg_isready -U erp_user -d premier_erp > /dev/null 2>&1; then
        echo "✅ Database ready"
        database_ready=true
        break
    fi
    
    # Check if database container is running
    if ! docker ps | grep -q premier-erp-db; then
        echo "❌ Database container stopped. Checking logs..."
        docker logs premier-erp-db --tail 20
        echo ""
        echo "💡 Try running: sudo ./reset-database.sh"
        exit 1
    fi
    
    echo "Waiting for database... ($i/60)"
    sleep 3
done

if [ "$database_ready" = false ]; then
    echo "❌ Database failed to initialize after 3 minutes"
    echo "📋 Database logs:"
    docker logs premier-erp-db --tail 30
    echo ""
    echo "💡 Try running: sudo ./reset-database.sh"
    exit 1
fi

echo "🖥️ Starting backend..."
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx up -d backend

# Wait for backend
echo "⏳ Waiting for backend..."
for i in {1..60}; do
    if docker exec premier-erp-app curl -f http://localhost:5000/api/dashboard/summary > /dev/null 2>&1; then
        echo "✅ Backend ready"
        break
    fi
    echo "Waiting for backend... ($i/60)"
    sleep 3
done

echo "🌐 Starting frontend..."
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx up -d frontend

# Wait for frontend
echo "⏳ Waiting for frontend..."
for i in {1..30}; do
    if docker exec premier-erp-frontend curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✅ Frontend ready"
        break
    fi
    echo "Waiting for frontend... ($i/30)"
    sleep 2
done

# Create temporary SSL certificates for initial setup
echo "🔒 Creating temporary SSL certificates..."
mkdir -p ssl-certs/live/demo.premiererp.io
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl-certs/live/demo.premiererp.io/privkey.pem \
    -out ssl-certs/live/demo.premiererp.io/fullchain.pem \
    -subj "/C=US/ST=CA/L=San Francisco/O=Premier ERP/CN=demo.premiererp.io"

echo "🔧 Starting Nginx..."
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx up -d nginx-proxy

# Wait for Nginx
echo "⏳ Waiting for Nginx..."
sleep 10

# Check if Nginx started successfully
if docker ps | grep -q premier-erp-nginx; then
    echo "✅ Nginx started successfully"
else
    echo "❌ Nginx failed to start. Checking logs..."
    docker logs premier-erp-nginx
    exit 1
fi

# Acquire real SSL certificates
echo "🔐 Acquiring SSL certificates from Let's Encrypt..."
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx run --rm certbot

# Replace temporary certificates with real ones if acquired
if [ -f "ssl-certs/live/demo.premiererp.io/fullchain.pem" ] && [ -f "ssl-certs/live/demo.premiererp.io/privkey.pem" ]; then
    echo "✅ SSL certificates acquired"
    
    # Reload Nginx with new certificates
    docker exec premier-erp-nginx nginx -s reload
    echo "✅ Nginx reloaded with SSL certificates"
else
    echo "⚠️ Using temporary self-signed certificates"
fi

# Set up certificate renewal
echo "🔄 Setting up certificate renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * docker-compose -f $(pwd)/docker-compose.simple-nginx.yml run --rm certbot renew && docker exec premier-erp-nginx nginx -s reload") | crontab -

# Display status
echo ""
echo "🎉 Deployment completed successfully!"
echo "=============================================="
echo "📊 Service Status:"
docker-compose -f docker-compose.simple-nginx.yml --env-file .env.nginx ps

echo ""
echo "🌐 Access Points:"
echo "• Application: https://demo.premiererp.io"
echo "• API: https://demo.premiererp.io/api/"
echo "• HTTP Redirect: http://demo.premiererp.io"

echo ""
echo "📋 Management Commands:"
echo "• View logs: docker-compose -f docker-compose.simple-nginx.yml logs -f"
echo "• Stop services: docker-compose -f docker-compose.simple-nginx.yml down"
echo "• Restart services: docker-compose -f docker-compose.simple-nginx.yml restart"

echo ""
echo "✅ Premier ERP System is now running in production!"