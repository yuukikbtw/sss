from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
from datetime import date, datetime, timedelta
from typing import Optional, Dict, List
from flask import Flask, jsonify, request, session
from werkzeug.security import generate_password_hash, check_password_hash
import json
import os
import secrets


# Загружаем конфигурацию
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        # Конфигурация по умолчанию, если файла нет
        return {
            "api": {"port": 5001, "host": "0.0.0.0", "debug": True},
            # Никогда не хардкодим реальные креды в коде. Используй переменную окружения MONGODB_URI.
            "database": {"connection_string": "mongodb://localhost:27017"}
        }

config = load_config()

# MongoDB connection (env override)
uri = os.environ.get("MONGODB_URI", config["database"]["connection_string"])
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['habits_tracker']
habits_collection = db['habits']
entries_collection = db['habit_entries']
users_collection = db['users']



# ---------- DB ----------
def init_db():
    try:
        client.admin.command('ping')
        print("Pinged your deployment. You successfully connected to MongoDB!")
        # Создаем индексы для производительности
        try:
            entries_collection.create_index([("habit_id", 1), ("date", 1)], unique=True)
            habits_collection.create_index([("is_active", 1)])
            habits_collection.create_index([("user_id", 1)])
            users_collection.create_index([("email", 1)], unique=True)
            users_collection.create_index([("username", 1)], unique=True)
            print("Индексы созданы успешно!")
        except Exception as e:
            print(f"Ошибка создания индексов (возможно уже существуют): {e}")
    except Exception as e:
        print(f"MongoDB connection error: {e}")

# ---------- Users ----------
def create_user(username: str, email: str, password: str) -> Dict:
    # Безопасное хранение пароля (Werkzeug) + базовая валидация.
    user_doc = {
        "username": username.strip(),
        "email": email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "created_at": date.today().isoformat()
    }

    try:
        result = users_collection.insert_one(user_doc)
        return {
            "id": str(result.inserted_id),
            "username": user_doc["username"],
            "email": user_doc["email"],
            "created_at": user_doc["created_at"]
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "email" in error_msg or "duplicate" in error_msg:
            raise ValueError("Email уже используется")
        if "username" in error_msg:
            raise ValueError("Имя пользователя уже занято")
        raise ValueError(f"Ошибка создания пользователя: {str(e)}")

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    # Backward-compatible: если старые записи имеют 'password'. Новые используют 'password_hash'.
    user = users_collection.find_one({"email": email.strip().lower()})
    if not user:
        return None
    valid = False
    if 'password_hash' in user:
        try:
            valid = check_password_hash(user['password_hash'], password)
        except Exception:
            valid = False
    elif 'password' in user:  # legacy fallback
        valid = (user['password'] == password)
    if not valid:
        return None
    user["id"] = str(user["_id"])
    # Очистка чувствительных полей
    for sensitive in ("_id", "password", "password_hash"):
        if sensitive in user:
            del user[sensitive]
    return user

def get_user_by_id(user_id: str) -> Optional[Dict]:
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if user:
            user["id"] = str(user["_id"])
            for sensitive in ("_id", "password", "password_hash"):
                if sensitive in user:
                    del user[sensitive]
        return user
    except Exception:
        return None

# ---------- Repository ----------
def create_habit(name: str, description: str, user_id: str, time: Optional[str] = None, category: Optional[str] = None, reminder: Optional[dict] = None) -> Dict:
    habit_doc = {
        "name": name.strip(),
        "description": description.strip(),
        "user_id": user_id,
        "time": time,
        "category": category,
        "reminder": reminder or {"type": "none"},
        "created_at": date.today().isoformat(),
        "is_active": True
    }
    result = habits_collection.insert_one(habit_doc)
    created = get_habit(str(result.inserted_id), user_id)
    return created or {"id": str(result.inserted_id), "name": name, "description": description, "user_id": user_id}

def get_habit(habit_id: str, user_id: str) -> Optional[Dict]:
    try:
        habit = habits_collection.find_one({
            "_id": ObjectId(habit_id),
            "user_id": user_id,
            "is_active": True
        })
        if habit:
            habit["id"] = str(habit["_id"])
            del habit["_id"]
        return habit
    except:
        return None

def list_habits(user_id: str) -> List[Dict]:
    habits = list(habits_collection.find(
        {"user_id": user_id, "is_active": True}
    ).sort("_id", -1))
    
    for habit in habits:
        habit["id"] = str(habit["_id"])
        del habit["_id"]
    
    return habits

def update_habit(habit_id: str, name: str, description: str, user_id: str) -> Optional[Dict]:
    try:
        result = habits_collection.update_one(
            {"_id": ObjectId(habit_id), "user_id": user_id, "is_active": True},
            {"$set": {
                "name": name.strip(),
                "description": description.strip()
            }}
        )
        if result.matched_count == 0:
            return None
        return get_habit(habit_id, user_id)
    except:
        return None

def delete_habit(habit_id: str, user_id: str) -> bool:
    try:
        print(f"Удаление привычки: ID={habit_id}, user_id={user_id}")
        result = habits_collection.update_one(
            {"_id": ObjectId(habit_id), "user_id": user_id, "is_active": True},
            {"$set": {"is_active": False}}
        )
        print(f"Результат удаления: matched_count={result.matched_count}")
        return result.matched_count > 0
    except Exception as e:
        print(f"Ошибка при удалении: {e}")
        return False

def upsert_entry(habit_id: str, day: date, status: bool = True, note: str = "") -> Dict:
    entry_doc = {
        "habit_id": habit_id,
        "date": day.isoformat(),
        "status": status,
        "note": note.strip()
    }
    
    result = entries_collection.replace_one(
        {"habit_id": habit_id, "date": day.isoformat()},
        entry_doc,
        upsert=True
    )
    
    entry = entries_collection.find_one({
        "habit_id": habit_id,
        "date": day.isoformat()
    })
    
    if entry and "_id" in entry:
        entry["_id"] = str(entry["_id"])  # Конвертируем ObjectId в строку
    
    return entry or {"habit_id": habit_id, "date": day.isoformat(), "status": status, "note": note}

def get_entries(habit_id: str, start: date, end: date) -> List[Dict]:
    entries = list(entries_collection.find({
        "habit_id": habit_id,
        "date": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }).sort("date", 1))
    
    # Конвертируем ObjectId в строки
    for entry in entries:
        if "_id" in entry:
            entry["_id"] = str(entry["_id"])
    
    return entries

def streaks(habit_id: str) -> Dict:
    entries = list(entries_collection.find({
        "habit_id": habit_id,
        "status": True
    }).sort("date", 1))
    
    if not entries:
        return {"current": 0, "max": 0}
    
    rows = [entry["date"] for entry in entries]
    ds = set(rows)
    today = date.today()
    cur_streak = 0
    d = today
    while d.isoformat() in ds:
        cur_streak += 1
        d -= timedelta(days=1)
    max_streak = 0
    visited = set()
    for iso in ds:
        start_d = datetime.fromisoformat(iso).date()
        prev = start_d - timedelta(days=1)
        if prev.isoformat() in ds:
            continue
        length = 0
        x = start_d
        while x.isoformat() in ds:
            visited.add(x.isoformat())
            length += 1
            x += timedelta(days=1)
        if length > max_streak:
            max_streak = length
    return {"current": cur_streak, "max": max_streak}

# ---------- Stats ----------
def period_range(kind: str):
    today = date.today()
    if kind == "week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif kind == "month":
        start = today.replace(day=1)
        if start.month == 12:
            end = start.replace(year=start.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end = start.replace(month=start.month + 1, day=1) - timedelta(days=1)
    else:
        raise ValueError("unsupported range")
    return start, end

def compute_stats(habit_id: str, kind: str, user_id: str) -> Dict:
    habit = get_habit(habit_id, user_id)
    if not habit:
        return {}
    start, end = period_range(kind)
    created = datetime.fromisoformat(habit["created_at"]).date()
    effective_start = max(start, created)
    entries = get_entries(habit_id, effective_start, end)
    # Исправлено: статус сохраняется как bool, а не int
    done_days = {e["date"] for e in entries if e.get("status") is True}
    total_possible = (end - effective_start).days + 1
    adherence = (len(done_days) / total_possible * 100) if total_possible > 0 else 0.0
    return {
        "habit_id": habit_id,
        "range": kind,
        "start": effective_start.isoformat(),
        "end": end.isoformat(),
        "completed_days": len(done_days),
        "total_days": total_possible,
        "adherence_percent": round(adherence, 2),
        "entries": entries
    }

# ---------- Services ----------
def validate_date(s: Optional[str]) -> date:
    if not s:
        return date.today()
    return datetime.fromisoformat(s).date()

def add_habit_service(data: Dict):
    auth_error = require_auth()
    if auth_error:
        return auth_error[0], auth_error[1]
    
    name = (data.get("name") or "").strip()
    if not name:
        return {"error": "name required"}, 400
    
    desc = (data.get("description") or "").strip()
    time = data.get("time")
    category = data.get("category")
    reminder = data.get("reminder", {"type": "none"})
    
    user_id = get_current_user_id()
    if not isinstance(user_id, str):
        return {"error": "unauthorized"}, 401
    return create_habit(name, desc, user_id, time, category, reminder), 201

def edit_habit_service(habit_id: str, data: Dict):
    auth_error = require_auth()
    if auth_error:
        return auth_error[0], auth_error[1]
    
    user_id = get_current_user_id()
    if not isinstance(user_id, str):
        return {"error": "unauthorized"}, 401
    if not get_habit(habit_id, user_id):
        return {"error": "not found"}, 404
    name = (data.get("name") or "").strip()
    desc = (data.get("description") or "").strip()
    if not name:
        return {"error": "name required"}, 400
    updated = update_habit(habit_id, name, desc, user_id)
    return updated, 200

def remove_habit_service(habit_id: str):
    auth_error = require_auth()
    if auth_error:
        return auth_error[0], auth_error[1]
    
    user_id = get_current_user_id()
    if not isinstance(user_id, str):
        return {"error": "unauthorized"}, 401
    if not delete_habit(habit_id, user_id):
        return {"error": "not found"}, 404
    return {"status": "deleted"}, 200

def toggle_entry_service(habit_id: str, data: Dict):
    auth_error = require_auth()
    if auth_error:
        return auth_error[0], auth_error[1]
    
    user_id = get_current_user_id()
    if not isinstance(user_id, str):
        return {"error": "unauthorized"}, 401
    if not get_habit(habit_id, user_id):
        return {"error": "habit not found"}, 404
    d = validate_date(data.get("date"))
    status = data.get("status", True)
    note = data.get("note", "")
    entry = upsert_entry(habit_id, d, bool(status), note)
    return entry, 200

def habit_stats_service(habit_id: str, kind: str):
    auth_error = require_auth()
    if auth_error:
        return auth_error[0], auth_error[1]
    
    user_id = get_current_user_id()
    if not isinstance(user_id, str):
        return {"error": "unauthorized"}, 401
    if not get_habit(habit_id, user_id):
        return {"error": "habit not found"}, 404
    try:
        s = compute_stats(habit_id, kind, user_id)
    except ValueError:
        return {"error": "bad range"}, 400
    s["streak"] = streaks(habit_id)
    return s, 200

# ---------- Flask App ----------
app = Flask(__name__)
# ВАЖНО: для стабильности сессий используем один секрет, а не новый каждую перезагрузку.
# Можно вынести в переменную окружения HABIT_SECRET, иначе fallback (НЕ для продакшена!)
app.secret_key = os.environ.get("HABIT_SECRET", "dev-secret-change-me")

# Настройки cookies для работы между портами (localhost:8000 -> localhost:5001)
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",  # Если будешь открывать с file:// или с другого хоста – поставь 'None' и включи HTTPS
    SESSION_COOKIE_SECURE=False,      # На локали без HTTPS False
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_NAME="habit_session"
)

# Разрешённый origin (фронтенд). Можно задать переменной окружения ALLOWED_ORIGIN
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

# CORS headers для frontend - разрешаем все Origin для мобильного приложения
def _cors_origin():
    origin = request.headers.get('Origin')
    # В режиме разработки разрешаем все Origin
    if config['api']['debug']:
        return origin if origin else '*'
    # В production проверяем конкретные Origin
    if origin:
        # Разрешаем localhost, локальные IP и capacitor схемы
        if (origin.startswith('http://localhost') or 
            origin.startswith('http://127.0.0.1') or
            origin.startswith('http://192.168.') or
            origin.startswith('http://10.0.') or
            origin.startswith('capacitor://') or
            origin.startswith('ionic://')):
            return origin
    return ALLOWED_ORIGIN

@app.after_request
def after_request(response):
    origin = _cors_origin()
    response.headers['Access-Control-Allow-Origin'] = origin if origin != '*' else '*'
    if origin != '*':
        response.headers['Vary'] = 'Origin'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        origin = _cors_origin()
        response = jsonify({})
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Vary'] = 'Origin'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
        response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

# Сессии Flask

# Auth Services
def register_user_service(data: Dict):
    try:
        username = (data.get("username") or "").strip()
        email = (data.get("email") or "").strip()
        password = (data.get("password") or "").strip()
        
        if not username or not email or not password:
            return {"error": "Все поля обязательны"}, 400
        
        if len(password) < 6:
            return {"error": "Пароль должен содержать минимум 6 символов"}, 400
        
        user = create_user(username, email, password)
        return {"user": user, "message": "Аккаунт создан успешно"}, 201
    except ValueError as e:
        return {"error": str(e)}, 400
    except Exception as e:
        print(f"Ошибка при регистрации: {e}")
        return {"error": "Внутренняя ошибка сервера"}, 500

def login_user_service(data: Dict):
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()
    
    if not email or not password:
        return {"error": "Email и пароль обязательны"}, 400
    
    user = authenticate_user(email, password)
    if user:
        session['user_id'] = user["id"]
        return {"user": user, "message": "Вход выполнен успешно"}, 200
    else:
        return {"error": "Неверный email или пароль"}, 401

def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return get_user_by_id(user_id)
    return None

def get_current_user_id():
    return session.get('user_id')

def require_auth():
    if not session.get('user_id'):
        return {"error": "Требуется авторизация"}, 401
    return None

@app.post("/api/register")
def api_register():
    try:
        data = request.get_json(force=True, silent=True) or {}
        print(f"Получен запрос регистрации: {data}")
        body, code = register_user_service(data)
        print(f"Ответ: {body}, код: {code}")
        return jsonify(body), code
    except Exception as e:
        print(f"Ошибка в api_register: {e}")
        return jsonify({"error": "Внутренняя ошибка сервера"}), 500

@app.post("/api/login")
def api_login():
    data = request.get_json(force=True, silent=True) or {}
    body, code = login_user_service(data)
    return jsonify(body), code

@app.post("/api/logout")
def api_logout():
    session.clear()
    return jsonify({"message": "Выход выполнен успешно"}), 200

@app.get("/api/me")
def api_me():
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    
    user = get_current_user()
    if user:
        return jsonify({"user": user}), 200
    else:
        return jsonify({"error": "Пользователь не найден"}), 404

@app.get("/api/habits")
def api_list():
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    return jsonify(list_habits(user_id))

@app.post("/api/habits")
def api_create():
    data = request.get_json(force=True, silent=True) or {}
    body, code = add_habit_service(data)
    return jsonify(body), code

@app.get("/api/habits/<habit_id>")
def api_get(habit_id: str):
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    h = get_habit(habit_id, user_id)
    if not h:
        return jsonify({"error": "not found"}), 404
    h["streak"] = streaks(habit_id)
    return jsonify(h)

@app.put("/api/habits/<habit_id>")
def api_update(habit_id: str):
    data = request.get_json(force=True, silent=True) or {}
    body, code = edit_habit_service(habit_id, data)
    return jsonify(body), code

@app.delete("/api/habits/<habit_id>")
def api_delete(habit_id: str):
    body, code = remove_habit_service(habit_id)
    return jsonify(body), code

@app.post("/api/habits/<habit_id>/tick")
def api_tick(habit_id: str):
    data = request.get_json(force=True, silent=True) or {}
    body, code = toggle_entry_service(habit_id, data)
    return jsonify(body), code

@app.get("/api/habits/<habit_id>/stats")
def api_stats(habit_id: str):
    r = request.args.get("range", "week")
    body, code = habit_stats_service(habit_id, r)
    return jsonify(body), code

@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "Habit Tracker API",
        "version": "2.0",
        "database": "connected" if client else "disconnected"
    })

if __name__ == "__main__":
    print("\n" + "="*70)
    print("           🎯 HABIT TRACKER - API BACKEND")
    print("="*70)
    print(f"\n⚙️  Режим:          {'DEBUG' if config['api']['debug'] else 'PRODUCTION'}")
    print(f"🔌 API Server:     http://{config['api']['host']}:{config['api']['port']}")
    print(f"📊 Health Check:   http://{config['api']['host']}:{config['api']['port']}/api/health")
    print(f"🗄️  База данных:    MongoDB Atlas")
    print(f"🔐 Сессии:         Flask Sessions (cookies)")
    print("\n" + "="*70)
    print("✅ Инициализация базы данных...")
    print("="*70 + "\n")
    
    init_db()
    
    print("🚀 Запуск Flask сервера...\n")
    app.run(
        debug=config["api"]["debug"], 
        port=config["api"]["port"],
        host=config["api"]["host"]
    )