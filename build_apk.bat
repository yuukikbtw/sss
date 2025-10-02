@echo off
chcp 65001 >nul
color 0E
echo.
echo ════════════════════════════════════════════════════
echo           📱 СБОРКА ANDROID APK
echo ════════════════════════════════════════════════════
echo.

REM Проверка Node.js
echo ⚙️  Проверка Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js не найден! Установи с nodejs.org
    pause
    exit /b 1
)
echo ✅ Node.js найден

REM Проверка Java
echo.
echo ⚙️  Проверка Java JDK...
where java >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Java JDK не найден!
    echo.
    echo 📥 Скачай Java JDK 17 или 21:
    echo    https://adoptium.net/
    echo.
    echo После установки добавь в PATH:
    echo    C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot\bin
    pause
    exit /b 1
)
echo ✅ Java найден

REM Проверка Android SDK
echo.
echo ⚙️  Проверка Android SDK...
if not exist "%ANDROID_HOME%\platform-tools\adb.exe" (
    echo ⚠️  Android SDK не найден!
    echo.
    echo 📥 Установи Android Studio:
    echo    https://developer.android.com/studio
    echo.
    echo После установки добавь переменную окружения:
    echo    ANDROID_HOME = C:\Users\%USERNAME%\AppData\Local\Android\Sdk
    echo.
    echo Продолжить без проверки? (APK может не собраться)
    pause
) else (
    echo ✅ Android SDK найден
)

REM Синхронизация с Android проектом
echo.
echo ════════════════════════════════════════════════════
echo 🔄 Синхронизация файлов с Android проектом...
echo ════════════════════════════════════════════════════
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка синхронизации!
    pause
    exit /b 1
)
echo ✅ Синхронизация завершена

REM Сборка APK
echo.
echo ════════════════════════════════════════════════════
echo 🔨 Сборка Debug APK...
echo ════════════════════════════════════════════════════
cd android
if not exist "gradlew.bat" (
    echo ❌ gradlew.bat не найден!
    echo    Попробуй открыть проект в Android Studio:
    echo    npx cap open android
    pause
    exit /b 1
)

echo.
echo 📦 Запуск Gradle сборки (это может занять несколько минут)...
echo.
call gradlew.bat assembleDebug

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ════════════════════════════════════════════════════
    echo ❌ ОШИБКА СБОРКИ!
    echo ════════════════════════════════════════════════════
    echo.
    echo 💡 Решения:
    echo.
    echo 1. Открой проект в Android Studio и дождись синхронизации:
    echo    npx cap open android
    echo.
    echo 2. Проверь что установлено:
    echo    - Java JDK 17 или 21
    echo    - Android SDK
    echo    - Android SDK Build-Tools
    echo.
    echo 3. Создай файл android\local.properties:
    echo    sdk.dir=C:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk
    echo.
    echo 4. Проверь переменные окружения:
    echo    ANDROID_HOME = %ANDROID_HOME%
    echo    JAVA_HOME = %JAVA_HOME%
    echo.
    pause
    cd ..
    exit /b 1
)

cd ..

REM Поиск APK файла
echo.
echo ════════════════════════════════════════════════════
echo 🔍 Поиск APK файла...
echo ════════════════════════════════════════════════════

set APK_PATH=android\app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_PATH%" (
    echo.
    echo ════════════════════════════════════════════════════
    echo ✅ APK УСПЕШНО СОЗДАН!
    echo ════════════════════════════════════════════════════
    echo.
    echo 📱 APK файл: %APK_PATH%
    echo.
    for %%A in ("%APK_PATH%") do (
        echo 📦 Размер: %%~zA байт
    )
    echo.
    echo ════════════════════════════════════════════════════
    echo 📲 УСТАНОВКА НА УСТРОЙСТВО:
    echo ════════════════════════════════════════════════════
    echo.
    echo Способ 1: USB кабель
    echo    1. Подключи телефон к компьютеру
    echo    2. Включи "Отладка по USB" на телефоне
    echo    3. Запусти: adb install "%APK_PATH%"
    echo.
    echo Способ 2: Файл
    echo    1. Скопируй APK на телефон
    echo    2. Открой файл на телефоне
    echo    3. Разреши установку из неизвестных источников
    echo    4. Установи приложение
    echo.
    echo ════════════════════════════════════════════════════
    echo 💡 ВАЖНО:
    echo ════════════════════════════════════════════════════
    echo.
    echo Для работы приложения нужно:
    echo.
    echo 1. Запустить Flask сервер на компьютере:
    echo    .\start_all.bat
    echo.
    echo 2. Узнать IP адрес компьютера:
    echo    ipconfig
    echo.
    echo 3. Обновить API_BASE в www\java.js:
    echo    const API_BASE = 'http://ВАШ_IP:5001/api';
    echo.
    echo 4. Пересобрать APK:
    echo    .\build_apk.bat
    echo.
    echo ИЛИ задеплоить Flask на облако (Heroku, Railway, Render)
    echo.
    echo ════════════════════════════════════════════════════
    echo.
    echo Хочешь открыть папку с APK? (Y/N)
    choice /C YN /M "Открыть папку"
    if errorlevel 2 goto :skip_open
    if errorlevel 1 explorer "android\app\build\outputs\apk\debug"
    :skip_open
    echo.
    echo Хочешь попробовать установить через ADB? (Y/N)
    choice /C YN /M "Установить через ADB"
    if errorlevel 2 goto :end
    if errorlevel 1 (
        echo.
        echo Проверка подключенных устройств...
        adb devices
        echo.
        echo Установка APK...
        adb install -r "%APK_PATH%"
        if %ERRORLEVEL% EQU 0 (
            echo ✅ APK успешно установлен на устройство!
        ) else (
            echo ❌ Не удалось установить APK
            echo    Проверь что устройство подключено и отладка по USB включена
        )
    )
) else (
    echo ❌ APK файл не найден!
    echo    Ожидаемый путь: %APK_PATH%
)

:end
echo.
echo ════════════════════════════════════════════════════
pause
