#!/bin/bash
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"

# Get ALB ARN
ALB_ARN=$($AWS elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?contains(LoadBalancerName, 'scribe-alb')].LoadBalancerArn" --output text)
ALB_DNS=$($AWS elbv2 describe-load-balancers --region $REGION --query "LoadBalancers[?contains(LoadBalancerName, 'scribe-alb')].DNSName" --output text)

# Get Target Group ARN
TG_ARN=$($AWS elbv2 describe-target-groups --region $REGION --query "TargetGroups[?contains(TargetGroupName, 'scribe-tg')].TargetGroupArn" --output text)

echo "ALB_ARN=$ALB_ARN"
echo "ALB_DNS=$ALB_DNS"
echo "TG_ARN=$TG_ARN"
