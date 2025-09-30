# Premier ERP System - Docker Deployment Guide

## Overview

This guide provides complete instructions for deploying the Premier ERP System using Docker containers for both frontend and backend services.

## Prerequisites

- Docker Engine 20.0+ installed
- Docker Compose 2.0+ installed
- At least 4GB RAM available
- 10GB free disk space

## Quick Start

1. **Setup Docker permissions (if needed):**
   ```bash
   # Run setup script to handle permissions
   chmod +x docker-setup.sh
   ./docker-setup.sh
   ```

2. **Prepare environment:**
   ```bash
   # Copy environment configuration
   cp .env.example .env
   
   # Edit configuration (set secure passwords)
   nano .env
   ```

3. **Start the application:**
   ```bash
   # Option A: Use automated script
   ./docker-start.sh
   
   # Option B: If permission issues persist
   sudo ./docker-start.sh
   
   # Option C: Manual commands
   docker-compose up --build -d
   ```

4. **Access the application:**
   - Frontend & Backend: http://localhost:5000
   - PostgreSQL Database: localhost:5432
   - Redis Cache: localhost:6379

## Manual Docker Commands

### Build and Start Services

```bash
# Build and start all services
docker-compose up --build -d

# View service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U erp_user -d premier_erp

# Backup database
docker-compose exec postgres pg_dump -U erp_user premier_erp > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database
docker-compose exec -T postgres psql -U erp_user -d premier_erp < backup_file.sql
```

### Application Management

```bash
# Restart application only
docker-compose restart app

# View application logs
docker-compose logs -f app

# Execute commands in app container
docker-compose exec app tsx server/db-migrate.ts
```

## Configuration

### Environment Variables

Key configuration options in `.env`:

- `DATABASE_URL= 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
`: PostgreSQL connection string
- `POSTGRES_PASSWORD`: Database password (change from default)
- `NODE_ENV`: Set to 'production' for deployment
- `PORT`: Application port (default: 5000)

### Volume Mounts

- `./uploads:/app/uploads` - File uploads storage
- `./backups:/app/backups` - Database backups
- `postgres_data` - PostgreSQL data persistence
- `redis_data` - Redis data persistence

## Production Deployment

### Security Considerations

1. **Change default passwords:**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

2. **Update firewall rules:**
   ```bash
   # Only expose necessary ports
   ufw allow 5000/tcp
   ufw deny 5432/tcp  # Don't expose database directly
   ```

3. **Use HTTPS in production:**
   - Configure reverse proxy (nginx/Apache)
   - Obtain SSL certificates (Let's Encrypt)

### Performance Optimization

1. **Resource limits in docker-compose.yml:**
   ```yaml
   app:
     deploy:
       resources:
         limits:
           memory: 2G
           cpus: '1.0'
   ```

2. **Database tuning:**
   ```yaml
   postgres:
     command: postgres -c shared_preload_libraries=pg_stat_statements -c max_connections=200
   ```

## Monitoring and Maintenance

### Health Checks

Services include built-in health checks:
- Application: `/api/dashboard/summary` endpoint
- PostgreSQL: `pg_isready` command
- Redis: `ping` command

### Backup Strategy

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec postgres pg_dump -U erp_user premier_erp > ./backups/premier_erp_$DATE.sql
find ./backups -name "*.sql" -mtime +7 -delete
```

### Log Management

```bash
# Rotate logs to prevent disk space issues
docker-compose config | grep -A 10 logging:
```

## Troubleshooting

### Common Issues

1. **Docker Permission Denied (Most Common):**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   newgrp docker
   
   # Or start Docker daemon
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # Test Docker access
   docker info
   
   # If still failing, run with sudo
   sudo docker-compose up --build -d
   ```

2. **Port conflicts:**
   ```bash
   # Check port usage
   netstat -tulpn | grep :5000
   
   # Change port in docker-compose.yml
   ports:
     - "3000:5000"  # External:Internal
   ```

3. **Database connection issues:**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Verify connection
   docker-compose exec app tsx -e "console.log(process.env.DATABASE_URL= 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
)"
   ```

4. **File permission issues:**
   ```bash
   # Fix upload directory permissions
   sudo chown -R 1000:1000 uploads/
   chmod 755 uploads/
   ```

### Service Management

```bash
# Stop all services
docker-compose down

# Remove all data (destructive)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache

# Update services
docker-compose pull
docker-compose up -d
```

## Support

For deployment issues:
1. Check service logs: `docker-compose logs`
2. Verify configuration: `docker-compose config`
3. Test connectivity: `docker-compose exec app curl localhost:5000`

## Migration from Development

When migrating from development setup:
1. Export existing data
2. Update environment variables
3. Run database migrations
4. Import data to production database
5. Test all functionality

---

**Note:** This deployment setup provides a complete production-ready environment for the Premier ERP System with proper data persistence, health monitoring, and scalability considerations.