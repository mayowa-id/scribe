#!/bin/bash
# push-secrets.sh -- Reads secrets from local .env and pushes to AWS SSM Parameter Store.
# This script is safe to commit -- no actual values are hardcoded here.
# Usage: bash push-secrets.sh (run from the project root where .env lives)

set -e
AWS="$HOME/.local/bin/aws"
REGION="eu-north-1"
PREFIX="/scribe/prod"

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  echo "ERROR: .env file not found. Run this from the project root."
  exit 1
fi

echo "Reading secrets from $ENV_FILE and pushing to SSM at $PREFIX..."

# Helper: read a value from .env by key
get_env() {
  grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d '=' -f2-
}

# Helper: put a parameter to SSM
put_param() {
  local name="$1"
  local value="$2"
  local type="${3:-SecureString}"

  if [ -z "$value" ]; then
    echo "  SKIP: $PREFIX/$name (not set in .env)"
    return
  fi

  $AWS ssm put-parameter \
    --name "$PREFIX/$name" \
    --value "$value" \
    --type "$type" \
    --overwrite \
    --region "$REGION" \
    --no-cli-pager > /dev/null

  echo "  OK: $PREFIX/$name"
}

# -- App --
put_param "NODE_ENV"               "production"          "String"
put_param "SERVER_PORT"            "3000"                "String"

# -- Database --
put_param "DB_HOST"                "$(get_env DB_HOST)"               "String"
put_param "DB_PORT"                "$(get_env DB_PORT)"               "String"
put_param "DB_USER"                "$(get_env DB_USER)"               "String"
put_param "DB_PASSWORD"            "$(get_env DB_PASSWORD)"
put_param "DB_DATABASE"            "$(get_env DB_DATABASE)"           "String"

# -- Redis --
put_param "REDIS_HOST"             "$(get_env REDIS_HOST)"            "String"
put_param "REDIS_PORT"             "$(get_env REDIS_PORT)"            "String"

# -- JWT --
put_param "JWT_SECRET"             "$(get_env JWT_SECRET)"
put_param "JWT_REFRESH_SECRET"     "$(get_env JWT_REFRESH_SECRET)"
put_param "AUTH_EXPIRESIN"         "$(get_env AUTH_EXPIRESIN)"        "String"
put_param "AUTH_REFRESH_EXPIRESIN" "$(get_env AUTH_REFRESH_EXPIRESIN)" "String"

# -- Google OAuth --
put_param "GOOGLE_CLIENT_ID"       "$(get_env GOOGLE_CLIENT_ID)"      "String"
put_param "GOOGLE_CLIENT_SECRET"   "$(get_env GOOGLE_CLIENT_SECRET)"
put_param "GOOGLE_CALLBACK_URL"    "$(get_env GOOGLE_CALLBACK_URL)"   "String"

# -- AI --
put_param "GOOGLE_AI_API_KEY"      "$(get_env GOOGLE_AI_API_KEY)"

# -- Paystack --
put_param "PAYSTACK_SECRET_KEY"    "$(get_env PAYSTACK_SECRET_KEY)"
put_param "PAYSTACK_PUBLIC_KEY"    "$(get_env PAYSTACK_PUBLIC_KEY)"   "String"

# -- Notiscope --
put_param "NOTISCOPE_BASE_URL"     "$(get_env NOTISCOPE_BASE_URL)"    "String"
put_param "NOTISCOPE_FROM_EMAIL"   "$(get_env NOTISCOPE_FROM_EMAIL)"  "String"
put_param "SES_FROM_EMAIL"         "$(get_env SES_FROM_EMAIL)"        "String"

# -- AWS Credentials (for Notiscope SES) --
put_param "AWS_ACCESS_KEY_ID"      "$(get_env AWS_ACCESS_KEY_ID)"     "String"
put_param "AWS_SECRET_ACCESS_KEY"  "$(get_env AWS_SECRET_ACCESS_KEY)"

# -- Frontend --
put_param "FRONTEND_URL"           "$(get_env FRONTEND_URL)"          "String"

echo ""
echo "All secrets synced to SSM at prefix: $PREFIX"
