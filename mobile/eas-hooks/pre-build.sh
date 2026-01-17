#!/bin/bash

if [ -z "$GOOGLE_SERVICES_JSON" ]; then
  echo "⚠️  GOOGLE_SERVICES_JSON not set. Skipping google-services.json generation."
  exit 0
fi

# Cria o diretório se não existir
mkdir -p android/app

# Escreve o conteúdo do secret para o arquivo google-services.json no local correto
echo "$GOOGLE_SERVICES_JSON" > android/app/google-services.json
echo "✅ google-services.json created in android/app/ from EAS secret"

