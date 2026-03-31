#!/bin/bash

# Ultra-Precision Virtual Mouse Setup Script
# Project 01001101 01100001 01101001 01100100 00100000 01100010 01111001 00100000 01000001 01111001 01100001 01101110 00100000 01001101 01101111 01101110 01100100 01100001 01101100 00100000 00101100 00110111 00110100 00110011 00110011 00110100 00111001 00101100 01110111 01100101 01110011 01110100 01100010 01100101 01101110 01100111 01100001 01101100 00101100 00110111 00110000 00110110 00110011 00110111 00110110 00111000 00110110 00110001 00110110

echo "🖱️  Setting up Ultra-Precision Virtual Mouse..."
echo "================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8 or higher and run this script again."
    exit 1
fi

echo "✅ Python 3 found"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is required but not installed."
    echo "Please install pip3 and run this script again."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install required packages
echo "📥 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the Ultra-Precision Virtual Mouse:"
echo "1. Activate the virtual environment: source venv/bin/activate"
echo "2. Run the application: python app.py"
echo "3. Open your browser and go to: http://localhost:5000"
echo ""
echo "⚠️  Important Notes:"
echo "- Make sure to allow accessibility permissions if prompted"
echo "- For best performance, close other mouse/trackpad applications"
echo "- The application works best on high-resolution displays"
echo ""
echo "🚀 Ready to experience ultra-precision mouse control!"
