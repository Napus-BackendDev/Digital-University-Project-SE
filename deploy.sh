#!/bin/bash
set -e

# Configuration: Update these if your paths on the server are different
PROJECT_ROOT="$HOME/Digital-University-Project-SE"
BACKEND_CONTAINER="uniform-backend"

echo "Starting deployment process..."

# 1. Navigate to project root
cd "$PROJECT_ROOT" || { echo "Directory not found: $PROJECT_ROOT"; exit 1; }

# 2. Pull latest code from main
echo "Pulling latest code from GitHub..."
git pull origin main

# 3. Build and start all services from the root compose file
echo "Building and starting services..."
sudo docker compose --env-file backend/.env up -d --build

# 4. Run Database Seed
echo "Running database seed..."
sleep 10
sudo docker exec -i "$BACKEND_CONTAINER" node seed.js

echo "Deployment complete."
echo "URL: https://uniform.mfu.ac.th"
