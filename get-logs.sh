#!/bin/bash
# get-logs.sh -- Fetch the latest ECS container logs from CloudWatch

AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
LOG_GROUP="/ecs/"

# Current running task stream
STREAM="ecs/scribe-api/180d47e51b1b4e88a708a454abb919b5"
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
