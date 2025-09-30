#!/bin/bash

echo "🚀 Premier ERP System - Full Stack Docker Deployment"
echo "=================================================="

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
sudo docker stop premier-erp-frontend premier-erp-app premier-erp-db 2>/dev/null || true
sudo docker rm premier-erp-frontend premier-erp-app premier-erp-db 2>/dev/null || true

# Remove existing volumes to fix database initialization
echo "🗑️ Cleaning database volumes..."
sudo docker volume rm premier_postgres_data 2>/dev/null || true

# Create Docker network
echo "🌐 Creating Docker network..."
sudo docker network create premier-erp-network 2>/dev/null || true

# Start PostgreSQL
echo "🗄️ Starting PostgreSQL database..."
sudo docker run -d \
  --name premier-erp-db \
  --network premier-erp-network \
  -e POSTGRES_DB=premier_erp \
  -e POSTGRES_USER=erp_user \
  -e POSTGRES_PASSWORD=erp_secure_password \
  -p 5432:5432 \
  -v premier_postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Wait for database to be ready
echo "⏳ Waiting for database to initialize..."
sleep 15

# Build and start backend
echo "🔨 Building Premier ERP backend..."
sudo docker build -t premier-erp-backend .

echo "🚀 Starting Premier ERP backend..."
sudo docker run -d \
  --name premier-erp-app \
  --network premier-erp-network \
  -e NODE_ENV=production \
  -e DATABASE_URL= 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
=postgresql://erp_user:erp_secure_password@premier-erp-db:5432/premier_erp \
  -e PORT=5000 \
  -p 5000:5000 \
  premier-erp-backend

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Build and start frontend
echo "🔨 Building Premier ERP frontend with Nginx..."
sudo docker build -f Dockerfile.frontend -t premier-erp-frontend .

echo "🌐 Starting Premier ERP frontend..."
sudo docker run -d \
  --name premier-erp-frontend \
  --network premier-erp-network \
  -p 80:80 \
  premier-erp-frontend

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 10

# Check status
echo "📋 Checking container status..."
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Test connectivity
echo "🔍 Testing connectivity..."
if curl -s http://localhost/api/dashboard/summary > /dev/null; then
    echo "✅ Premier ERP System is running successfully!"
    echo ""
    echo "🌐 Access your application:"
    echo "   Full Application: http://localhost"
    echo "   Backend API:      http://localhost:5000"
    echo "   Database:         localhost:5432"
    echo ""
    echo "📊 Available endpoints:"
    echo "   Frontend:         http://localhost"
    echo "   API Dashboard:    http://localhost/api/dashboard/summary"
    echo "   Direct Backend:   http://localhost:5000/api/dashboard/summary"
else
    echo "⚠️ Application may still be starting..."
    echo "📝 Check logs with:"
    echo "   sudo docker logs premier-erp-frontend"
    echo "   sudo docker logs premier-erp-app"
fi

echo ""
echo "🛠️ Management Commands:"
echo "   sudo docker logs premier-erp-frontend  # View frontend logs"
echo "   sudo docker logs premier-erp-app       # View backend logs"
echo "   sudo docker logs premier-erp-db        # View database logs"
echo "   sudo docker stop premier-erp-frontend  # Stop frontend"
echo "   sudo docker stop premier-erp-app       # Stop backend"
echo "   sudo docker stop premier-erp-db        # Stop database"