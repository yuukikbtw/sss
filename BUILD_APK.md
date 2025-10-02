# 📱 Сборка APK для Android

## 🎯 Что нужно установить

### 1. Java JDK 17 или 21
```powershell
# Скачать с официального сайта:
https://adoptium.net/

# Или через Chocolatey:
choco install temurin21
```

### 2. Android Studio
```powershell
# Скачать с официального сайта:
https://developer.android.com/studio

# После установки:
1. Открыть Android Studio
2. Tools → SDK Manager
3. Установить:
   - Android SDK Platform 34 (или выше)
   - Android SDK Build-Tools
   - Android Emulator
```

### 3. Настроить переменные окружения

Добавить в PATH:
```
C:\Program Files\Android\Android Studio\jbr\bin
C:\Users\ВАШ_ЮЗЕ�\AppData\Local\Android\Sdk\platform-tools
C:\Users\ВАШЕ_ИМЯ\AppData\Local\Android\Sdk\tools
```

Добавить переменные:
```
ANDROID_HOME = C:\Users\ВАШЕ_ИМЯ\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot
```

---

## 🚀 Сборка APK

### Способ 1: Через Android Studio (РЕКОМЕНДУЕТСЯ)

```powershell
# 1. Открыть проект Android в Android Studio
npx cap open android

# 2. В Android Studio:
#    Build → Build Bundle(s) / APK(s) → Build APK(s)

# 3. APK будет в:
#    android\app\build\outputs\apk\debug\app-debug.apk
```

### Способ 2: Через Gradle (командная строка)

```powershell
# Debug версия (для тестирования)
cd android
.\gradlew assembleDebug

# Release версия (для публикации)
.\gradlew assembleRelease

# APK файлы будут в:
# android\app\build\outputs\apk\debug\app-debug.apk
# android\app\build\outputs\apk\release\app-release-unsigned.apk
```

### Способ 3: Автоматический скрипт

```powershell
# Используй готовый скрипт
.\build_apk.bat
```

---

## 📦 Установка APK на телефон

### Метод 1: USB кабель

```powershell
# 1. Включи "Режим разработчика" на телефоне:
#    Настройки → О телефоне → Нажми 7 раз на "Номер сборки"

# 2. Включи "Отладка по USB":
#    Настройки → Для разработчиков → Отладка по USB

# 3. Подключи телефон к компьютеру

# 4. Установи APK:
adb install android\app\build\outputs\apk\debug\app-debug.apk
```

### Метод 2: Перенести файл

1. Скопируй `app-debug.apk` на телефон (через USB или облако)
2. Открой файл на телефоне
3. Разреши установку из неизвестных источников
4. Установи приложение

---

## ⚙️ Настройка для работы с Flask сервером

### Вариант 1: Сервер на компьютере (для разработки)

```powershell
# 1. Узнай свой локальный IP адрес:
ipconfig
# Найди IPv4 адрес (например, 192.168.1.100)

# 2. Обнови API_BASE в www\java.js:
const API_BASE = 'http://192.168.1.100:5001/api';

# 3. Запусти серверы:
.\start_all.bat

# 4. Пересобери APK:
npx cap sync android
.\build_apk.bat
```

### Вариант 2: Онлайн сервер (для продакшена)

```powershell
# 1. Задеплой Flask API на облако:
#    - Heroku: heroku.com
#    - Railway: railway.app
#    - Render: render.com
#    - PythonAnywhere: pythonanywhere.com

# 2. Обнови API_BASE в www\java.js:
const API_BASE = 'https://your-app.herokuapp.com/api';

# 3. Пересобери APK:
npx cap sync android
.\build_apk.bat
```

---

## 🔧 Решение проблем

### Ошибка: "JAVA_HOME is not set"

```powershell
# Установи переменную окружения:
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-21.0.x-hotspot"
```

### Ошибка: "SDK location not found"

```powershell
# Создай файл android\local.properties:
sdk.dir=C:\\Users\\ВАШЕ_ИМЯ\\AppData\\Local\\Android\\Sdk
```

### Ошибка: "Failed to connect to API"

```powershell
# 1. Проверь что Flask сервер запущен:
curl http://localhost:5001/api/health

# 2. На Android эмуляторе используй 10.0.2.2 вместо localhost
# 3. На реальном устройстве используй IP компьютера в локальной сети
```

### APK не устанавливается на телефон

```powershell
# 1. Разреши установку из неизвестных источников:
#    Настройки → Безопасность → Неизвестные источники

# 2. Для Android 8+:
#    Настройки → Приложения → Особые права доступа → 
#    Установка неизвестных приложений → Файлы → Разрешить
```

---

## 📝 Полезные команды

```powershell
# Проверить устройства
adb devices

# Посмотреть логи приложения
adb logcat | Select-String "HabitTracker"

# Удалить приложение с телефона
adb uninstall com.habittracker.app

# Открыть Android Studio с проектом
npx cap open android

# Синхронизировать изменения с Android
npx cap sync android

# Пересобрать и установить на устройство
npx cap run android
```

---

## 🎨 Кастомизация приложения

### Изменить иконку приложения

```
1. Положи иконку в:
   android\app\src\main\res\mipmap-hdpi\ic_launcher.png (72x72)
   android\app\src\main\res\mipmap-mdpi\ic_launcher.png (48x48)
   android\app\src\main\res\mipmap-xhdpi\ic_launcher.png (96x96)
   android\app\src\main\res\mipmap-xxhdpi\ic_launcher.png (144x144)
   android\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png (192x192)

2. Или используй онлайн генератор:
   https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
```

### Изменить название приложения

```xml
<!-- android\app\src\main\res\values\strings.xml -->
<resources>
    <string name="app_name">Мои Привычки</string>
</resources>
```

### Изменить цвет темы

```xml
<!-- android\app\src\main\res\values\styles.xml -->
<style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
    <item name="colorPrimary">#00d4ff</item>
    <item name="colorPrimaryDark">#0099cc</item>
    <item name="colorAccent">#ff4081</item>
</style>
```

---

## 🚀 Публикация в Google Play

### 1. Создай подписанный APK

```powershell
# Создай keystore:
keytool -genkey -v -keystore my-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias

# Настрой android\app\build.gradle для release:
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.jks')
            storePassword 'password'
            keyAlias 'my-key-alias'
            keyPassword 'password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

# Собери release APK:
cd android
.\gradlew assembleRelease
```

### 2. Зарегистрируйся в Google Play Console

```
1. Перейди на https://play.google.com/console
2. Заплати разовый взнос $25
3. Создай новое приложение
4. Загрузи APK или AAB файл
5. Заполни описание, скриншоты, иконку
6. Отправь на проверку
```

---

## 💡 Советы

✅ **Для тестирования** - используй debug APK  
✅ **Для друзей** - используй debug APK или собери release с своим keystore  
✅ **Для Google Play** - используй signed release AAB (не APK!)  
✅ **Сохрани keystore** - без него не сможешь обновлять приложение!  
✅ **Тестируй на реальном устройстве** - эмулятор не показывает все баги  

---

## 🎯 Чек-лист перед публикацией

- [ ] Изменил API_BASE на production URL
- [ ] Заменил иконку приложения
- [ ] Обновил название и описание
- [ ] Протестировал все функции на реальном устройстве
- [ ] Создал signed release build
- [ ] Подготовил скриншоты для Google Play
- [ ] Написал описание приложения
- [ ] Подготовил privacy policy
- [ ] Сохранил keystore в безопасное место!

---

**УДАЧИ С ПРИЛОЖЕНИЕМ! 🚀📱**
