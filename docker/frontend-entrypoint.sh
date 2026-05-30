#!/bin/sh
set -e

# Write runtime config before serving the built frontend.
# API_URL can be set as a Docker env var at container start — no image rebuild needed.
#
# Local / Docker (no API_URL set) → empty string → getApiBaseUrl() auto-derives
#   from window.location.hostname:3000
#
# Cloudflare / custom domain (API_URL=https://api.yourdomain.com) → written here,
#   picked up by getApiBaseUrl() at runtime in the browser.

cat > /app/packages/frontend/dist/config.js <<EOF
window.__APP_CONFIG__ = { apiUrl: "${API_URL:-}" };
EOF

exec pnpm exec vite preview --host 0.0.0.0 --port 5173
