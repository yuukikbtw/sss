@echo off
chcp 65001 >nul
color 0A
cls
echo.
echo ════════════════════════════════════════════════════
echo        🔄 БЫСТРАЯ ПЕРЕСБОРКА APK
echo ════════════════════════════════════════════════════
echo.

echo 📋 Шаг 1/4: Синхронизация файлов...
copy /Y index.html www\ >nul 2>&1
copy /Y java.js www\ >nul 2>&1
copy /Y css.css www\ >nul 2>&1
copy /Y manifest.json www\ >nul 2>&1
copy /Y service-worker.js www\ >nul 2>&1
copy /Y icons\*.png www\ >nul 2>&1
echo ✅ Файлы синхронизированы

echo.
echo 📋 Шаг 2/4: Синхронизация с Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка синхронизации
    pause
    exit /b 1
)
echo ✅ Capacitor синхронизирован

echo.
echo 📋 Шаг 3/4: Сборка APK...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка сборки APK
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ APK собран успешно!

echo.
echo 📋 Шаг 4/4: Копирование APK в корень...
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "app-debug.apk" >nul 2>&1
echo ✅ APK скопирован в корень проекта!

echo.
echo ════════════════════════════════════════════════════
echo           ✨ СБОРКА ЗАВЕРШЕНА!
echo ════════════════════════════════════════════════════
echo.
echo 📱 APK файл готов:
echo    📂 c:\sss\app-debug.apk
echo    📂 android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo 💡 Что дальше:
echo    1. Скопируйте app-debug.apk на телефон
echo    2. Установите приложение
echo    3. Запустите сервер: start_all.bat
echo    4. Убедитесь что телефон и ПК в одной WiFi сети
echo.
pause
