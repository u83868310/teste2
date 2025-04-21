#!/bin/bash

# Script de inicialização para o Glitch
echo "Iniciando aplicação IPTV Streaming Platform..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Por favor, instale o Node.js na sua instância Glitch."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências... (isso pode levar alguns minutos)"
    npm install
fi

# Iniciar o servidor
echo "Iniciando servidor Express + Vite..."
npm start
