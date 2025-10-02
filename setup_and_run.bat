@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title 🎯 Habit Tracker - Авто установка и запуск
color 0B
echo.
echo ══════════════════════════════════════════════════════════════════════
echo           🎯 HABIT TRACKER - АВТОМАТИЧЕСКАЯ УСТАНОВКА
echo ══════════════════════════════════════════════════════════════════════
echo.

REM Переходим в директорию скрипта
cd /d "%~dp0"
echo 📁 Рабочая директория: %CD%
echo.

REM Проверяем наличие Python
echo ══════════════════════════════════════════════════════════════════════
echo ⚙️  ШАГ 1: Проверка Python
echo ══════════════════════════════════════════════════════════════════════
echo.
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python не найден в PATH!
    echo Попытка найти Python вручную...
    
    REM Ищем Python в стандартных местах
    set "PYTHON_EXE="
    for %%P in (
        "C:\Program Files\Python313\python.exe"
        "C:\Program Files\Python312\python.exe"
        "C:\Program Files\Python311\python.exe"
        "C:\Program Files\Python310\python.exe"
        "C:\Python313\python.exe"
        "C:\Python312\python.exe"
        "C:\Python311\python.exe"
        "C:\Python310\python.exe"
    ) do (
        if exist %%P (
            set "PYTHON_EXE=%%P"
            echo ✅ Найден Python: %%P
            goto :python_found
        )
    )
    
    echo ❌ Python не найден! Установите Python и добавьте в PATH.
    pause
    exit /b 1
) else (
    set "PYTHON_EXE=python"
    echo ✅ Python найден в PATH
)

:python_found
echo.
echo ══════════════════════════════════════════════════════════════════════
echo 📦 ШАГ 2: Проверка зависимостей
echo ══════════════════════════════════════════════════════════════════════
echo.

%PYTHON_EXE% -c "import flask, pymongo" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Не все зависимости установлены
    echo 📥 Устанавливаем requirements.txt...
    echo.
    %PYTHON_EXE% -m pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo ❌ Ошибка установки зависимостей!
        echo 💡 Попробуйте вручную: pip install flask pymongo
        pause
        exit /b 1
    )
    echo.
    echo ✅ Зависимости успешно установлены!
) else (
    echo ✅ Все зависимости уже установлены
)

echo.
echo ══════════════════════════════════════════════════════════════════════
echo 🚀 ШАГ 3: Запуск серверов
echo ══════════════════════════════════════════════════════════════════════
echo.

echo � Запускаем Flask API Server (порт 5001)...
start "🔌 Habit Tracker API" cmd /k "title Flask API ^& color 0B ^& %PYTHON_EXE% py.py"
timeout /t 3 /nobreak >nul

echo 🌐 Запускаем Static Web Server (порт 8000)...
start "🌐 Static Server" cmd /k "title Static Server ^& color 0E ^& %PYTHON_EXE% static_server.py"
timeout /t 2 /nobreak >nul

echo.
echo ══════════════════════════════════════════════════════════════════════
echo ✅ ГОТОВО! СЕРВЕРЫ УСПЕШНО ЗАПУЩЕНЫ!
echo ══════════════════════════════════════════════════════════════════════
echo.
echo � Веб-приложение:  http://localhost:8000
echo 🔌 API Backend:     http://localhost:5001/api
echo 💚 Health Check:    http://localhost:5001/api/health
echo.
echo 📝 Откройте в браузере: http://localhost:8000
echo 🛑 Остановить:          stop_servers.bat
echo.
echo ══════════════════════════════════════════════════════════════════════
echo 💡 Серверы работают в отдельных окнах
echo 💡 Закройте это окно или нажмите любую клавишу
echo ══════════════════════════════════════════════════════════════════════
echo.
pause >nul