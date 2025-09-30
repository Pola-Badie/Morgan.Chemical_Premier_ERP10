#!/bin/bash

# Verify Frontend Build and Nginx Configuration

echo "Verifying Premier ERP Frontend Build and Serving..."

# Check if frontend container has built files
echo "1. Checking frontend container contents..."
docker exec premier-erp-frontend ls -la /usr/share/nginx/html/

# Check for index.html
echo -e "\n2. Verifying index.html exists..."
if docker exec premier-erp-frontend test -f /usr/share/nginx/html/index.html; then
    echo "✅ index.html found"
    echo "Content preview:"
    docker exec premier-erp-frontend head -10 /usr/share/nginx/html/index.html
else
    echo "❌ index.html not found"
fi

# Check for CSS and JS assets
echo -e "\n3. Checking for CSS and JS assets..."
docker exec premier-erp-frontend find /usr/share/nginx/html -name "*.css" -o -name "*.js" | head -5

# Test frontend container directly
echo -e "\n4. Testing frontend container response..."
if docker exec premier-erp-frontend curl -s http://localhost:80 | grep -q "Premier ERP\|React\|<!DOCTYPE html>"; then
    echo "✅ Frontend container serves HTML content"
else
    echo "❌ Frontend container not serving proper content"
fi

# Check Nginx configuration in frontend container
echo -e "\n5. Checking frontend Nginx configuration..."
docker exec premier-erp-frontend nginx -t

# Test reverse proxy routing
echo -e "\n6. Testing reverse proxy routing to frontend..."
if docker exec premier-erp-nginx wget -q -O - http://premier-erp-frontend:80 | grep -q "<!DOCTYPE html>"; then
    echo "✅ Reverse proxy can reach frontend"
else
    echo "❌ Reverse proxy cannot reach frontend properly"
fi

echo -e "\nVerification completed."