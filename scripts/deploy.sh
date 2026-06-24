#!/bin/bash
# deploy.sh -- Full Scribe deployment pipeline
# Usage: bash deploy.sh
# Does: build -> push to ECR -> push secrets to SSM -> register task def -> force ECS deploy

set -e
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
ACCOUNT="374198398968"
ECR_REPO="$ACCOUNT.dkr.ecr.$REGION.amazonaws.com/scribe-api"
CLUSTER="scribe-cluster"
SERVICE="scribe-api-task-service"

echo "Starting Scribe deployment..."

# -- 1. Build --
echo ""
echo "[1/5] Building Docker image..."
docker build -t scribe-api .

# -- 2. Push to ECR --
echo ""
echo "[2/5] Logging into ECR and pushing image..."
$AWS ecr get-login-password --region $REGION \
  | docker login --username AWS --password-stdin "$ECR_REPO"

echo "Tagging image..."
docker tag scribe-api:latest $ECR_REPO:latest

echo "Pushing image to ECR..."
docker push $ECR_REPO:latest

# -- 3. Push secrets to SSM --
echo ""
echo "[3/5] Syncing secrets to SSM Parameter Store..."
bash scripts/push-secrets.sh

# -- 4. Register new task definition --
echo ""
echo "[4/5] Registering new ECS task definition..."
TASK_DEF_ARN=$($AWS ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region $REGION \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)
echo "  Registered: $TASK_DEF_ARN"

# -- 5. Force new deployment --
echo ""
echo "[5/5] Triggering new ECS deployment..."
$AWS ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition $TASK_DEF_ARN \
  --force-new-deployment \
  --region $REGION \
  --no-cli-pager > /dev/null

echo ""
echo "Deployment triggered! Your API is spinning up."
echo "Load Balancer: http://scribe-alb-1676123431.eu-north-1.elb.amazonaws.com"
echo "It will be live in ~60-90 seconds."
