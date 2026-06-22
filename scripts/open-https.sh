#!/bin/bash
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
ALB_NAME="scribe-alb"

# Get ALB security groups
SG_IDS=$($AWS elbv2 describe-load-balancers \
    --region "$REGION" \
    --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for lb in data['LoadBalancers']:
    if '$ALB_NAME' in lb['LoadBalancerName']:
        print(' '.join(lb['SecurityGroups']))
")

echo "ALB Security Groups: $SG_IDS"

# Add port 443 inbound rule to each SG
for SG_ID in $SG_IDS; do
    echo "Adding HTTPS (443) rule to SG: $SG_ID"
    $AWS ec2 authorize-security-group-ingress \
        --group-id "$SG_ID" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$REGION" \
        --output json 2>&1 | python3 -c "
import json, sys
raw = sys.stdin.read()
try:
    data = json.loads(raw)
    print('  Rule added successfully')
except:
    print('  ' + raw.strip())
"
done

echo ""
echo "Testing HTTPS connectivity..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" --max-time 10 https://api.geraniol.xyz/health
