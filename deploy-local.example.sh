#!/bin/bash

# Script de Deploy Local - Atacte (EXEMPLO)
# Copie este arquivo para deploy-local.sh e ajuste o IP

echo "🚀 Deploy Local do Atacte"

# Verificar se está conectado à rede local
echo "🌐 Conectando ao servidor local..."

# Configurações (AJUSTE CONFORME SEU SERVIDOR)
SERVER_HOST="SEU_IP_AQUI"  # Exemplo: 192.168.1.100
SERVER_USER="seu_usuario"  # Exemplo: fernando
SERVER_PATH="/caminho/do/projeto"  # Exemplo: /home/fernando/atacte

echo "📁 Preparando arquivos..."

# Criar diretório temporário
TEMP_DIR="/tmp/atacte-deploy"
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copiar arquivos necessários
cp -r backend/ $TEMP_DIR/
cp -r web/ $TEMP_DIR/
cp -r nginx/ $TEMP_DIR/
cp docker-compose.yml $TEMP_DIR/
cp Dockerfile $TEMP_DIR/
cp entrypoint.sh $TEMP_DIR/

# Remover arquivos desnecessários
find $TEMP_DIR -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find $TEMP_DIR -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true
find $TEMP_DIR -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

echo "📤 Enviando para servidor..."

# Enviar via rsync
rsync -av --progress $TEMP_DIR/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

echo "🚀 Iniciando aplicação no servidor..."

# Conectar via SSH e executar deploy
ssh $SERVER_USER@$SERVER_HOST << 'EOF'
cd /caminho/do/projeto

# Parar containers antigos
docker-compose down || true

# Iniciar novos containers
docker-compose up -d --build

# Verificar status
sleep 10
docker-compose ps

# Mostrar logs
docker-compose logs --tail=20

echo "✅ Deploy concluído!"
EOF

# Limpar diretório temporário
rm -rf $TEMP_DIR

echo "🎉 Deploy local concluído!"
echo "Acesse: http://SEU_IP_AQUI:3000"
