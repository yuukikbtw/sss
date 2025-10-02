@echo off
chcp 65001 >nul
color 0C
echo.
echo ════════════════════════════════════════════════════
echo      ❌ ТРЕБУЕТСЯ JAVA 11+ ДЛЯ СБОРКИ APK
echo ════════════════════════════════════════════════════
echo.
echo 🔍 Текущая версия Java:
java -version 2>&1 | findstr "version"
echo.
echo ════════════════════════════════════════════════════
echo 📥 ЧТО НУЖНО СДЕЛАТЬ:
echo ════════════════════════════════════════════════════
echo.
echo 1. Скачай и установи Java JDK 17 или 21:
echo.
echo    ► Eclipse Temurin (РЕКОМЕНДУЕТСЯ):
echo      https://adoptium.net/
echo.
echo    ► Oracle JDK:
echo      https://www.oracle.com/java/technologies/downloads/
echo.
echo 2. Выбери версию:
echo    ✅ JDK 17 LTS (стабильная, рекомендуется)
echo    ✅ JDK 21 LTS (новая, тоже хороша)
echo.
echo 3. При установке:
echo    ☑️ Выбери "Add to PATH"
echo    ☑️ Установи JAVA_HOME автоматически
echo.
echo 4. После установки ПЕРЕЗАПУСТИ PowerShell/CMD
echo.
echo 5. Проверь что Java обновилась:
echo    java -version
echo    (должна быть версия 11+)
echo.
echo 6. Снова запусти:
echo    .\build_apk.bat
echo.
echo ════════════════════════════════════════════════════
echo 💡 БЫСТРАЯ УСТАНОВКА ЧЕРЕЗ CHOCOLATEY:
echo ════════════════════════════════════════════════════
echo.
echo Если у тебя установлен Chocolatey, можно так:
echo.
echo    choco install temurin17
echo.
echo Или:
echo.
echo    choco install temurin21
echo.
echo ════════════════════════════════════════════════════
echo 🔧 РУЧНАЯ НАСТРОЙКА (если не добавилось в PATH):
echo ════════════════════════════════════════════════════
echo.
echo 1. Найди где установилась Java:
echo    C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
echo.
echo 2. Добавь в переменные окружения:
echo.
echo    Переменная: JAVA_HOME
echo    Значение: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
echo.
echo 3. Добавь в PATH:
echo    %%JAVA_HOME%%\bin
echo.
echo 4. ПЕРЕЗАПУСТИ PowerShell
echo.
echo ════════════════════════════════════════════════════
echo.
pause
