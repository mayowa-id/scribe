#!/bin/bash
# test-api.sh -- Functional tests against the live Scribe API on AWS
# Tests: health, register, login, refresh, logout

set -e
BASE="http://scribe-alb-1676123431.eu-north-1.elb.amazonaws.com"
EMAIL="testuser_$(date +%s)@scribe-test.com"
PASSWORD="Test@12345"

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; }
section() { echo ""; echo "=== $1 ==="; }

# -------------------------------------------------------
# 1. Health check
# -------------------------------------------------------
section "Health Check"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" "$BASE/health")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "200" ]; then
  pass "GET /health -> 200 | $BODY"
else
  fail "GET /health -> $RESP | $BODY"
fi

# -------------------------------------------------------
# 2. Register
# -------------------------------------------------------
section "Auth - Register"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"fullName\":\"Test User\"}")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "200" ] || [ "$RESP" = "201" ]; then
  pass "POST /auth/register -> $RESP"
  ACCESS_TOKEN=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['accessToken'])" 2>/dev/null)
  REFRESH_TOKEN=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['refreshToken'])" 2>/dev/null)
  echo "  Access token: ${ACCESS_TOKEN:0:40}..."
else
  fail "POST /auth/register -> $RESP | $BODY"
  exit 1
fi

# -------------------------------------------------------
# 3. Login
# -------------------------------------------------------
section "Auth - Login"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "200" ] || [ "$RESP" = "201" ]; then
  pass "POST /auth/login -> $RESP"
  ACCESS_TOKEN=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['accessToken'])" 2>/dev/null)
  REFRESH_TOKEN=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['refreshToken'])" 2>/dev/null)
else
  fail "POST /auth/login -> $RESP | $BODY"
  exit 1
fi

# -------------------------------------------------------
# 4. Refresh token
# -------------------------------------------------------
section "Auth - Refresh Token"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" -X POST "$BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "200" ] || [ "$RESP" = "201" ]; then
  pass "POST /auth/refresh -> $RESP"
  ACCESS_TOKEN=$(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['data']['accessToken'])" 2>/dev/null)
else
  fail "POST /auth/refresh -> $RESP | $BODY"
fi

# -------------------------------------------------------
# 5. Get profile (protected route)
# -------------------------------------------------------
section "User - Get Profile (JWT protected)"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" -X GET "$BASE/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "200" ]; then
  pass "GET /users/me -> $RESP"
  echo "  $(echo "$BODY" | python3 -c "import json,sys; d=json.load(sys.stdin); print('User:', d['data']['email'])" 2>/dev/null)"
else
  fail "GET /users/me -> $RESP | $BODY"
fi

# -------------------------------------------------------
# 6. Protected route without token (expect 401)
# -------------------------------------------------------
section "Security - Unauthorized Access"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" -X GET "$BASE/users/me")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "401" ]; then
  pass "GET /users/me (no token) -> 401 as expected"
else
  fail "GET /users/me (no token) -> $RESP (expected 401)"
fi

# -------------------------------------------------------
# 7. Logout
# -------------------------------------------------------
section "Auth - Logout"
RESP=$(curl -s -o /tmp/body.txt -w "%{http_code}" -X POST "$BASE/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
BODY=$(cat /tmp/body.txt)
if [ "$RESP" = "200" ] || [ "$RESP" = "201" ]; then
  pass "POST /auth/logout -> $RESP"
else
  fail "POST /auth/logout -> $RESP | $BODY"
fi

echo ""
echo "=== Test run complete ==="
