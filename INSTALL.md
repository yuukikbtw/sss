# 🚀 Habit Tracker - Полная инструкция по установке

> **Пошаговое руководство для запуска проекта на любой системе**

---

## 📋 Требования

Перед началом убедитесь что установлено:

- ✅ **Python 3.8 или выше**
- ✅ **pip** (обычно идёт вместе с Python)
- ✅ **Git** (опционально, для клонирования)
- ✅ **Интернет соединение** (для MongoDB Atlas)

---

## 🔧 Шаг 1: Установка Python

### Windows

1. Скачайте Python с [python.org](https://www.python.org/downloads/)
2. Запустите установщик
3. ⚠️ **ВАЖНО:** Поставьте галочку **"Add Python to PATH"**
4. Нажмите "Install Now"
5. Проверьте установку:
```cmd
python --version
pip --version
```

### macOS

```bash
# Через Homebrew (рекомендуется)
brew install python3

# Или скачайте с python.org
```

### Linux

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip

# Fedora
sudo dnf install python3 python3-pip

# Arch
sudo pacman -S python python-pip
```

---

## 📦 Шаг 2: Получение проекта

### Вариант A: Скачать ZIP
1. Скачайте проект как ZIP архив
2. Распакуйте в удобную папку
3. Откройте терминал в этой папке

### Вариант B: Git Clone
```bash
git clone <repository-url>
cd habit-tracker
```

---

## 🐍 Шаг 3: Установка зависимостей

### Автоматическая установка (рекомендуется)

**Windows:**
```cmd
setup_and_run.bat
```
Этот скрипт автоматически:
- Найдёт Python
- Установит зависимости
- Запустит серверы

**Linux/macOS:**
```bash
python3 run_universal.py
```

### Ручная установка

```bash
# 1. Обновите pip
python -m pip install --upgrade pip

# 2. Установите зависимости
pip install -r requirements.txt

# Должны установиться:
# - flask==3.1.2
# - pymongo==4.6.0
```

---

## ⚙️ Шаг 4: Конфигурация (опционально)

### Базовая настройка

Проект работает "из коробки" с дефолтными настройками в `config.json`:

```json
{
  "api": {
    "port": 5001,
    "host": "127.0.0.1",
    "debug": true
  },
  "static": {
    "port": 8000,
    "host": "localhost"
  },
  "database": {
    "connection_string": "mongodb+srv://..."
  }
}
```

### Продвинутая настройка (через .env)

Для продакшена рекомендуется использовать `.env`:

```bash
# 1. Скопируйте пример
cp .env.example .env

# 2. Отредактируйте .env
nano .env  # или любой редактор
```

Минимальные настройки для продакшена:
```env
MONGODB_URI=mongodb+srv://your-user:password@cluster.mongodb.net/
HABIT_SECRET=your-super-secret-key-256-bit
FLASK_ENV=production
```

---

## 🚀 Шаг 5: Запуск приложения

### Вариант 1: Автоматический (Windows)

Двойной клик на файл:
```
start_all.bat
```

Или в PowerShell:
```powershell
.\start_all.bat
```

Откроются 2 терминала:
- 🔌 Flask API Server (порт 5001)
- 🌐 Static Web Server (порт 8000)

### Вариант 2: Python скрипт (Linux/macOS/Windows)

```bash
python run_universal.py
```

### Вариант 3: Ручной запуск

**Терминал 1 - Backend API:**
```bash
python py.py
```

**Терминал 2 - Frontend:**
```bash
python static_server.py
```

---

## 🌐 Шаг 6: Открытие приложения

После успешного запуска откройте в браузере:

```
http://localhost:8000
```

Вы должны увидеть главную страницу Habit Tracker!

---

## ✅ Проверка работоспособности

### 1. Проверьте API Health
Откройте: http://localhost:5001/api/health

Должен вернуться JSON:
```json
{
  "status": "ok",
  "service": "Habit Tracker API",
  "version": "2.0",
  "database": "connected"
}
```

### 2. Проверьте логи

**Flask API (терминал 1):**
```
============================================
    🎯 HABIT TRACKER - API BACKEND
============================================
⚙️  Режим: DEBUG
🔌 API Server: http://127.0.0.1:5001
...
✅ Инициализация базы данных...
```

**Static Server (терминал 2):**
```
============================================
    🌐 HABIT TRACKER - STATIC SERVER
============================================
📡 Сервер: http://localhost:8000
...
✅ Сервер запущен!
```

### 3. Тестовая регистрация

1. Откройте http://localhost:8000
2. Нажмите **"Регистрация"**
3. Заполните форму:
   - Username: `test`
   - Email: `test@example.com`
   - Password: `test123`
4. Нажмите **"Создать аккаунт"**
5. После успешной регистрации войдите в систему

---

## 🐛 Решение проблем

### ❌ Проблема: Python не найден

**Ошибка:**
```
'python' is not recognized as an internal or external command
```

**Решение:**
1. Переустановите Python с галочкой "Add to PATH"
2. Или используйте полный путь:
```cmd
"C:\Program Files\Python312\python.exe" py.py
```

---

### ❌ Проблема: Порт уже занят

**Ошибка:**
```
OSError: [Errno 98] Address already in use
```

**Решение:**

**Windows:**
```cmd
# Найти процесс на порту
netstat -ano | findstr :5001

# Убить процесс (замените PID)
taskkill /F /PID <PID>

# Или используйте скрипт
.\stop_servers.bat
```

**Linux/macOS:**
```bash
# Найти процесс
lsof -i :5001

# Убить процесс
kill -9 <PID>
```

---

### ❌ Проблема: ModuleNotFoundError

**Ошибка:**
```
ModuleNotFoundError: No module named 'flask'
```

**Решение:**
```bash
# Проверьте что используете правильный Python
python --version

# Установите зависимости явно
python -m pip install flask pymongo

# Или через requirements.txt
pip install -r requirements.txt
```

---

### ❌ Проблема: MongoDB connection failed

**Ошибка:**
```
MongoDB connection error: ...
```

**Решение:**
1. Проверьте интернет соединение
2. Убедитесь что MongoDB URI правильный
3. Проверьте firewall/antivirus
4. Попробуйте другой Wi-Fi/сеть

---

### ❌ Проблема: Страница не открывается

**Решение:**

1. Убедитесь что ОБА сервера запущены
2. Проверьте правильность URL: `http://localhost:8000`
3. Попробуйте другой браузер
4. Очистите кэш браузера (Ctrl+Shift+Del)
5. Проверьте firewall/antivirus

---

## 🔄 Обновление проекта

### Если скачали новую версию:

```bash
# 1. Обновите зависимости
pip install -r requirements.txt --upgrade

# 2. Перезапустите серверы
.\stop_servers.bat
.\start_all.bat
```

### Через Git:

```bash
# 1. Сохраните изменения
git stash

# 2. Получите обновления
git pull origin main

# 3. Обновите зависимости
pip install -r requirements.txt --upgrade

# 4. Верните изменения
git stash pop

# 5. Перезапустите
python run_universal.py
```

---

## 🎓 Следующие шаги

После успешной установки:

1. 📖 Прочитайте [README.md](README.md) для деталей
2. 🎮 Создайте свою первую привычку
3. 📊 Изучите статистику и систему наград
4. ⚙️ Настройте категории под себя
5. 🔐 Смените дефолтный секрет в продакшене

---

## 💡 Полезные команды

```bash
# Проверка версий
python --version
pip --version

# Список установленных пакетов
pip list

# Информация о проекте
pip show flask

# Остановка серверов (Windows)
.\stop_servers.bat

# Логи (если запущено в фоне)
tail -f logs/api.log
tail -f logs/static.log

# Очистка кэша Python
find . -type d -name "__pycache__" -exec rm -rf {} +
find . -type f -name "*.pyc" -delete
```

---

## 📧 Помощь и поддержка

Если ничего не помогло:

1. Проверьте [README.md](README.md) секцию "Устранение проблем"
2. Откройте Issue на GitHub с описанием:
   - Версия Python
   - Операционная система
   - Текст ошибки
   - Что уже пробовали

---

<div align="center">

### Успешной установки! 🚀

[⬅ Назад к README](README.md)

</div>
