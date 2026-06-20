#!/bin/bash
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"

$AWS logs describe-log-streams \
  --log-group-name "/ecs/" \
  --region "$REGION" \
  --order-by LastEventTime \
  --descending \
  --max-items 5 \
  --output json > /tmp/streams.json

python3 - << 'PYEOF'
import json
from datetime import datetime

streams = json.load(open("/tmp/streams.json"))["logStreams"]
for s in streams:
    ts = s.get("lastEventTimestamp", 0)
    dt = datetime.utcfromtimestamp(ts / 1000).strftime("%Y-%m-%d %H:%M:%S UTC") if ts else "n/a"
    print(f"Stream : {s['logStreamName']}")
    print(f"Last   : {dt}")
    print()
PYEOF
