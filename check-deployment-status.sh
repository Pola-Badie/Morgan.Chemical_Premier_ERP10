#!/bin/bash

# Premier ERP System - Deployment Status Checker

echo "🔍 Premier ERP System - Deployment Status"
echo "=========================================="

echo "📊 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=premier-erp"

echo ""
echo "📋 Service Health Checks:"

# Check database
if docker exec premier-erp-db pg_isready -U erp_user -d premier_erp > /dev/null 2>&1; then
    echo "✅ Database: Ready"
else
    echo "❌ Database: Not ready"
fi

# Check backend
if docker exec premier-erp-app curl -f http://localhost:5000/api/dashboard/summary > /dev/null 2>&1; then
    echo "✅ Backend: Ready"
else
    echo "❌ Backend: Not ready"
fi

# Check frontend
if docker exec premier-erp-frontend curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend: Ready"
else
    echo "❌ Frontend: Not ready"
fi

# Check nginx
if docker ps | grep -q premier-erp-nginx; then
    echo "✅ Nginx: Running"
else
    echo "❌ Nginx: Not running"
fi

echo ""
echo "🔒 SSL Certificate Status:"
if [ -f "ssl-certs/live/demo.premiererp.io/fullchain.pem" ]; then
    echo "✅ SSL Certificate: Present"
    openssl x509 -in ssl-certs/live/demo.premiererp.io/fullchain.pem -text -noout | grep -E "(Subject:|Not After)"
else
    echo "⏳ SSL Certificate: In progress or using temporary"
fi

echo ""
echo "🌐 Network Connectivity:"
echo "Testing internal connections..."

# Test internal networking
if docker exec premier-erp-nginx wget -q --spider http://premier-erp-app:5000/api/dashboard/summary; then
    echo "✅ Nginx → Backend: Connected"
else
    echo "❌ Nginx → Backend: Failed"
fi

if docker exec premier-erp-nginx wget -q --spider http://premier-erp-frontend:80; then
    echo "✅ Nginx → Frontend: Connected"
else
    echo "❌ Nginx → Frontend: Failed"
fi

echo ""
echo "📝 Recent Logs (last 10 lines):"
echo "--- Nginx ---"
docker logs premier-erp-nginx --tail 10 2>/dev/null || echo "No nginx logs available"

echo ""
echo "--- Backend ---"
docker logs premier-erp-app --tail 5 2>/dev/null || echo "No backend logs available"

echo ""
echo "✅ Status check completed"