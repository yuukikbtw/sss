@echo off
chcp 65001 >nul
cd /d "%~dp0"

python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Install Python 3.8+
    pause
    exit /b 1
)

python -c "import flask, pymongo" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    python -m pip install -r requirements.txt
    if errorlevel 1 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

start "API" cmd /k "pushd "%~dp0" & python py.py"
timeout /t 4 /nobreak >nul
start "Static" cmd /k "pushd "%~dp0" & python static_server.py"

echo.
echo App:  http://127.0.0.1:8000
echo API:  http://127.0.0.1:5001/api
echo.
pause
