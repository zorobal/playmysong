#!/bin/bash

BASE_URL="http://localhost:4000"

echo "=== 1. Login User ==="
USER_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@playmysong.local","password":"changeme"}' | jq -r '.token')
echo "User Token: $USER_TOKEN"

echo "=== 2. Créer une requête (User) ==="
REQ_RESP=$(curl -s -X POST "$BASE_URL/request" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"establishmentId":1,"youtubeId":"abc123","title":"Billie Jean","artist":"Michael Jackson","durationSec":240,"message":"Play this classic!"}')
echo "Request Response: $REQ_RESP"
REQUEST_ID=$(echo $REQ_RESP | jq -r '.requestId')
echo "Request ID: $REQUEST_ID"

echo "=== 3. Login Admin ==="
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@playmysong.local","password":"changeme"}' | jq -r '.token')
echo "Admin Token: $ADMIN_TOKEN"

echo "=== 4. Voir requêtes en attente (Admin) ==="
curl -s -X GET "$BASE_URL/request/pending" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "=== 5. Valider la requête (Admin) ==="
curl -s -X POST "$BASE_URL/request/$REQUEST_ID/validate" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .

echo "=== 6. Playlist courante (Public) ==="
curl -s -X GET "$BASE_URL/request/playlist/current?establishmentId=1" | jq .
