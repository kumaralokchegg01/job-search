#!/bin/bash

# Login to get token
RESPONSE=$(curl -s -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jobintel.local","password":"AdminPass!23"}')

echo "Login Response:"
echo "$RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$RESPONSE" | jq -r '.token')
echo ""
echo "Token: $TOKEN"
echo "export TOKEN=$TOKEN" > token.env
