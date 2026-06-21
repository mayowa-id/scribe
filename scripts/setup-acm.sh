#!/bin/bash
# setup-acm.sh -- Requests an ACM cert and gets the validation CNAME

AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
DOMAIN="api.geraniol.xyz"

echo "Requesting certificate for $DOMAIN..."
CERT_ARN=$($AWS acm request-certificate \
    --domain-name "$DOMAIN" \
    --validation-method DNS \
    --region "$REGION" \
    --output text \
    --query 'CertificateArn')

echo "Certificate requested: $CERT_ARN"
echo "Waiting a few seconds for validation options to populate..."
sleep 5

echo "Validation Options:"
$AWS acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region "$REGION" \
    --output json | python3 -c "
import json, sys
data = json.load(sys.stdin)
opts = data['Certificate']['DomainValidationOptions'][0]['ResourceRecord']
print(f\"Name:  {opts['Name']}\")
print(f\"Type:  {opts['Type']}\")
print(f\"Value: {opts['Value']}\")
"
