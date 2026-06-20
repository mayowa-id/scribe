#!/bin/bash
# rewire-service.sh -- Delete existing ECS service and recreate it wired to the ALB target group

set -e
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
CLUSTER="scribe-cluster"
SERVICE="scribe-api-task-service"
TASK_DEF="arn:aws:ecs:eu-north-1:374198398968:task-definition/scribe-api-task:6"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:eu-north-1:374198398968:targetgroup/scribe-tg/8ae36b296f90f057"

# Subnets and security group from the existing service network config
SUBNETS="subnet-0c578a215c6b7faa6,subnet-0b02ddd2d65511724,subnet-00e24bccfc7c39541"
SG="sg-0f75d23f1c6555c52"

echo "[1/3] Scaling down existing service to 0 tasks..."
$AWS ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --desired-count 0 \
  --region $REGION \
  --no-cli-pager > /dev/null

echo "  Waiting for tasks to drain (30 seconds)..."
sleep 30

echo "[2/3] Deleting existing service..."
$AWS ecs delete-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --region $REGION \
  --no-cli-pager > /dev/null
echo "  Service deleted."

echo "  Waiting 15 seconds for deletion to propagate..."
sleep 15

echo "[3/3] Recreating service with ALB target group attached..."
$AWS ecs create-service \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --task-definition $TASK_DEF \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=scribe-api,containerPort=3000" \
  --deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true},maximumPercent=200,minimumHealthyPercent=100" \
  --region $REGION \
  --no-cli-pager > /dev/null

echo ""
echo "Service recreated and wired to ALB target group."
echo "ECS will register the task as a target once it passes health checks (~60-90 seconds)."
echo "ALB: http://scribe-alb-1676123431.eu-north-1.elb.amazonaws.com"
