@echo off
chcp 65001 >nul
color 0B
echo.
echo ════════════════════════════════════════════════════
echo      🌐 ТВОЙ IP АДРЕС ДЛЯ ANDROID ПРИЛОЖЕНИЯ
echo ════════════════════════════════════════════════════
echo.

echo 📡 Локальные IP адреса этого компьютера:
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do (
    echo    ► %%a
)

echo.
echo ════════════════════════════════════════════════════
echo 📝 ИНСТРУКЦИЯ:
echo ════════════════════════════════════════════════════
echo.
echo 1. Выбери IP адрес из 192.168.x.x или 10.x.x.x
echo    (НЕ используй 127.0.0.1 - не работает на Android!)
echo.
echo 2. Открой файл: www\java.js
echo.
echo 3. Найди строку с API_BASE и замени на:
echo.
echo    // For Android app - use computer's IP
echo    function getApiBase^(^) {
echo        if ^(window.Capacitor^) {
echo            return 'http://ВАШ_IP:5001/api';  // Замени ВАШ_IP
echo        }
echo        return 'http://127.0.0.1:5001/api';
echo    }
echo.
echo 4. Пересобери APK:
echo    .\build_apk.bat
echo.
echo ════════════════════════════════════════════════════
echo 💡 ВАЖНО:
echo ════════════════════════════════════════════════════
echo.
echo - Телефон и компьютер должны быть в ОДНОЙ Wi-Fi сети!
echo - На компьютере должен работать Flask сервер (.\start_all.bat)
echo - Убедись что Windows Firewall разрешает подключения на порт 5001
echo.
echo Для отключения firewall на порт 5001 (если не работает):
echo    netsh advfirewall firewall add rule name="Flask API" dir=in action=allow protocol=TCP localport=5001
echo.
echo ════════════════════════════════════════════════════
echo.
pause
