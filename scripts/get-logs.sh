#!/bin/bash
# get-logs.sh -- Fetch the latest ECS container logs from CloudWatch

AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
LOG_GROUP="/ecs/scribe-api"

# Current running task stream
STREAM="ecs/scribe-api/0556c256f045457a9e9987621e10beed"
echo "Log stream: $STREAM"
echo ""

$AWS logs get-log-events \
  --log-group-name "$LOG_GROUP" \
  --log-stream-name "$STREAM" \
  --region "$REGION" \
  --limit 80 \
  --output json | python3 -c "
import json, sys
events = json.load(sys.stdin)['events']
for e in events:
    print(e['message'])
"
