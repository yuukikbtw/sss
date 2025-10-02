# 🎯 Habit Tracker - Трекер привычек

> **Современное полнофункциональное веб-приложение для отслеживания привычек**  
> С системой наград, статистикой, категориями и полной авторизацией

---

## ✨ Возможности

- 🔐 **Полная система авторизации** - регистрация, вход, сессии
- 📊 **Детальная статистика** - графики, серии, процент выполнения
- 🏆 **Система наград** - бейджи, уровни, XP за достижения
- 🏷️ **Категории привычек** - организуйте привычки по темам
- 📱 **Responsive дизайн** - работает на всех устройствах
- 🎨 **Красивый UI** - современный glassmorphism дизайн
- 🔄 **Real-time обновления** - мгновенная синхронизация
- 🗄️ **MongoDB Atlas** - облачная база данных

---

## 🚀 Быстрый запуск

### ⚡ Способ 1: Автозапуск (рекомендуется для Windows)
```batch
# Двойной клик или в PowerShell:
.\start_all.bat
```
**Это откроет 2 терминала:**
- 🔌 Flask API Server (порт 5001)
- 🌐 Static Web Server (порт 8000)

### 🐍 Способ 2: Python универсальный
```bash
python run_universal.py
```

### 🛠️ Способ 3: Ручной запуск (для продвинутых)
```bash
# Терминал 1 - API Backend
pip install -r requirements.txt
python py.py

# Терминал 2 - Frontend
python static_server.py
```

---

## 📋 Требования

- ✅ **Python 3.8+** (автоматически определяется)
- ✅ **pip** (менеджер пакетов Python)
- ✅ **Интернет** (для MongoDB Atlas подключения)

---

## 🌐 После запуска откройте

| Сервис | URL | Описание |
|--------|-----|----------|
| 🌐 **Веб-приложение** | http://localhost:8000 | Главная страница |
| 🔌 **API Backend** | http://localhost:5001/api | REST API эндпоинты |
| 💚 **Health Check** | http://localhost:5001/api/health | Статус сервера |

---

## 🔧 Конфигурация

Все настройки в файле **`config.json`**:

```json
{
  "api": {
    "port": 5001,          // 🔌 Порт Flask API
    "host": "127.0.0.1",   // 🏠 Хост API
    "debug": true          // 🐛 Режим отладки
  },
  "static": {
    "port": 8000,          // 🌐 Порт фронтенда
    "host": "localhost"    // 🏠 Хост фронтенда
  },
  "database": {
    "connection_string": "mongodb+srv://..." // 🗄️ MongoDB URI
  }
}
```

### 🔐 Переменные окружения (опционально)

```bash
# MongoDB подключение (перекрывает config.json)
set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/

# Секрет для Flask сессий (для продакшена)
set HABIT_SECRET=your-super-secret-key-here

# CORS origin (если фронт на другом домене)
set ALLOWED_ORIGIN=http://localhost:8000
```

---

## 📁 Структура проекта

```
habit-tracker/
├── 🐍 Backend
│   ├── py.py                  # Flask API сервер
│   ├── static_server.py       # HTTP сервер для фронтенда
│   └── requirements.txt       # Python зависимости
│
├── 🎨 Frontend
│   ├── index.html            # Главная страница
│   ├── java.js               # Вся логика приложения
│   ├── css.css               # Стили (glassmorphism)
│   ├── manifest.json         # PWA манифест
│   └── service-worker.js     # Service Worker
│
├── ⚙️ Конфигурация
│   └── config.json           # Настройки серверов и БД
│
├── 🚀 Запуск
│   ├── start_all.bat         # Автозапуск (Windows)
│   ├── stop_servers.bat      # Остановка серверов
│   ├── setup_and_run.bat     # Установка и запуск
│   └── run_universal.py      # Python универсальный
│
└── 📚 Документация
    └── README.md             # Этот файл
```

---

## � Как использовать

### 1️⃣ Регистрация
1. Откройте http://localhost:8000
2. Нажмите **"Регистрация"**
3. Введите имя, email, пароль (мин. 6 символов)
4. Готово! 🎉

### 2️⃣ Создание привычки
- Нажмите **"➕ Добавить привычку"**
- Заполните название и описание
- Выберите категорию (или создайте свою)
- Опционально: установите время и напоминания

### 3️⃣ Отслеживание
- Кликайте на дни недели чтобы отметить выполнение
- Следите за текущей серией 🔥
- Зарабатывайте XP и бейджи 🏆

### 4️⃣ Статистика
- Кликните на привычку для детальной статистики
- Смотрите графики выполнения
- Анализируйте прогресс за неделю/месяц

---

## 📦 Зависимости

| Пакет | Версия | Назначение |
|-------|--------|-----------|
| **Flask** | 3.1.2 | Web framework для REST API |
| **pymongo** | 4.6.0 | MongoDB драйвер |
| **werkzeug** | встроен | Хэширование паролей |

Устанавливаются автоматически через:
```bash
pip install -r requirements.txt
```

---

## � Остановка серверов

### Способ 1: Автоматический (Windows)
```batch
.\stop_servers.bat
```

### Способ 2: Вручную
В каждом терминале с сервером:
```
Ctrl + C
```

---

## 🏗️ Архитектурные особенности

### 🎨 Frontend
- **Vanilla JavaScript** - без фреймворков, чистый JS
- **Glassmorphism UI** - современный дизайн
- **Local Storage** - кэширование настроек
- **Fetch API** - асинхронные запросы с credentials
- **Service Worker** - PWA ready

### ⚙️ Backend
- **Flask** - легковесный Python фреймворк
- **MongoDB Atlas** - NoSQL облачная БД
- **Session-based Auth** - безопасные сессии через cookies
- **Password Hashing** - Werkzeug PBKDF2
- **CORS** - правильные headers для cross-origin

### 🔐 Безопасность
- ✅ Хэширование паролей (не plain text!)
- ✅ HttpOnly cookies для сессий
- ✅ CORS настройки
- ✅ Валидация всех входных данных
- ✅ Проверка авторизации на каждом эндпоинте

---

## 🐛 Устранение проблем

### ❌ Python не найден
**Проблема:** `'python' is not recognized...`

**Решение:**
1. Установите Python 3.8+ с [python.org](https://python.org)
2. При установке поставьте галочку **"Add to PATH"**
3. Или используйте `setup_and_run.bat` - он найдет Python автоматически

---

### ❌ Порт уже занят
**Проблема:** `Address already in use` или `port 5001/8000 is busy`

**Решение:**
```bash
# Остановите процессы на портах
.\stop_servers.bat

# Или измените порты в config.json
{
  "api": { "port": 5002 },
  "static": { "port": 8001 }
}
```

---

### ❌ Ошибки импорта модулей
**Проблема:** `ModuleNotFoundError: No module named 'flask'`

**Решение:**
```bash
# Обновите pip
python -m pip install --upgrade pip

# Установите зависимости
pip install -r requirements.txt

# Или вручную
pip install flask==3.1.2 pymongo==4.6.0
```

---

### ❌ Не работает авторизация
**Проблема:** После логина не вижу свои привычки

**Решение:**
1. Проверьте что оба сервера запущены
2. Откройте DevTools (F12) → Console → смотрите ошибки
3. Убедитесь что credentials включены в fetch запросах
4. Очистите cookies и попробуйте снова

---

### ❌ MongoDB connection failed
**Проблема:** `MongoDB connection error`

**Решение:**
1. Проверьте интернет соединение
2. Убедитесь что MongoDB URI правильный в config.json
3. Или задайте через переменную окружения:
```bash
set MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
```

---

## 🚀 Production Deploy

### Для продакшена рекомендуется:

1. **Переменные окружения:**
```bash
export MONGODB_URI="your-production-mongodb-uri"
export HABIT_SECRET="super-secret-production-key-256-bit"
export ALLOWED_ORIGIN="https://yourdomain.com"
export FLASK_ENV="production"
```

2. **Gunicorn вместо встроенного Flask сервера:**
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5001 py:app
```

3. **Nginx для статики:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        root /var/www/habit-tracker;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5001;
    }
}
```

4. **HTTPS через Let's Encrypt:**
```bash
certbot --nginx -d yourdomain.com
```

---

## 📊 API Endpoints

| Method | Endpoint | Описание | Auth |
|--------|----------|----------|------|
| `POST` | `/api/register` | Регистрация пользователя | ❌ |
| `POST` | `/api/login` | Вход в систему | ❌ |
| `POST` | `/api/logout` | Выход | ✅ |
| `GET` | `/api/me` | Текущий пользователь | ✅ |
| `GET` | `/api/habits` | Список привычек | ✅ |
| `POST` | `/api/habits` | Создать привычку | ✅ |
| `GET` | `/api/habits/:id` | Одна привычка | ✅ |
| `PUT` | `/api/habits/:id` | Обновить привычку | ✅ |
| `DELETE` | `/api/habits/:id` | Удалить привычку | ✅ |
| `POST` | `/api/habits/:id/tick` | Отметить выполнение | ✅ |
| `GET` | `/api/habits/:id/stats` | Статистика (week/month) | ✅ |
| `GET` | `/api/health` | Health check | ❌ |

---

## 📝 TODO / Future Features

- [ ] Email подтверждение при регистрации
- [ ] Восстановление пароля
- [ ] Экспорт/импорт данных (JSON, CSV)
- [ ] Темная/светлая тема
- [ ] Мобильное приложение (React Native / Flutter)
- [ ] Уведомления на телефон (Push API)
- [ ] Социальные функции (друзья, рейтинги)
- [ ] Интеграция с календарями (Google Calendar)
- [ ] Аналитика и ML предсказания
- [ ] Multi-language support

---

## 💡 Tips & Tricks

### Горячие клавиши
- `Ctrl+K` → Быстрое создание привычки
- `Ctrl+S` → Сохранить изменения
- `Esc` → Закрыть модалку

### Быстрый старт разработки
```bash
# Установи nodemon для авто-перезапуска
pip install watchdog
watchmedo auto-restart --patterns="*.py" --recursive python py.py
```

---

## 👨‍💻 Для разработчиков

### Структура базы данных

**Users Collection:**
```javascript
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password_hash: String,
  created_at: ISODate
}
```

**Habits Collection:**
```javascript
{
  _id: ObjectId,
  user_id: String,
  name: String,
  description: String,
  time: String (optional),
  category: String (optional),
  reminder: Object (optional),
  created_at: ISODate,
  is_active: Boolean
}
```

**Habit_entries Collection:**
```javascript
{
  _id: ObjectId,
  habit_id: String,
  date: ISODate,
  status: Boolean,
  note: String (optional)
}
```

---

## 🎓 License

**MIT License** - делай что хочешь, но на свой риск 😎

---

## 🤝 Contributing

Pull requests приветствуются! Для крупных изменений сначала открывайте issue.

1. Fork проект
2. Создай feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Открой Pull Request

---

## 📧 Контакты

**Вопросы?** Открывай issue на GitHub!

---

<div align="center">

### Made with ❤️ and ☕

**Habit Tracker** © 2025

[⬆ Наверх](#-habit-tracker---трекер-привычек)

</div>