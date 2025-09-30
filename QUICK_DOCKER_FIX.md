# Quick Docker Fix for ContainerConfig Error

## The Problem
Docker Compose version 1.29.2 has compatibility issues with container configuration, causing `'ContainerConfig'` KeyError.

## Immediate Solution

**Option 1: Manual Docker Deployment (Recommended)**
```bash
# Make the script executable and run
chmod +x docker-deploy-manual.sh
sudo ./docker-deploy-manual.sh
```

**Option 2: Direct Commands**
```bash
# Clean slate
sudo docker stop $(sudo docker ps -q) 2>/dev/null || true
sudo docker rm $(sudo docker ps -aq) 2>/dev/null || true

# Create network
sudo docker network create premier-erp-network 2>/dev/null || true

# Start database
sudo docker run -d \
  --name premier-erp-db \
  --network premier-erp-network \
  -e POSTGRES_DB=premier_erp \
  -e POSTGRES_USER=erp_user \
  -e POSTGRES_PASSWORD=erp_secure_password \
  -p 5432:5432 \
  postgres:15-alpine

# Build application
sudo docker build -f Dockerfile.production -t premier-erp-app .

# Start application
sudo docker run -d \
  --name premier-erp-app \
  --network premier-erp-network \
  -e NODE_ENV=production \
  -e DATABASE_URL= 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
=postgresql://erp_user:erp_secure_password@premier-erp-db:5432/premier_erp \
  -e PORT=5000 \
  -p 5000:5000 \
  premier-erp-app
```

## Verify Success
```bash
# Check containers
sudo docker ps

# Test API
curl http://localhost:5000/api/dashboard/summary

# View logs
sudo docker logs premier-erp-app
```

## Access Your Application

**Backend API:** http://localhost:5000  
**Frontend:** Run `npm run dev` locally (connects to Docker backend automatically)  
**Database:** localhost:5432

## Benefits of This Approach

- Bypasses Docker Compose compatibility issues completely
- Uses stable Docker commands that work across versions
- Provides better error visibility and control
- Maintains all ERP functionality

Your Premier ERP System will be fully operational with this manual deployment approach.