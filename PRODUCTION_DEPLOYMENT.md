# Premier ERP System - Production Deployment Guide

## Domain & SSL Configuration

**Domain:** demo.premiererp.io  
**SSL Email:** support@premiererp.io  
**SSL Provider:** Let's Encrypt (automatic)

## Prerequisites

1. **DNS Configuration Required:**
   ```bash
   # Verify your domain points to this server
   dig demo.premiererp.io
   ```
   Ensure the A record points to your server's IP address.

2. **Firewall Configuration:**
   ```bash
   # Open required ports
   sudo ufw allow 80/tcp    # HTTP (for Let's Encrypt verification)
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw allow 8080/tcp  # Traefik dashboard (optional)
   ```

## Production Deployment

```bash
sudo ./docker-deploy-nginx.sh
```

## What This Deploys

1. **Nginx Reverse Proxy**
   - Automatic SSL certificate acquisition via Let's Encrypt with Certbot
   - HTTP to HTTPS redirects
   - Rate limiting and security headers
   - Production-optimized caching

2. **Premier ERP Frontend**
   - React application served via Nginx
   - Gzip compression and caching
   - Client-side routing support

3. **Premier ERP Backend**
   - Express.js API server
   - Database connections
   - All ERP modules operational

4. **PostgreSQL Database**
   - Persistent data storage
   - Automatic backups support

## Access Points

- **Application:** https://demo.premiererp.io
- **API:** https://demo.premiererp.io/api/
- **HTTP Redirect:** http://demo.premiererp.io (auto-redirects to HTTPS)

## SSL Certificate Management

- **Provider:** Let's Encrypt
- **Email:** support@premiererp.io
- **Auto-renewal:** Yes (handled by Traefik)
- **Storage:** Persistent Docker volume

## Production Features

- Automatic HTTPS with valid SSL certificates
- HTTP to HTTPS redirects
- Production-optimized asset serving
- Database persistence across restarts
- Health monitoring via Traefik
- Zero-downtime certificate renewals

## Management Commands

```bash
# View service status
docker ps

# Check logs
docker logs premier-erp-traefik
docker logs premier-erp-frontend
docker logs premier-erp-app

# Restart services
docker-compose -f docker-compose.production.yml restart

# Stop all services
docker-compose -f docker-compose.production.yml down
```

## Security Notes

- All traffic encrypted via HTTPS
- Database not exposed externally
- Traefik dashboard accessible only locally
- SSL certificates automatically renewed