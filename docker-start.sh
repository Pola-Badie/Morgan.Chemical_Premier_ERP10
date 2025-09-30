#!/bin/bash
# Premier ERP Docker Startup Script

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Premier ERP System...${NC}"

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production not found!${NC}"
    echo "Creating from .env.example..."
    cp .env.example .env.production
    echo -e "${RED}Please edit .env.production with your configuration before continuing.${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed!${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed!${NC}"
    exit 1
fi

# Create necessary directories
echo "Creating directories..."
mkdir -p uploads logs backups attached_assets

# Set proper permissions
chmod 755 uploads logs backups attached_assets

# Build images
echo -e "${GREEN}Building Docker images...${NC}"
docker-compose build --no-cache

# Start services
echo -e "${GREEN}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check service health
echo -e "${GREEN}Checking service health...${NC}"
docker-compose ps

# Check database connection
echo "Checking database connection..."
docker-compose exec -T app curl -f http://localhost:5000/api/health || {
    echo -e "${RED}Health check failed!${NC}"
    echo "Checking logs..."
    docker-compose logs --tail=50 app
    exit 1
}

echo -e "${GREEN}✓ Premier ERP System is running!${NC}"
echo ""
echo "Access the application at:"
echo "  - Frontend: http://localhost:5000"
echo "  - API: http://localhost:5000/api"
echo "  - Health: http://localhost:5000/api/health"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Backup database: ./scripts/backup/backup-database.sh"