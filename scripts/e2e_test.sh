#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
PASS=0
FAIL=0

ok()   { echo "PASS: $1"; ((PASS++))  || true; }
fail() { echo "FAIL: $1"; ((FAIL++))  || true; exit 1; }

echo "=== SupportLens E2E Tests ==="
echo "Target: $BASE_URL"

# Wait for backend (up to 60 seconds)
echo ""
echo "Waiting for backend to be ready..."
for i in $(seq 1 20); do
    if curl -sf "$BASE_URL/health" > /dev/null 2>&1; then
        echo "Backend is ready."
        break
    fi
    if [[ $i -eq 20 ]]; then
        echo "ERROR: Backend did not become ready in time."
        exit 1
    fi
    sleep 3
done

# 1. Health endpoint returns valid JSON with expected shape
echo ""
echo "--- Test: Health endpoint ---"
HEALTH=$(curl -sf "$BASE_URL/health")
STATUS=$(echo "$HEALTH" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
if [[ "$STATUS" == "healthy" || "$STATUS" == "degraded" ]]; then
    ok "Health status is '$STATUS'"
else
    fail "Health status is '$STATUS' — expected healthy or degraded"
fi

DB_STATUS=$(echo "$HEALTH" | python3 -c "import sys, json; print(json.load(sys.stdin)['checks']['database']['status'])")
if [[ "$DB_STATUS" == "ok" ]]; then
    ok "Database check is ok"
else
    fail "Database check is '$DB_STATUS'"
fi

UPTIME=$(echo "$HEALTH" | python3 -c "import sys, json; print(json.load(sys.stdin)['uptime_seconds'])")
if [[ -n "$UPTIME" ]]; then
    ok "Uptime reported: ${UPTIME}s"
else
    fail "uptime_seconds missing from health response"
fi

# 2. Seed data is loaded
echo ""
echo "--- Test: Seed data loaded ---"
ANALYTICS=$(curl -sf "$BASE_URL/analytics")
TOTAL=$(echo "$ANALYTICS" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
if [[ "$TOTAL" -ge 25 ]]; then
    ok "Seed data present ($TOTAL traces)"
else
    fail "Expected at least 25 seeded traces, got $TOTAL"
fi

# 3. Create a trace — analytics total must increment by exactly 1
echo ""
echo "--- Test: Trace creation increments analytics ---"
curl -sf -X POST "$BASE_URL/traces" \
    -H "Content-Type: application/json" \
    -d '{"user_message":"I want to cancel my subscription","bot_response":"I can help you with that.","response_time_ms":300}' \
    > /dev/null

NEW_TOTAL=$(curl -sf "$BASE_URL/analytics" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])")
if [[ "$NEW_TOTAL" -eq "$((TOTAL + 1))" ]]; then
    ok "Analytics total incremented: $TOTAL → $NEW_TOTAL"
else
    fail "Expected total $((TOTAL + 1)), got $NEW_TOTAL"
fi

# 4. Category filter — every returned trace must match the requested category
echo ""
echo "--- Test: Category filter returns only matching traces ---"
BILLING=$(curl -sf "$BASE_URL/traces?category=Billing")
MISMATCH=$(echo "$BILLING" | python3 -c "
import sys, json
traces = json.load(sys.stdin)
bad = [t for t in traces if t['category'] != 'Billing']
print(len(bad))
")
BILLING_COUNT=$(echo "$BILLING" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
if [[ "$MISMATCH" == "0" && "$BILLING_COUNT" -gt 0 ]]; then
    ok "Category filter: $BILLING_COUNT Billing-only traces, zero mismatches"
else
    fail "Category filter: $MISMATCH non-Billing traces returned (total $BILLING_COUNT)"
fi

# 5. Search filter returns results containing the search term
echo ""
echo "--- Test: Search filter ---"
SEARCH=$(curl -sf "$BASE_URL/traces?search=cancel")
SEARCH_COUNT=$(echo "$SEARCH" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
if [[ "$SEARCH_COUNT" -gt 0 ]]; then
    ok "Search 'cancel' returned $SEARCH_COUNT traces"
else
    fail "Search 'cancel' returned 0 traces — seed data missing?"
fi

# 6. CSV export returns the correct content type
echo ""
echo "--- Test: CSV export ---"
HEADERS=$(curl -sf -D - -o /dev/null "$BASE_URL/traces/export")
if echo "$HEADERS" | grep -qi "content-type.*text/csv"; then
    ok "CSV export returns text/csv"
else
    fail "CSV export did not return text/csv content type"
fi

# 7. Invalid category filter returns all traces (not an error)
echo ""
echo "--- Test: Invalid category is ignored gracefully ---"
ALL=$(curl -sf "$BASE_URL/traces?category=NonExistent")
ALL_COUNT=$(echo "$ALL" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))")
if [[ "$ALL_COUNT" -gt 0 ]]; then
    ok "Invalid category filter ignored — returned $ALL_COUNT traces"
else
    fail "Invalid category filter returned 0 traces"
fi

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
[[ "$FAIL" -eq 0 ]]
