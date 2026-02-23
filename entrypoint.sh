#!/bin/sh
set -e
# Nginx em background (stdout/stderr do container ficam com o Node)
nginx -g "daemon off;" &
# Node em primeiro plano = todos os logs do backend aparecem no Dozzle
cd /app/backend && exec node dist/server.js
