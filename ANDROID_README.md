# 📱 Habit Tracker - Android App

🎯 **Трекер привычек** - мобильное приложение для Android для отслеживания ежедневных привычек.

## ✨ Возможности

- ✅ Создание и управление привычками
- 📊 Статистика выполнения (стрики, процент выполнения)
- 📅 Календарь привычек
- 🎨 Категории с эмодзи
- 🔐 Авторизация и регистрация
- 💾 Синхронизация с облачной MongoDB
- 📱 Нативное Android приложение
- 🌐 Работает оффлайн (PWA кеширование)

## 📥 Установка готового APK

### Вариант 1: Скачать готовый APK (если есть)

1. Скачай `app-debug.apk` на телефон
2. Открой файл
3. Разреши установку из неизвестных источников:
   - **Android 8+**: Настройки → Приложения → Особые права → Установка неизвестных приложений → Файлы → Разрешить
   - **Android 7 и ниже**: Настройки → Безопасность → Неизвестные источники → Включить
4. Нажми "Установить"

### Вариант 2: Установка через ADB (если телефон подключен к ПК)

```bash
# Включи "Отладка по USB" на телефоне:
# Настройки → О телефоне → 7 раз нажми "Номер сборки"
# Настройки → Для разработчиков → Отладка по USB → Включить

# Подключи телефон к компьютеру USB кабелем

# Установи APK:
adb install app-debug.apk
```

## 🔧 Сборка из исходников

### Требования

- **Node.js** 18+ (установлен)
- **Java JDK** 8, 11, 17 или 21
- **Android Studio** (опционально, но рекомендуется)
- **Android SDK** (встроен в Android Studio)

### Быстрая сборка

```bash
# 1. Синхронизируй файлы с Android проектом
npx cap sync android

# 2. Собери APK автоматически
.\build_apk.bat

# APK будет в: android\app\build\outputs\apk\debug\app-debug.apk
```

### Ручная сборка через Gradle

```bash
cd android
.\gradlew.bat assembleDebug

# Release версия (нужен keystore):
.\gradlew.bat assembleRelease
```

### Сборка через Android Studio

```bash
# Открой проект в Android Studio:
npx cap open android

# В Android Studio:
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

## ⚙️ Настройка Backend

Приложение работает с Flask API сервером. Есть 2 варианта:

### Вариант 1: Локальный сервер (для разработки)

```bash
# 1. Узнай IP адрес компьютера:
.\get_ip.bat
# Или: ipconfig (найди IPv4 адрес типа 192.168.x.x)

# 2. Открой www\java.js и обнови getApiBase():
function getApiBase() {
    if (window.Capacitor) {
        return 'http://192.168.1.100:5001/api';  // Твой IP!
    }
    return 'http://127.0.0.1:5001/api';
}

# 3. Запусти серверы на компьютере:
.\start_all.bat

# 4. Пересобери APK:
.\build_apk.bat

# ⚠️ ВАЖНО:
# - Телефон и компьютер в одной Wi-Fi сети!
# - Flask сервер должен работать всё время
# - Windows Firewall не блокирует порт 5001
```

### Вариант 2: Облачный сервер (для продакшена)

```bash
# 1. Задеплой Flask API на:
#    - Heroku: https://heroku.com
#    - Railway: https://railway.app
#    - Render: https://render.com
#    - PythonAnywhere: https://pythonanywhere.com

# 2. Обнови www\java.js:
function getApiBase() {
    if (window.Capacitor) {
        return 'https://your-app.herokuapp.com/api';
    }
    return 'http://127.0.0.1:5001/api';
}

# 3. Пересобери APK:
npx cap sync android
.\build_apk.bat
```

## 📝 Структура проекта

```
c:\sss\
├── android/                    # Android проект (Capacitor)
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── assets/
│   │   │       │   └── public/     # Скопированные веб-файлы
│   │   │       └── res/            # Android ресурсы (иконки)
│   │   └── build.gradle
│   └── gradlew.bat
├── www/                        # Веб-файлы приложения
│   ├── index.html
│   ├── java.js                 # Логика приложения
│   ├── css.css
│   └── manifest.json
├── icons/                      # Иконки PWA
├── capacitor.config.json       # Конфигурация Capacitor
├── build_apk.bat              # Скрипт сборки APK
├── get_ip.bat                 # Узнать IP компьютера
└── BUILD_APK.md               # Детальная инструкция
```

## 🐛 Решение проблем

### ❌ "JAVA_HOME is not set"

```bash
# Установи Java JDK:
https://adoptium.net/

# Добавь в PATH:
# C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot\bin

# Установи переменную окружения:
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot"
```

### ❌ "SDK location not found"

```bash
# Создай файл android\local.properties:
sdk.dir=C:\\Users\\ИМЯ\\AppData\\Local\\Android\\Sdk

# Или установи Android Studio и укажи путь к SDK
```

### ❌ Приложение не подключается к API

```bash
# 1. Проверь что Flask сервер запущен:
curl http://localhost:5001/api/health

# 2. На Android используй IP компьютера, НЕ localhost!
#    Правильно:  http://192.168.1.100:5001/api
#    Неправильно: http://localhost:5001/api

# 3. Проверь что телефон и ПК в одной Wi-Fi сети:
ipconfig  # На ПК
# Settings → About → Status → IP address  # На телефоне

# 4. Отключи Windows Firewall для порта 5001:
netsh advfirewall firewall add rule name="Flask API" dir=in action=allow protocol=TCP localport=5001
```

### ❌ APK не устанавливается

```bash
# 1. Включи "Неизвестные источники":
#    Настройки → Безопасность → Неизвестные источники

# 2. Для Android 8+:
#    Настройки → Приложения → Особые права →
#    Установка неизвестных приложений → Файлы → Разрешить

# 3. Проверь что APK не повреждён:
#    Размер файла должен быть > 5 MB
```

### ❌ Gradle build failed

```bash
# 1. Открой в Android Studio и дождись синхронизации:
npx cap open android

# 2. Очисти кеш Gradle:
cd android
.\gradlew.bat clean

# 3. Пересобери:
.\gradlew.bat assembleDebug

# 4. Проверь версию Java:
java -version
# Должна быть Java 8, 11, 17 или 21
```

## 📱 Полезные команды

```bash
# Проверить подключенные устройства
adb devices

# Посмотреть логи приложения
adb logcat | Select-String "Capacitor"

# Удалить приложение
adb uninstall com.habittracker.app

# Переустановить APK
adb install -r app-debug.apk

# Открыть в Android Studio
npx cap open android

# Синхронизировать изменения
npx cap sync android

# Собрать и запустить на устройстве
npx cap run android

# Узнать IP компьютера
.\get_ip.bat
```

## 🎨 Кастомизация

### Изменить название приложения

```xml
<!-- android\app\src\main\res\values\strings.xml -->
<resources>
    <string name="app_name">Мои Привычки</string>
</resources>
```

### Изменить иконку

Положи свои иконки в:
```
android\app\src\main\res\mipmap-hdpi\ic_launcher.png    (72x72)
android\app\src\main\res\mipmap-mdpi\ic_launcher.png    (48x48)
android\app\src\main\res\mipmap-xhdpi\ic_launcher.png   (96x96)
android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png  (144x144)
android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png (192x192)
```

Или используй генератор: https://romannurik.github.io/AndroidAssetStudio/

### Изменить цветовую схему

```xml
<!-- android\app\src\main\res\values\styles.xml -->
<style name="AppTheme" parent="Theme.AppCompat.Light">
    <item name="colorPrimary">#00d4ff</item>
    <item name="colorPrimaryDark">#0099cc</item>
</style>
```

## 🚀 Публикация в Google Play

См. подробную инструкцию в **BUILD_APK.md**

Основные шаги:
1. Создай подписанный keystore
2. Собери release APK/AAB
3. Зарегистрируйся в Google Play Console ($25)
4. Загрузи APK и заполни описание
5. Отправь на модерацию

## 📚 Документация

- 📱 **BUILD_APK.md** - Детальная инструкция по сборке APK
- 📖 **README.md** - Общая информация о проекте
- 🚀 **QUICKSTART.md** - Быстрый старт
- 📦 **INSTALL.md** - Установка зависимостей
- 📝 **CHANGELOG.md** - История изменений

## 💡 Советы

✅ Тестируй на **реальном устройстве** - эмулятор медленный  
✅ Для разработки используй **локальный сервер** на ПК  
✅ Для друзей **задеплой Flask на облако**  
✅ Сохрани **keystore** в безопасное место (нужен для обновлений)  
✅ **IP адрес** компьютера может меняться - перепроверяй  

## 🎯 Roadmap

- [ ] Push уведомления
- [ ] Виджеты на главный экран
- [ ] Backup в Google Drive
- [ ] Темная тема
- [ ] Статистика графиками
- [ ] Напоминания о привычках
- [ ] Поделиться прогрессом

## 📞 Поддержка

Проблемы? Читай:
1. BUILD_APK.md - полная инструкция
2. Раздел "Решение проблем" выше
3. Capacitor документация: https://capacitorjs.com/docs

---

**УДАЧИ! 🚀📱**

Made with ❤️ and ☕
