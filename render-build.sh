#!/usr/bin/env bash

# Exit on error
set -o errexit

# Install FFmpeg
echo "Installing FFmpeg..."
sudo apt-get update
sudo apt-get install -y ffmpeg

# Update pip
echo "Updating pip..."
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "Build script finished successfully."

