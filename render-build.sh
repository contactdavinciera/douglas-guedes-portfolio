#!/usr/bin/env bash
# Instalar FFmpeg
apt-get update
apt-get install -y ffmpeg

# Instalar dependências Python
pip install -r color-studio-backend/requirements.txt

