#!/bin/bash

# Premier ERP System Docker Setup Script
# This script handles Docker permission issues and provides setup options

echo "🚀 Premier ERP System Docker Setup"
echo "=================================="

# Function to check if user is in docker group
check_docker_permissions() {
    if groups $USER | grep -q '\bdocker\b'; then
        return 0
    else
        return 1
    fi
}

# Function to setup Docker permissions
setup_docker_permissions() {
    echo "Setting up Docker permissions..."
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    echo "✅ User added to docker group"
    echo "⚠️  You need to log out and back in, or run: newgrp docker"
    echo "Then run this script again."
}

# Function to install Docker if not present
install_docker() {
    echo "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install prerequisites
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up stable repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Install Docker Compose standalone
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker installed successfully"
}

# Main setup logic
main() {
    echo "Checking system requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker not found"
        read -p "Would you like to install Docker? (y/n): " install_choice
        if [[ $install_choice =~ ^[Yy]$ ]]; then
            install_docker
        else
            echo "Please install Docker manually and run this script again"
            exit 1
        fi
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose not found"
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Check Docker daemon
    if ! sudo docker info >/dev/null 2>&1; then
        echo "❌ Docker daemon not running"
        echo "Starting Docker daemon..."
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    # Check permissions
    if ! check_docker_permissions; then
        echo "❌ User not in docker group"
        read -p "Would you like to add your user to the docker group? (y/n): " perm_choice
        if [[ $perm_choice =~ ^[Yy]$ ]]; then
            setup_docker_permissions
            echo "Please run: newgrp docker"
            echo "Then run: ./docker-start.sh"
            exit 0
        fi
    fi
    
    # Test Docker access
    if docker info >/dev/null 2>&1; then
        echo "✅ Docker is working correctly"
        echo "You can now run: ./docker-start.sh"
    else
        echo "❌ Docker access test failed"
        echo "Try running with sudo: sudo ./docker-start.sh"
    fi
}

main "$@"