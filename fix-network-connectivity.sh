#!/bin/bash

# Fix Docker network connectivity for Nginx upstream resolution

echo "Fixing Docker network connectivity..."

# Get the network that the app containers are using
BACKEND_NETWORK=$(docker inspect pharma-erp_backend --format='{{range $net,$conf := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)
FRONTEND_NETWORK=$(docker inspect pharma-erp_frontend --format='{{range $net,$conf := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)

echo "Backend container network: $BACKEND_NETWORK"
echo "Frontend container network: $FRONTEND_NETWORK"

# Connect Nginx to the same networks
if [ ! -z "$BACKEND_NETWORK" ]; then
    echo "Connecting Nginx to backend network: $BACKEND_NETWORK"
    docker network connect $BACKEND_NETWORK premier-erp-nginx 2>/dev/null || echo "Already connected or network doesn't exist"
fi

if [ ! -z "$FRONTEND_NETWORK" ] && [ "$FRONTEND_NETWORK" != "$BACKEND_NETWORK" ]; then
    echo "Connecting Nginx to frontend network: $FRONTEND_NETWORK"
    docker network connect $FRONTEND_NETWORK premier-erp-nginx 2>/dev/null || echo "Already connected or network doesn't exist"
fi

# Test connectivity after network connection
echo "Testing connectivity..."
sleep 2

if docker exec premier-erp-nginx nslookup pharma-erp_backend > /dev/null 2>&1; then
    echo "✅ Backend hostname resolution: Working"
else
    echo "❌ Backend hostname resolution: Failed"
    echo "Backend IP: $(docker inspect pharma-erp_backend --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
fi

if docker exec premier-erp-nginx nslookup pharma-erp_frontend > /dev/null 2>&1; then
    echo "✅ Frontend hostname resolution: Working"
else
    echo "❌ Frontend hostname resolution: Failed"
    echo "Frontend IP: $(docker inspect pharma-erp_frontend --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
fi

# Restart Nginx to apply network changes
echo "Restarting Nginx to apply network changes..."
docker restart premier-erp-nginx

echo "Network connectivity fix completed"