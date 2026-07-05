#!/usr/bin/env bash
set -euo pipefail

ACTIVE_FILE=/var/www/.active
BLUE_DIR=/var/www/blue
GREEN_DIR=/var/www/green
NGINX_SITE=/etc/nginx/sites-available/anselio

# ---- Detect active / inactive ----
ACTIVE=$(cat $ACTIVE_FILE 2>/dev/null || echo "blue")
if [ "$ACTIVE" = "blue" ]; then
  INACTIVE="green"
  ACTIVE_PORT=3001
  INACTIVE_PORT=3002
else
  INACTIVE="blue"
  ACTIVE_PORT=3002
  INACTIVE_PORT=3001
fi

INACTIVE_DIR="/var/www/$INACTIVE"
echo "Active: $ACTIVE (:$ACTIVE_PORT) → Deploying to $INACTIVE (:$INACTIVE_PORT)"

# ---- Deploy to inactive ----
cd "$INACTIVE_DIR"
git pull origin main
npm install
npx prisma db push
npm run build

# ---- Start inactive PM2 instance ----
pm2 start ecosystem.config.cjs --only "anselio-$INACTIVE" --update-env

# ---- Health check ----
echo "Health check: http://127.0.0.1:$INACTIVE_PORT"
for i in $(seq 1 15); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$INACTIVE_PORT 2>/dev/null || true)
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "Health check passed (HTTP $HTTP_CODE)"
    break
  fi
  echo "Waiting... attempt $i"
  sleep 4
done

# Final verification
if ! curl -sf http://127.0.0.1:$INACTIVE_PORT > /dev/null 2>&1; then
  echo "✗ Health check FAILED — rolling back"
  pm2 stop "anselio-$INACTIVE" 2>/dev/null || true
  pm2 delete "anselio-$INACTIVE" 2>/dev/null || true
  exit 1
fi

# ---- Swap Nginx upstream ----
sed -i "s/:$ACTIVE_PORT/:$INACTIVE_PORT/g" "$NGINX_SITE"
nginx -t && systemctl reload nginx

# ---- Mark inactive as active ----
echo "$INACTIVE" > "$ACTIVE_FILE"

# ---- Stop old instance ----
pm2 stop "anselio-$ACTIVE" 2>/dev/null || true
pm2 delete "anselio-$ACTIVE" 2>/dev/null || true

pm2 save

echo "✓ Swapped: $ACTIVE → $INACTIVE (now live on :$INACTIVE_PORT)"
