#!/bin/bash

# Reload Nginx configuration to fix container name mappings

echo "Reloading Nginx configuration with corrected container names..."

# Copy updated configuration to running container
docker cp nginx-production.conf premier-erp-nginx:/etc/nginx/nginx.conf

# Test configuration
if docker exec premier-erp-nginx nginx -t; then
    echo "Configuration test passed. Reloading Nginx..."
    docker exec premier-erp-nginx nginx -s reload
    echo "Nginx configuration reloaded successfully"
else
    echo "Configuration test failed. Check nginx configuration."
    exit 1
fi

# Verify services are accessible
echo "Testing connectivity to backend containers..."
if docker exec premier-erp-nginx wget -q --spider http://premier-erp-app:5000/api/dashboard/summary 2>/dev/null || \
   docker exec premier-erp-nginx wget -q --spider http://pharma-erp_backend:5000/api/dashboard/summary 2>/dev/null; then
    echo "Backend connectivity: OK"
else
    echo "Backend connectivity: Failed"
fi

if docker exec premier-erp-nginx wget -q --spider http://premier-erp-frontend:80 2>/dev/null || \
   docker exec premier-erp-nginx wget -q --spider http://pharma-erp_frontend:80 2>/dev/null; then
    echo "Frontend connectivity: OK"
else
    echo "Frontend connectivity: Failed"
fi

echo "Configuration reload completed"