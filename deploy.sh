#!/bin/bash

# Configuration: Update these if your paths on the server are different
PROJECT_ROOT="$HOME/Digital-University-Project-SE"
BACKEND_CONTAINER="equestionaire-app"

echo "🚀 Starting Deployment Process..."

# 1. Navigate to project root
cd "$PROJECT_ROOT" || { echo "❌ Directory not found: $PROJECT_ROOT"; exit 1; }

# 2. Pull latest code from main
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 3. Build and Start Backend
echo "🏗️  Building and starting Backend..."
cd backend
# Using -f Dockerfile.mac or Dockerfile.prod depending on your server setup. 
# Usually 'docker compose' handles this via the Compose file.
sudo docker compose up -d --build

# 4. Build and Start Frontend
echo "🏗️  Building and starting Frontend..."
cd ../frontend
sudo docker compose up -d --build

# 5. Run Database Seed
echo "🌱 Running database seed..."
# We wait a few seconds to ensure the backend container and DB are actually ready
sleep 5
sudo docker exec -it "$BACKEND_CONTAINER" node seed.js

echo "✅ Deployment complete!"
echo "🌐 URL: https://uniform.mfu.ac.th"
