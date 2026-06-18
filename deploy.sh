#!/bin/bash
set -e

echo "🚀 Starting Scribe Deployment to AWS ECS..."

# Path to AWS CLI (since it's installed in your local bin)
AWS_CMD="$HOME/.local/bin/aws"

# 1. Build the Docker Image
echo "📦 Building Docker image..."
docker build -t scribe-api .

# 2. Tag the Image
echo "🏷️ Tagging image for ECR..."
docker tag scribe-api:latest 374198398968.dkr.ecr.eu-north-1.amazonaws.com/scribe-api:latest

# 3. Log in to ECR
echo "🔑 Logging into Amazon ECR..."
$AWS_CMD ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin 374198398968.dkr.ecr.eu-north-1.amazonaws.com

# 4. Push the Image
echo "⬆️ Pushing image to ECR..."
docker push 374198398968.dkr.ecr.eu-north-1.amazonaws.com/scribe-api:latest

# 5. Force New ECS Deployment
echo "🔄 Forcing new ECS deployment..."
$AWS_CMD ecs update-service --cluster scribe-cluster --service scribe-api-task-service --force-new-deployment --region eu-north-1

echo "✅ Deployment triggered successfully!"
echo "⏳ AWS ECS is now pulling the new image and replacing the old container. This usually takes about 60 seconds."
