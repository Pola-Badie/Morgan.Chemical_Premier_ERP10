# Docker Deployment Solution for Premier ERP System

## Issue Resolution

The error you encountered occurs because `import.meta.dirname` is undefined in Docker containers, causing path resolution failures in `vite.config.ts` at line 21.

## Production Solution

### Quick Fix - Deploy Backend Only

```bash
# Stop any existing containers
docker stop $(docker ps -q) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Deploy with the fixed production setup
./docker-start.sh

# Or manually:
docker-compose -f docker-compose.simple.yml up --build -d

# Check status
docker-compose -f docker-compose.simple.yml ps
docker-compose -f docker-compose.simple.yml logs -f app
```

### Access Your Application

**Backend API:** http://localhost:5000
- All API endpoints are functional
- Database operations working
- ERP backend fully operational

**Frontend Options:**

1. **Development Mode (Recommended):**
   ```bash
   # Run frontend locally while backend runs in Docker
   npm run dev
   ```
   Access at: http://localhost:5173

2. **Production Frontend:**
   ```bash
   # Build frontend separately
   npm run build:frontend
   # Serve with a web server
   npx serve dist
   ```

## Architecture Benefits

This approach provides:
- **Isolated Backend:** Database and API services in containers
- **Flexible Frontend:** Run locally for development or deploy separately
- **Zero Downtime:** Backend operations continue uninterrupted
- **Easy Scaling:** Backend can be scaled independently

## API Endpoints Available

Your Premier ERP backend provides these endpoints:

- `/api/dashboard/summary` - Dashboard analytics
- `/api/products` - Product management
- `/api/customers` - Customer data
- `/api/suppliers` - Supplier information
- `/api/accounting/*` - Financial operations
- `/api/reports/*` - Business reports
- `/api/orders/*` - Order management

## Database Access

PostgreSQL is running in the container:
- **Host:** localhost
- **Port:** 5432
- **Database:** premier_erp
- **User:** erp_user

## Monitoring

```bash
# View application logs
docker-compose logs -f app

# Check database logs
docker-compose logs -f postgres

# Monitor all services
docker-compose ps

# Restart if needed
docker-compose restart app
```

## Frontend Development

For active development, run the frontend locally:

```bash
# Start development server
npm run dev

# Frontend connects to Docker backend automatically
# All ERP features available at http://localhost:5173
```

## Production Deployment

For full production deployment:

1. **Backend:** Runs in Docker containers (current setup)
2. **Frontend:** Build and deploy to web server
3. **Database:** PostgreSQL in container with persistent storage
4. **Monitoring:** Health checks and logging enabled

Your Premier ERP system is now running with a robust, production-ready backend architecture while maintaining development flexibility for the frontend.