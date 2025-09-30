#!/bin/bash

echo "🚀 Premier ERP System - Nginx Production Deployment"
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
docker stop premier-erp-nginx premier-erp-certbot premier-erp-frontend premier-erp-app premier-erp-db 2>/dev/null || true
docker rm premier-erp-nginx premier-erp-certbot premier-erp-frontend premier-erp-app premier-erp-db 2>/dev/null || true

# Remove existing volumes for fresh start
echo "🗑️ Cleaning volumes..."
docker volume rm premier_postgres_data premier_certbot_webroot 2>/dev/null || true

# Create SSL certificates directory
echo "📁 Setting up SSL certificate directories..."
mkdir -p ssl-certs
chmod 755 ssl-certs

# Create environment file for production
echo "⚙️ Setting up production environment..."
cat > .env.nginx << EOF
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

# Start initial deployment without SSL
echo "🚀 Starting initial deployment..."
docker-compose -f docker-compose.nginx.yml --env-file .env.nginx up -d postgres

# Wait for database
echo "⏳ Waiting for database to initialize..."
sleep 15

# Start backend
docker-compose -f docker-compose.nginx.yml --env-file .env.nginx up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if docker exec premier-erp-app curl -f http://localhost:5000/api/dashboard/summary > /dev/null 2>&1; then
        echo "✅ Backend is ready"
        break
    fi
    echo "Waiting for backend... ($i/30)"
    sleep 2
done

# Start frontend
docker-compose -f docker-compose.nginx.yml --env-file .env.nginx up -d frontend

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..20}; do
    if docker exec premier-erp-frontend curl -f http://localhost:80 > /dev/null 2>&1; then
        echo "✅ Frontend is ready"
        break
    fi
    echo "Waiting for frontend... ($i/20)"
    sleep 2
done

# Create temporary nginx config for certificate acquisition
echo "🔒 Setting up temporary Nginx for SSL certificate acquisition..."
cat > nginx-temp.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name demo.premiererp.io;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            proxy_pass http://premier-erp-frontend:80;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# Start temporary nginx
docker run -d --name premier-erp-nginx-temp \
    --network premier-erp-network \
    -p 80:80 \
    -v $(pwd)/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
    -v certbot_webroot:/var/www/certbot \
    nginx:alpine

echo "🔐 Acquiring SSL certificate..."
sleep 5

# Acquire SSL certificate
docker run --rm \
    --network premier-erp-network \
    -v $(pwd)/ssl-certs:/etc/letsencrypt \
    -v certbot_webroot:/var/www/certbot \
    certbot/certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email support@premiererp.io \
    --agree-tos \
    --no-eff-email \
    -d demo.premiererp.io

# Stop temporary nginx
docker stop premier-erp-nginx-temp
docker rm premier-erp-nginx-temp

# Start production nginx with SSL
echo "🌐 Starting production Nginx with SSL..."
docker run -d --name premier-erp-nginx \
    --network premier-erp-network \
    -p 80:80 -p 443:443 \
    -v $(pwd)/nginx-production.conf:/etc/nginx/nginx.conf:ro \
    -v $(pwd)/ssl-certs:/etc/nginx/ssl:ro \
    -v certbot_webroot:/var/www/certbot:ro \
    --restart unless-stopped \
    nginx:alpine

# Wait for nginx to start
echo "⏳ Waiting for Nginx to start..."
sleep 15

# Set up automatic certificate renewal
echo "🔄 Setting up automatic certificate renewal..."
cat > renew-certs.sh << 'EOF'
#!/bin/bash
docker run --rm \
    --network premier-erp-network \
    -v $(pwd)/ssl-certs:/etc/letsencrypt \
    -v certbot_webroot:/var/www/certbot \
    certbot/certbot renew --quiet

docker exec premier-erp-nginx nginx -s reload
EOF

chmod +x renew-certs.sh

# Add to crontab for automatic renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /$(pwd)/renew-certs.sh") | crontab -

# Check container status
echo "📋 Checking container status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test HTTPS connectivity
echo "🔍 Testing HTTPS connectivity..."
sleep 10

if curl -sL --max-time 10 https://demo.premiererp.io > /dev/null 2>&1; then
    echo "✅ Premier ERP System is running successfully with SSL!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Production URL: https://demo.premiererp.io"
    echo "   HTTP redirect: http://demo.premiererp.io (redirects to HTTPS)"
    echo ""
    echo "🔒 SSL Certificate:"
    echo "   Provider: Let's Encrypt"
    echo "   Email: support@premiererp.io" 
    echo "   Auto-renewal: Configured (daily check at 12:00)"
    echo ""
    echo "📊 API Endpoints:"
    echo "   Dashboard: https://demo.premiererp.io/api/dashboard/summary"
    echo "   Health: https://demo.premiererp.io/api/health"
else
    echo "⚠️ HTTPS not yet available. Checking status..."
    echo ""
    echo "📝 Check logs with:"
    echo "   docker logs premier-erp-nginx"
    echo "   docker logs premier-erp-frontend" 
    echo "   docker logs premier-erp-app"
    echo ""
    echo "🌐 Try accessing: https://demo.premiererp.io"
fi

echo ""
echo "🛠️ Management Commands:"
echo "   docker logs premier-erp-nginx      # View nginx logs"
echo "   docker logs premier-erp-frontend   # View frontend logs"
echo "   docker logs premier-erp-app        # View backend logs"
echo "   docker logs premier-erp-db         # View database logs"
echo ""
echo "🔄 Certificate renewal:"
echo "   ./renew-certs.sh                   # Manual renewal"
echo "   crontab -l                         # View auto-renewal schedule"
echo ""
echo "🛑 To stop all services:"
echo "   docker stop premier-erp-nginx premier-erp-frontend premier-erp-app premier-erp-db"