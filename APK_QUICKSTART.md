# 🎯 СОЗДАНИЕ APK - КРАТКАЯ ИНСТРУКЦИЯ

## 📱 ЧТО СДЕЛАНО

✅ Capacitor настроен  
✅ Android проект создан  
✅ Конфигурация готова  
✅ Скрипты сборки созданы  
✅ Иконки сгенерированы  

## ⚠️ ЧТО НУЖНО ДЛЯ СБОРКИ APK

### 1️⃣ JAVA JDK 17 или 21 (ОБЯЗАТЕЛЬНО!)

**Проблема:** У тебя Java 8, нужна минимум Java 11+

**Решение:**

```bash
# Вариант 1: Скачать с официального сайта
# https://adoptium.net/
# Выбери JDK 17 LTS для Windows x64
# ☑️ При установке включи "Add to PATH"

# Вариант 2: Через Chocolatey (если установлен)
choco install temurin17

# После установки ПЕРЕЗАПУСТИ PowerShell
# Проверь версию:
java -version
# Должна быть 11+ или выше
```

### 2️⃣ Android Studio (опционально, но упрощает жизнь)

```bash
# Скачать:
https://developer.android.com/studio

# После установки:
1. Открой Android Studio
2. Tools → SDK Manager
3. Установи Android SDK (минимум API 34)
```

---

## 🚀 КАК СОБРАТЬ APK (ПОСЛЕ УСТАНОВКИ JAVA 17+)

### Шаг 1: Обнови API URL для Android

```bash
# Узнай IP адрес компьютера:
.\get_ip.bat

# Открой файл: www\java.js
# Найди функцию getApiBase() и обнови:

function getApiBase() {
    if (window.Capacitor) {
        // Замени на ТВОЙ IP адрес!
        return 'http://192.168.1.100:5001/api';  // <-- ЗДЕСЬ
    }
    return 'http://127.0.0.1:5001/api';
}
```

### Шаг 2: Синхронизируй изменения

```bash
npx cap sync android
```

### Шаг 3: Собери APK

```bash
# Автоматически через скрипт:
.\build_apk.bat

# ИЛИ вручную через Gradle:
cd android
.\gradlew.bat assembleDebug
cd ..
```

### Шаг 4: Установи на телефон

**APK файл будет здесь:**
```
android\app\build\outputs\apk\debug\app-debug.apk
```

**Способ 1: Через USB**
```bash
# 1. Включи "Отладка по USB" на телефоне
# 2. Подключи USB кабель
# 3. Установи:
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

**Способ 2: Скопировать файл**
```bash
# 1. Скопируй app-debug.apk на телефон (USB, облако, мессенджер)
# 2. Открой файл на телефоне
# 3. Разреши установку из неизвестных источников
# 4. Нажми "Установить"
```

---

## ⚙️ КАК РАБОТАЕТ ПРИЛОЖЕНИЕ

### Локальный сервер (для тестирования)

```bash
# 1. Запусти Flask сервер на компьютере:
.\start_all.bat

# 2. Убедись что телефон и ПК в одной Wi-Fi сети

# 3. В приложении на телефоне будет работать
#    с твоим компьютером как с сервером
```

**⚠️ Проблемы с подключением?**

```bash
# Открой Windows Firewall для порта 5001:
netsh advfirewall firewall add rule name="Flask API" dir=in action=allow protocol=TCP localport=5001

# Проверь что Flask запущен:
curl http://localhost:5001/api/health
```

### Онлайн сервер (для постоянного использования)

```bash
# 1. Задеплой Flask на облако:
#    - Heroku (бесплатно, но засыпает)
#    - Railway (бесплатно 5$/месяц)
#    - Render (бесплатно, но медленный)
#    - PythonAnywhere (бесплатно, но ограничения)

# 2. Обнови API URL в www\java.js:
function getApiBase() {
    if (window.Capacitor) {
        return 'https://твой-app.herokuapp.com/api';
    }
    return 'http://127.0.0.1:5001/api';
}

# 3. Пересобери APK
```

---

## 📂 ФАЙЛЫ И СКРИПТЫ

```
c:\sss\
├── build_apk.bat          ← Автоматическая сборка APK
├── get_ip.bat             ← Узнать IP адрес компьютера
├── install_java.bat       ← Инструкция по установке Java
├── BUILD_APK.md           ← ПОЛНАЯ документация (140 KB!)
├── ANDROID_README.md      ← Документация Android версии
├── APK_QUICKSTART.md      ← ЭТО! Краткая инструкция
├── android/               ← Android проект
│   └── app/build/outputs/apk/debug/app-debug.apk  ← ТВОЙ APK!
├── www/                   ← Веб-файлы приложения
│   ├── index.html
│   ├── java.js            ← ЗДЕСЬ менять API URL!
│   └── css.css
└── icons/                 ← Иконки PWA
```

---

## 🐛 ЧАСТЫЕ ПРОБЛЕМЫ

### ❌ "Dependency requires JVM 11"

```bash
# Установи Java 17:
https://adoptium.net/

# ПЕРЕЗАПУСТИ PowerShell!
# Проверь:
java -version
```

### ❌ "SDK location not found"

```bash
# Создай файл: android\local.properties
# Содержимое:
sdk.dir=C:\\Users\\ТВОЁ_ИМЯ\\AppData\\Local\\Android\\Sdk
```

### ❌ Приложение не подключается к серверу

```bash
# 1. НЕ используй localhost на Android!
#    Неправильно: http://localhost:5001/api
#    Правильно: http://192.168.1.100:5001/api

# 2. Проверь IP адрес:
.\get_ip.bat

# 3. Телефон и ПК в одной Wi-Fi?

# 4. Flask сервер запущен?
.\start_all.bat

# 5. Firewall не блокирует?
netsh advfirewall firewall add rule name="Flask" dir=in action=allow protocol=TCP localport=5001
```

---

## 📚 БОЛЬШЕ ИНФОРМАЦИИ

- **BUILD_APK.md** - Детальная инструкция (всё-всё-всё!)
- **ANDROID_README.md** - Документация Android версии
- **README.md** - Общая информация о проекте

---

## ✅ ЧЕКЛИСТ

Перед сборкой APK:

- [ ] Java 17+ установлена (`java -version`)
- [ ] IP адрес компьютера узнан (`.\get_ip.bat`)
- [ ] API_BASE обновлён в `www\java.js`
- [ ] Изменения синхронизированы (`npx cap sync android`)
- [ ] Flask сервер запущен (`.\start_all.bat`)
- [ ] Телефон и ПК в одной Wi-Fi сети

Для сборки:

```bash
.\build_apk.bat
```

Для установки на телефон:

```bash
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

---

## 🎯 ТЛ;ДР (ОЧЕНЬ КРАТКО)

```bash
# 1. Установи Java 17: https://adoptium.net/
# 2. Перезапусти PowerShell
# 3. Обнови IP в www\java.js
# 4. Запусти: .\build_apk.bat
# 5. APK в: android\app\build\outputs\apk\debug\app-debug.apk
# 6. Скопируй на телефон и установи
```

**ПОЕХАЛИ! 🚀**
