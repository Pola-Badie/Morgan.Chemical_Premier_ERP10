#!/bin/bash
# Premier ERP Database Backup Script
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/runner/workspace/backups"

# Get database credentials from environment variables
DB_HOST=${PGHOST:-"localhost"}
DB_PORT=${PGPORT:-"5432"}
DB_NAME=${PGDATABASE:-"premier_erp"}
DB_USER=${PGUSER:-"postgres"}
export PGPASSWORD=${PGPASSWORD}

RETENTION_DAYS=7

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Starting database backup...${NC}"

# Backup database
if pg_dump -U $DB_USER -h $DB_HOST -p $DB_PORT $DB_NAME > $BACKUP_DIR/backup_${DATE}.sql; then
    echo -e "${GREEN}✓ Database backup created successfully: $BACKUP_DIR/backup_${DATE}.sql${NC}"
else
    echo -e "${RED}✗ Database backup failed!${NC}"
    exit 1
fi

# Backup uploads directory if it exists
if [ -d "uploads" ]; then
    if tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz uploads/; then
        echo -e "${GREEN}✓ Uploads directory backup created successfully: $BACKUP_DIR/uploads_${DATE}.tar.gz${NC}"
    else
        echo -e "${RED}✗ Uploads directory backup failed!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ No uploads directory found, creating empty backup...${NC}"
    # Create empty tar file for consistency
    tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz --files-from /dev/null
fi

# Calculate size
DB_SIZE=$(du -sh $BACKUP_DIR/backup_${DATE}.sql | cut -f1)
echo -e "${GREEN}✓ Database backup size: $DB_SIZE${NC}"

if [ -f "$BACKUP_DIR/uploads_${DATE}.tar.gz" ]; then
    UPLOADS_SIZE=$(du -sh $BACKUP_DIR/uploads_${DATE}.tar.gz | cut -f1)
    echo -e "${GREEN}✓ Uploads backup size: $UPLOADS_SIZE${NC}"
fi

# Remove backups older than 7 days
echo "Cleaning up old backups..."
find $BACKUP_DIR -name "backup_*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo -e "${GREEN}✓ Old backups removed (older than $RETENTION_DAYS days)${NC}"

# List current backups
echo -e "\nCurrent backups:"
ls -lh $BACKUP_DIR/backup_*.sql 2>/dev/null | tail -5
ls -lh $BACKUP_DIR/uploads_*.tar.gz 2>/dev/null | tail -5

echo -e "${GREEN}Backup completed!${NC}"
exit 0