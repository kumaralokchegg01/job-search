#!/bin/bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}JobIntel Database Verification Test${NC}"
echo -e "${BLUE}===============================================${NC}\n"

# Step 1: Get admin token (assuming default credentials)
echo -e "${YELLOW}Step 1: Getting admin authentication token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123"
  }')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Failed to get authentication token${NC}"
  echo "Response: $TOKEN_RESPONSE"
  echo -e "${YELLOW}Note: Make sure to run the application first and have valid admin credentials${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Token obtained: ${TOKEN:0:20}...${NC}\n"

# Step 2: Call verify-data endpoint
echo -e "${YELLOW}Step 2: Calling database verification endpoint...${NC}"
VERIFY_RESPONSE=$(curl -s -X GET http://localhost:5000/api/admin/verify-data \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo -e "${GREEN}✅ Response received:${NC}\n"
echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"

echo -e "\n${BLUE}===============================================${NC}"
echo -e "${BLUE}Verification Complete!${NC}"
echo -e "${BLUE}===============================================${NC}"
