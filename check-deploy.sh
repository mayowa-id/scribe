#!/bin/bash
# check-deploy.sh -- Poll ECS service status and test the health endpoint

AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
CLUSTER="scribe-cluster"
SERVICE="scribe-api-task-service"
ALB="http://scribe-alb-1676123431.eu-north-1.elb.amazonaws.com"

echo "Waiting 90 seconds for ECS to start the new task..."
sleep 90

echo ""
echo "--- ECS Service Status ---"
$AWS ecs describe-services \
  --cluster $CLUSTER \
  --services $SERVICE \
  --region $REGION \
  --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
svc  = data['services'][0]
dep  = svc['deployments'][0]
print('  Running :', svc['runningCount'])
print('  Desired :', svc['desiredCount'])
print('  Pending :', svc['pendingCount'])
print('  Failed  :', dep['failedTasks'])
print('  Rollout :', dep['rolloutState'])
print('  Reason  :', dep.get('rolloutStateReason', 'n/a'))
"

echo ""
echo "--- Health Check ---"
HTTP_CODE=$(curl -s -o /tmp/health_body.txt -w "%{http_code}" --max-time 10 "$ALB/health" 2>&1)
echo "  HTTP Status : $HTTP_CODE"
echo "  Body        : $(cat /tmp/health_body.txt)"

echo ""
echo "--- Swagger Docs ---"
SW_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$ALB/api" 2>&1)
echo "  /api (Swagger) : $SW_CODE"
