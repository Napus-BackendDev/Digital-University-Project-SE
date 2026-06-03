#!/bin/bash

# Configuration: Update these if your paths on the server are different
PROJECT_ROOT="$HOME/Digital-University-Project-SE"
BACKEND_CONTAINER="uniform-backend"

echo "🚀 Starting Deployment Process..."

# 1. Navigate to project root
cd "$PROJECT_ROOT" || { echo "❌ Directory not found: $PROJECT_ROOT"; exit 1; }

# 2. Pull latest code from main
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 3. Build and Start Backend
echo "🏗️  Building and starting Backend..."
cd backend
sudo docker-compose up -d --build

# 4. Build and Start Frontend
echo "🏗️  Building and starting Frontend..."
cd ../frontend
sudo docker-compose up -d --build

# 5. Run Database Seed
echo "🌱 Running database seed..."
sleep 10
sudo docker exec -it uniform-backend node seed.js

echo "✅ Deployment complete!"
echo "🌐 URL: https://uniform.mfu.ac.th"
