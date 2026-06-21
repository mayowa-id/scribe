#!/bin/bash
# diagnose-alb.sh -- Check ALB, target groups and ECS service wiring

AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
CLUSTER="scribe-cluster"
SERVICE="scribe-api-task-service"

echo "=== Load Balancers ==="
$AWS elbv2 describe-load-balancers --region $REGION --output json > /tmp/lbs.json
python3 << 'EOF'
import json
lbs = json.load(open("/tmp/lbs.json"))["LoadBalancers"]
for lb in lbs:
    print(f"  Name : {lb['LoadBalancerName']}")
    print(f"  DNS  : {lb['DNSName']}")
    print(f"  ARN  : {lb['LoadBalancerArn']}")
    print(f"  State: {lb['State']['Code']}")
    print()
EOF

echo "=== Target Groups ==="
$AWS elbv2 describe-target-groups --region $REGION --output json > /tmp/tgs.json
python3 << 'EOF'
import json
tgs = json.load(open("/tmp/tgs.json"))["TargetGroups"]
for tg in tgs:
    print(f"  Name    : {tg['TargetGroupName']}")
    print(f"  Port    : {tg['Port']}")
    print(f"  Protocol: {tg['Protocol']}")
    print(f"  ARN     : {tg['TargetGroupArn']}")
    print(f"  LBs     : {tg.get('LoadBalancerArns', [])}")
    print()
EOF

echo "=== Target Health (all target groups) ==="
python3 << 'EOF'
import json, subprocess
tgs = json.load(open("/tmp/tgs.json"))["TargetGroups"]
for tg in tgs:
    arn = tg["TargetGroupArn"]
    result = subprocess.run(
        ["bash", "-c", f"$HOME/.local/bin/aws elbv2 describe-target-health --target-group-arn {arn} --region eu-north-1 --output json"],
        capture_output=True, text=True
    )
    data = json.loads(result.stdout)
    healths = data.get("TargetHealthDescriptions", [])
    print(f"  TG: {tg['TargetGroupName']}")
    if not healths:
        print("    No targets registered")
    for h in healths:
        t = h["Target"]
        state = h["TargetHealth"]["State"]
        reason = h["TargetHealth"].get("Reason", "")
        desc = h["TargetHealth"].get("Description", "")
        print(f"    Target: {t['Id']}:{t['Port']}  State: {state}  Reason: {reason}  Desc: {desc}")
    print()
EOF

echo "=== ECS Service Load Balancer Config ==="
$AWS ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION --output json > /tmp/svc.json
python3 << 'EOF'
import json
svc = json.load(open("/tmp/svc.json"))["services"][0]
print(f"  Service    : {svc['serviceName']}")
print(f"  Task Def   : {svc['taskDefinition']}")
print(f"  Running    : {svc['runningCount']}")
print(f"  LoadBalancers attached: {svc['loadBalancers']}")
EOF
