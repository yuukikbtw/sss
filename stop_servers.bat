@echo off
chcp 65001 >nul
title 🛑 Habit Tracker - Остановка серверов
color 0C
echo.
echo ══════════════════════════════════════════════════════════════════════
echo           🛑 HABIT TRACKER - ОСТАНОВКА СЕРВЕРОВ
echo ══════════════════════════════════════════════════════════════════════
echo.

echo 🔍 Поиск запущенных серверов...
echo.

echo ⏹️  Останавливаем Flask API (порт 5001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001 ^| findstr LISTENING') do (
    echo    └─ Завершаем процесс PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo ⏹️  Останавливаем Static Server (порт 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
    echo    └─ Завершаем процесс PID: %%a
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ══════════════════════════════════════════════════════════════════════
echo ✅ ВСЕ СЕРВЕРЫ УСПЕШНО ОСТАНОВЛЕНЫ!
echo ══════════════════════════════════════════════════════════════════════
echo.
pause