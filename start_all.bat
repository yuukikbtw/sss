@echo off
chcp 65001 >nul
title 🎯 Habit Tracker - Серверы
color 0A
echo.
echo ════════════════════════════════════════════════════
echo           🎯 HABIT TRACKER - ЗАПУСК СЕРВЕРОВ
echo ════════════════════════════════════════════════════
echo.

REM Переходим в директорию батника
cd /d "%~dp0"
echo 📁 Рабочая директория: %CD%
echo.

echo ⚙️  Проверка Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден! Установите Python 3.8+
    pause
    exit /b 1
)
echo ✅ Python найден
echo.

echo 🚀 Запускаем Flask API (порт 5001)...
start "🔌 Habit Tracker API" cmd /k "title Flask API ^& color 0B ^& python py.py"
timeout /t 3 /nobreak >nul

echo 🌐 Запускаем Static Server (порт 8000)...
start "🌍 Static Server" cmd /k "title Static Server ^& color 0E ^& python static_server.py"
timeout /t 2 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════
echo ✅ СЕРВЕРЫ УСПЕШНО ЗАПУЩЕНЫ!
echo ════════════════════════════════════════════════════
echo.
echo � Веб-приложение:  http://localhost:8000
echo 🔌 API Backend:     http://localhost:5001/api
echo � Health Check:    http://localhost:5001/api/health
echo.
echo 💡 Используй stop_servers.bat для остановки
echo ════════════════════════════════════════════════════
echo.
pause