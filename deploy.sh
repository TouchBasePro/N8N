#!/bin/bash

# Exit on any error
set -e

##############################
# Step 0: Get Package Name
##############################
PACKAGE_NAME=$(node -p "require('./package.json').name")

if [ -z "$PACKAGE_NAME" ]; then
  echo "❌ Could not determine package name from package.json."
  exit 1
fi

CONTAINER_NAME="n8n"
TARGET_PATH="/home/node/.n8n/custom/$PACKAGE_NAME"
SOURCE_DIR="./dist"

echo "📦 Package name: $PACKAGE_NAME"
echo "📁 Target container path: $TARGET_PATH"
echo "🐳 Docker container: $CONTAINER_NAME"

##############################
# Step 1: Build the Node
##############################
echo "🔧 Building node..."
pnpm run build

##############################
# Step 2: Copy Build to Container
##############################
echo "📤 Copying build output to container..."

# Ensure the target directory exists inside the container
docker exec "$CONTAINER_NAME" mkdir -p "$TARGET_PATH"

# Copy the dist folder contents to the container path
docker cp "$SOURCE_DIR/." "$CONTAINER_NAME":"$TARGET_PATH"

# Fix Permissions
echo "🔐 Fixing permissions..."
docker exec -u root "$CONTAINER_NAME" chown -R node:node "$TARGET_PATH"
docker exec -u root "$CONTAINER_NAME" chmod -R 755 "$TARGET_PATH"


echo "✅ Node deployed to container: $CONTAINER_NAME"

##############################
# Step 3: Restart n8n
##############################
echo "🔁 Restarting $CONTAINER_NAME..."
docker restart "$CONTAINER_NAME"

echo "🚀 Done. Custom node is live inside the container!"
