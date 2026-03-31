@echo off
REM Ultra-Precision Virtual Mouse Launcher
REM Project 01001101 01100001 01101001 01100100 00100000 01100010 01111001 00100000 01000001 01111001 01100001 01101110 00100000 01001101 01101111 01101110 01100100 01100001 01101100 00100000 00101100 00110111 00110100 00110011 00110011 00110100 00111001 00101100 01110111 01100101 01110011 01110100 01100010 01100101 01101110 01100111 01100001 01101100 00101100 00110111 00110000 00110110 00110011 00110111 00110110 00111000 00110110 00110001 00110110

echo 🖱️  Ultra-Precision Virtual Mouse Starting...
echo ============================================

REM Check if virtual environment exists
if not exist "venv" (
    echo ❌ Virtual environment not found!
    echo Please run setup.bat first to install dependencies.
    pause
    exit /b 1
)

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

REM Start the application
echo 🚀 Launching Ultra-Precision Virtual Mouse...
echo.
echo 📱 Open your browser and go to: http://localhost:5000
echo 🛑 Press Ctrl+C to stop the application
echo.

python app.py

pause
