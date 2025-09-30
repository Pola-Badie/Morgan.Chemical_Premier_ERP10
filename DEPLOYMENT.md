# Premier ERP System - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Docker and Docker Compose installed
- PostgreSQL database (or use Docker)
- Node.js 18+ (for local development)
- SSL certificate (for production)

## 📋 Deployment Methods

### Method 1: Docker Deployment (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd premier-erp

# 2. Copy and configure environment
cp .env.example .env.production
# Edit .env.production with your values

# 3. Build and start services
docker-compose up -d

# 4. Check services
docker-compose ps

# 5. View logs
docker-compose logs -f app
```

### Method 2: Manual Deployment

```bash
# 1. Install dependencies
npm ci

# 2. Build the application
npm run build

# 3. Set production environment
export NODE_ENV=production

# 4. Start the server
npm start
```

### Method 3: PM2 Deployment

```bash
# 1. Install PM2 globally
npm install -g pm2

# 2. Start with PM2
pm2 start ecosystem.config.js

# 3. Save PM2 config
pm2 save

# 4. Setup startup script
pm2 startup
```

## 🔧 Configuration

### Environment Variables

Create `.env.production` with:

```env
# Required
DATABASE_URL= 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
=postgresql://user:pass@host:5432/dbname
JWT_SECRET=generate-secure-random-string
SESSION_SECRET=another-secure-random-string

# Optional
REDIS_URL=redis://localhost:6379
SENTRY_DSN=your-sentry-dsn
```

### SSL/HTTPS Setup

#### Using Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

## 🗄️ Database Setup

### Initial Setup

```bash
# Create database
createdb premier_erp

# Run migrations (if available)
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Backup Configuration

```bash
# Setup automated backups
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/premier-erp/scripts/backup/backup-database.sh
```

## 📊 Monitoring

### Health Checks

- Main health endpoint: `https://your-domain.com/api/health`
- Readiness check: `https://your-domain.com/api/readiness`
- Liveness check: `https://your-domain.com/api/liveness`

### Logs

```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs

# Application logs
tail -f logs/error.log
tail -f logs/combined.log
```

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm ci

# 3. Build new version
npm run build

# 4. Restart services
docker-compose down
docker-compose up -d

# Or with PM2
pm2 restart all
```

### Database Migrations

```bash
# Run pending migrations
npm run db:migrate

# Rollback if needed
npm run db:rollback
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL= 'postgresql://neondb_owner:npg_RgYqcf8Q4vVo@ep-solitary-bar-adggyh8w-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
 in .env
   - Verify PostgreSQL is running
   - Check firewall rules

2. **Port Already in Use**
   - Change PORT in .env
   - Kill existing process: `lsof -ti:5000 | xargs kill`

3. **Memory Issues**
   - Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`
   - Check for memory leaks in logs

4. **SSL Certificate Issues**
   - Verify certificate paths
   - Check certificate expiration
   - Ensure proper file permissions

### Emergency Procedures

```bash
# Rollback to previous version
docker-compose down
docker pull ghcr.io/your-org/premier-erp:previous-tag
docker-compose up -d

# Restore database from backup
./scripts/backup/restore-database.sh /backups/premier_erp_backup_20250107.sql.gz

# Emergency restart
docker-compose restart
# or
pm2 restart all
```

## 🔐 Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall rules
- [ ] Enable SSL/HTTPS
- [ ] Set secure JWT secret
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup fail2ban
- [ ] Regular security updates

## 📞 Support

For deployment issues:
1. Check logs for errors
2. Review this documentation
3. Check GitHub issues
4. Contact support team