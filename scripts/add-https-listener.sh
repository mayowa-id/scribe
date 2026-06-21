#!/bin/bash
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
ALB_ARN="arn:aws:elasticloadbalancing:eu-north-1:374198398968:loadbalancer/app/scribe-alb/64d4f1715dced675"
TG_ARN="arn:aws:elasticloadbalancing:eu-north-1:374198398968:targetgroup/scribe-tg/8ae36b296f90f057"
CERT_ARN="arn:aws:acm:eu-north-1:374198398968:certificate/4666bf35-4ee0-479c-b971-8ad19b0e0c44"

echo "Adding HTTPS listener to ALB..."
$AWS elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn="$CERT_ARN" \
    --default-actions Type=forward,TargetGroupArn="$TG_ARN" \
    --region "$REGION"

echo "Done."
