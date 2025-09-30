#!/bin/bash
# Premier ERP Database Restore Script

# Configuration
BACKUP_DIR="/backups"
DB_NAME="premier_erp"
DB_USER="erp_user"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
    echo -e "\nAvailable backups:"
    ls -lh $BACKUP_DIR/premier_erp_backup_*.sql.gz 2>/dev/null
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will replace all data in the database!${NC}"
echo -n "Are you sure you want to restore from $BACKUP_FILE? (yes/no): "
read CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

echo -e "${GREEN}Starting database restore...${NC}"

# Create temp file for uncompressed backup
TEMP_FILE="/tmp/restore_$(date +%s).sql"

# Decompress backup if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -c $BACKUP_FILE > $TEMP_FILE
else
    cp $BACKUP_FILE $TEMP_FILE
fi

# Drop existing database and recreate
echo "Preparing database..."
PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $DB_USER -d postgres <<EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

# Restore database
echo "Restoring database..."
if PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $DB_USER -d $DB_NAME < $TEMP_FILE; then
    echo -e "${GREEN}✓ Database restored successfully!${NC}"
    
    # Clean up temp file
    rm -f $TEMP_FILE
    
    # Verify restore
    echo "Verifying restore..."
    TABLE_COUNT=$(PGPASSWORD=$POSTGRES_PASSWORD psql -h postgres -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
    echo -e "${GREEN}✓ Restored $TABLE_COUNT tables${NC}"
    
    exit 0
else
    echo -e "${RED}✗ Restore failed!${NC}"
    rm -f $TEMP_FILE
    exit 1
fi