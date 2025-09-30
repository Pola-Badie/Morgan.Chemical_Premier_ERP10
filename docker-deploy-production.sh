#!/bin/bash

echo "🚀 Premier ERP System - Production Deployment with SSL"
echo "Domain: demo.premiererp.io"
echo "SSL Email: support@premiererp.io"
echo "=================================================="

# Ensure we're running as root for Docker operations
if [ "$EUID" -ne 0 ]; then
    echo "Please run with sudo"
    exit 1
fi

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker stop premier-erp-traefik premier-erp-frontend premier-erp-app premier-erp-db 2>/dev/null || true
docker rm premier-erp-traefik premier-erp-frontend premier-erp-app premier-erp-db 2>/dev/null || true

# Remove existing volumes for fresh start
echo "🗑️ Cleaning volumes..."
docker volume rm premier_postgres_data premier_letsencrypt_data 2>/dev/null || true

# Create environment file for production
echo "⚙️ Setting up production environment..."
cat > .env.production << EOF
POSTGRES_PASSWORD=erp_secure_password_2024_$(date +%s)
DOMAIN=demo.premiererp.io
SSL_EMAIL=support@premiererp.io
NODE_ENV=production
EOF

# Verify DNS resolution
echo "🌐 Checking DNS resolution for demo.premiererp.io..."
if ! nslookup demo.premiererp.io > /dev/null 2>&1; then
    echo "⚠️ Warning: demo.premiererp.io does not resolve to this server"
    echo "Please ensure your domain's A record points to this server's IP address"
    echo "You can check with: dig demo.premiererp.io"
    echo ""
    echo "Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create Docker network
echo "🌐 Creating Docker network..."
docker network create premier-erp-network 2>/dev/null || true

# Start production deployment
echo "🚀 Starting production deployment..."
docker-compose -f docker-compose.production.yml --env-file .env.production up --build -d

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Check container status
echo "📋 Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Wait for SSL certificate acquisition
echo "🔒 Waiting for SSL certificate acquisition..."
echo "This may take up to 2 minutes for Let's Encrypt to issue the certificate..."
sleep 60

# Test HTTPS connectivity
echo "🔍 Testing HTTPS connectivity..."
if curl -sL --max-time 10 https://demo.premiererp.io > /dev/null 2>&1; then
    echo "✅ Premier ERP System is running successfully with SSL!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Production URL: https://demo.premiererp.io"
    echo "   Traefik Dashboard: http://$(hostname -I | awk '{print $1}'):8080"
    echo ""
    echo "🔒 SSL Certificate:"
    echo "   Automatically managed by Let's Encrypt"
    echo "   Email: support@premiererp.io"
    echo "   Auto-renewal enabled"
    echo ""
    echo "📊 API Endpoints:"
    echo "   Dashboard: https://demo.premiererp.io/api/dashboard/summary"
    echo "   Health: https://demo.premiererp.io/api/health"
else
    echo "⚠️ HTTPS not yet available. This is normal during initial deployment."
    echo "SSL certificate acquisition may take a few more minutes."
    echo ""
    echo "📝 Check status with:"
    echo "   docker logs premier-erp-traefik"
    echo "   docker logs premier-erp-frontend"
    echo "   docker logs premier-erp-app"
    echo ""
    echo "🌐 Try accessing: https://demo.premiererp.io (may take 2-5 minutes)"
fi

echo ""
echo "🛠️ Management Commands:"
echo "   docker logs premier-erp-traefik    # View reverse proxy logs"
echo "   docker logs premier-erp-frontend   # View frontend logs"
echo "   docker logs premier-erp-app        # View backend logs"
echo "   docker logs premier-erp-db         # View database logs"
echo ""
echo "🔄 To restart all services:"
echo "   docker-compose -f docker-compose.production.yml --env-file .env.production restart"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose -f docker-compose.production.yml down"