#!/bin/bash

if [ -z "$GOOGLE_SERVICES_JSON" ]; then
  echo "⚠️  GOOGLE_SERVICES_JSON not set. Skipping google-services.json generation."
  exit 0
fi

# Escreve o conteúdo do secret para o arquivo google-services.json
echo "$GOOGLE_SERVICES_JSON" > ./google-services.json
echo "✅ google-services.json created from EAS secret"

