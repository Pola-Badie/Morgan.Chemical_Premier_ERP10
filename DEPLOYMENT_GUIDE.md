
# Premier ERP System - Deployment Guide

## 🚀 Quick Deployment on Replit

### 1. **Automatic Deployment**
```bash
# Simply click the "Run" button in Replit
# The system will automatically:
# - Install dependencies
# - Setup database
# - Start both frontend and backend
# - Configure production settings
```

### 2. **Manual Deployment Steps**
```bash
# Install dependencies
npm install

# Setup database
node setup-database.js

# Start in production mode
npm start
```

### 3. **Environment Configuration**
- Copy `.env.example` to `.env`
- Update database credentials
- Configure any API keys needed

## 📊 **System Architecture**

### Frontend (React + Vite)
- **Port**: 5173 (development) / 5000 (production)
- **Framework**: React 18 with TypeScript
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Context API

### Backend (Node.js + Express)
- **Port**: 5000
- **Database**: PostgreSQL
- **Authentication**: JWT + Session management
- **API**: RESTful with error handling

### Database (PostgreSQL)
- **Port**: 5432
- **Connection Pool**: Configured for production
- **Backup**: Automated daily backups
- **Performance**: Optimized queries and indexing

## 🔧 **Production Features**

### Security
- ✅ Helmet.js for security headers
- ✅ CORS protection
- ✅ Rate limiting (100 requests/15 minutes)
- ✅ Input sanitization
- ✅ SQL injection protection

### Performance
- ✅ Gzip compression
- ✅ Asset optimization
- ✅ Database connection pooling
- ✅ Memory monitoring
- ✅ Request timeout handling

### Monitoring
- ✅ Comprehensive logging
- ✅ Health check endpoints
- ✅ Error tracking
- ✅ Performance metrics

## 📋 **Health Checks**

### API Endpoints
- `GET /api/health` - System health
- `GET /api/dashboard/summary` - Backend status
- `GET /api/inventory/summary` - Database connectivity

### Expected Response
```json
{
  "status": "healthy",
  "service": "Premier ERP System",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "memory": "normal"
}
```

## 🎯 **Deployment Checklist**

### Pre-Deployment
- [x] All tests passing
- [x] Environment variables configured
- [x] Database migrations complete
- [x] Security settings verified
- [x] Performance optimized

### Post-Deployment
- [x] Health checks passing
- [x] All API endpoints responding
- [x] Frontend loading correctly
- [x] Database connectivity verified
- [x] User authentication working

## 🚨 **Troubleshooting**

### Common Issues
1. **Database Connection**: Check PostgreSQL is running
2. **Port Conflicts**: Ensure port 5000 is available
3. **Environment Variables**: Verify `.env` file exists
4. **Memory Issues**: Monitor system resources

### Support Commands
```bash
# Check system status
npm run health-check

# View logs
npm run logs

# Restart services
npm run restart

# Database reset (if needed)
npm run db:reset
```

## 🎉 **Success Indicators**

Your Premier ERP System is successfully deployed when:
- ✅ All API endpoints return 200 status
- ✅ Frontend loads without errors
- ✅ Database queries execute properly
- ✅ User authentication works
- ✅ All business modules functional

**Access your system at**: `https://your-repl-name.replit.app`
