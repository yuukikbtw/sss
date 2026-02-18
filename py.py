import json
import os
import time
import hmac
import hashlib
from datetime import date, datetime, timedelta
from typing import Optional, Dict, List

from bson import ObjectId
from flask import Flask, jsonify, request, session
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from werkzeug.security import generate_password_hash, check_password_hash

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def load_config():
    defaults = {
        "api": {"port": 5001, "host": "0.0.0.0", "debug": False},
        "database": {"connection_string": "mongodb://localhost:27017"}
    }
    path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data.get("api"), dict):
            defaults["api"].update(data["api"])
        if isinstance(data.get("database"), dict):
            defaults["database"].update(data["database"])
        return defaults
    except (FileNotFoundError, json.JSONDecodeError):
        return defaults

config = load_config()
uri = os.environ.get("MONGODB_URI", config["database"]["connection_string"])
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['habits_tracker']
habits_collection = db['habits']
entries_collection = db['habit_entries']
users_collection = db['users']



def init_db():
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            print(f"[DB] Подключение к MongoDB (попытка {retry_count + 1}/{max_retries})...")
            client.admin.command('ping')
            print("[DB] ✓ MongoDB подключен успешно")
            
            try:
                print("[DB] Создание индексов...")
                entries_collection.create_index([("habit_id", 1), ("date", 1)], unique=True)
                habits_collection.create_index([("is_active", 1)])
                habits_collection.create_index([("user_id", 1)])
                users_collection.create_index([("email", 1)], unique=True)
                users_collection.create_index([("username", 1)], unique=True)
                print("[DB] ✓ Индексы созданы")
            except Exception as e:
                print(f"[DB] ⚠ Ошибка при создании индексов: {e}")
            
            return  # Успешное подключение
            
        except Exception as e:
            retry_count += 1
            print(f"[DB] ✗ Ошибка подключения: {e}")
            if retry_count < max_retries:
                print(f"[DB] Ожидание 2 секунды перед повтором...")
                time.sleep(2)
            else:
                print(f"[DB] ✗ КРИТИЧЕСКИ: Не удалось подключиться к MongoDB после {max_retries} попыток")
                print(f"[DB] URI: {uri[:50]}..." if uri else "[DB] URI не установлен")
                print("[DB] Сервер будет работать, но все операции с БД будут падать")

def create_user(username: str, email: str, password: str) -> Dict:
    user_doc = {
        "username": username.strip(),
        "email": email.strip().lower(),
        "password_hash": generate_password_hash(password),
        "created_at": date.today().isoformat(),
        "userStepGoal": 10000,  # Дефолтна ціль кроків
        "stepRewardsByDate": {}  # { "2026-01-18": true, ... }
    }

    try:
        result = users_collection.insert_one(user_doc)
        return {
            "id": str(result.inserted_id),
            "username": user_doc["username"],
            "email": user_doc["email"],
            "created_at": user_doc["created_at"],
            "userStepGoal": user_doc["userStepGoal"]
        }
    except Exception as e:
        error_msg = str(e).lower()
        if "email" in error_msg or "duplicate" in error_msg:
            raise ValueError("Email уже используется")
        if "username" in error_msg:
            raise ValueError("Имя пользователя уже занято")
        raise ValueError(f"Ошибка создания пользователя: {str(e)}")

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    user = users_collection.find_one({"email": email.strip().lower()})
    if not user:
        return None
    valid = False
    if 'password_hash' in user:
        try:
            valid = check_password_hash(user['password_hash'], password)
        except Exception:
            valid = False
    elif 'password' in user:
        valid = (user['password'] == password)
    if not valid:
        return None
    user["id"] = str(user["_id"])
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

def update_user_step_goal(user_id: str, step_goal: int) -> bool:
    """Оновлює цільову кількість кроків для користувача"""
    try:
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"userStepGoal": max(1000, step_goal)}}  # Мінімум 1000 кроків
        )
        return result.matched_count > 0
    except Exception as e:
        print(f"[STEPS] ❌ Помилка оновлення цілі кроків: {e}")
        return False

def check_and_reward_daily_steps(user_id: str, steps_today: int) -> Dict:
    """
    Перевіряє чи досяг користувач цілі кроків сьогодні та видає винаграду
    Повертає: {"rewarded": bool, "xpAwarded": int, "message": str}
    """
    today_str = date.today().isoformat()  # "2026-01-18"
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return {"rewarded": False, "xpAwarded": 0, "message": "User not found"}
        
        # Отримуємо цільову кількість кроків, дефолт 10000
        step_goal = user.get("userStepGoal", 10000)
        step_rewards = user.get("stepRewardsByDate", {})
        
        print(f"[STEPS:REWARD] 📊 User {user_id}: steps={steps_today}, goal={step_goal}, today={today_str}")
        
        # Перевіряємо чи вже видана винагорода за сьогодні
        if today_str in step_rewards and step_rewards[today_str]:
            print(f"[STEPS:REWARD] ⏭️  Винагорода вже видана сьогодні")
            return {"rewarded": False, "xpAwarded": 0, "message": "Винагорода вже видана сьогодні"}
        
        # Перевіряємо чи досяг користувач цілі
        if steps_today >= step_goal:
            xp_award = 20
            new_rewards = step_rewards.copy()
            new_rewards[today_str] = True
            
            # Оновлюємо в БД
            result = users_collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"stepRewardsByDate": new_rewards}}
            )
            
            if result.matched_count > 0:
                print(f"[STEPS:REWARD] ✅ Винагорода видана: +{xp_award} XP")
                return {
                    "rewarded": True,
                    "xpAwarded": xp_award,
                    "message": f"Вітаємо! Ви досягли цілі кроків ({steps_today}/{step_goal}). +{xp_award} XP"
                }
        else:
            remaining = step_goal - steps_today
            print(f"[STEPS:REWARD] ⏳ Не досяг цілі: {steps_today}/{step_goal} (залишилося {remaining})")
            return {
                "rewarded": False,
                "xpAwarded": 0,
                "message": f"Ще {remaining} кроків до цілі ({steps_today}/{step_goal})"
            }
    except Exception as e:
        print(f"[STEPS:REWARD] ❌ Помилка: {e}")
        return {"rewarded": False, "xpAwarded": 0, "message": f"Помилка сервера: {str(e)}"}
    
    return {"rewarded": False, "xpAwarded": 0, "message": "Unknown error"}

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
    except Exception:
        return None

def list_habits(user_id: str) -> List[Dict]:
    habits = list(habits_collection.find(
        {"user_id": user_id, "is_active": True}
    ).sort("_id", -1))
    
    for habit in habits:
        habit["id"] = str(habit["_id"])
        del habit["_id"]
        habit["streak"] = streaks(habit["id"])
    
    return habits

def update_habit(habit_id: str, name: str, description: str, user_id: str, category: Optional[str] = None, reminder: Optional[dict] = None) -> Optional[Dict]:
    try:
        update_data = {
            "name": name.strip(),
            "description": description.strip()
        }
        if category is not None:
            update_data["category"] = category
        if reminder is not None:
            update_data["reminder"] = reminder
        
        result = habits_collection.update_one(
            {"_id": ObjectId(habit_id), "user_id": user_id, "is_active": True},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            return None
        return get_habit(habit_id, user_id)
    except Exception:
        return None

def delete_habit(habit_id: str, user_id: str) -> bool:
    try:
        result = habits_collection.update_one(
            {"_id": ObjectId(habit_id), "user_id": user_id, "is_active": True},
            {"$set": {"is_active": False}}
        )
        return result.matched_count > 0
    except Exception:
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
        entry["_id"] = str(entry["_id"])
    return entry or {"habit_id": habit_id, "date": day.isoformat(), "status": status, "note": note}

def get_entries(habit_id: str, start: date, end: date) -> List[Dict]:
    entries = list(entries_collection.find({
        "habit_id": habit_id,
        "date": {
            "$gte": start.isoformat(),
            "$lte": end.isoformat()
        }
    }).sort("date", 1))
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
        return {"current": 0, "max": 0, "average": 0, "total_streaks": 0, "total_completed": 0, "completion_rate": 0}
    
    rows = [entry["date"] for entry in entries]
    ds = set(rows)
    today = date.today()
    cur_streak = 0
    d = today
    while d.isoformat() in ds:
        cur_streak += 1
        d -= timedelta(days=1)
    if cur_streak == 0:
        yesterday = today - timedelta(days=1)
        d = yesterday
        while d.isoformat() in ds:
            cur_streak += 1
            d -= timedelta(days=1)
    all_streaks = []
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
        if length > 0:
            all_streaks.append(length)
    max_streak = max(all_streaks) if all_streaks else 0
    average_streak = round(sum(all_streaks) / len(all_streaks), 1) if all_streaks else 0
    total_streaks = len(all_streaks)
    total_completed = len(ds)
    if rows:
        first_date = datetime.fromisoformat(min(rows)).date()
        days_since_start = (today - first_date).days + 1
        completion_rate = round((total_completed / days_since_start) * 100, 1) if days_since_start > 0 else 0
    else:
        completion_rate = 0
    
    result = {
        "current": cur_streak,
        "max": max_streak,
        "average": average_streak,
        "total_streaks": total_streaks,
        "total_completed": total_completed,
        "completion_rate": completion_rate
    }
    return result

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

def validate_date(s: Optional[str]) -> date:
    if not s:
        return date.today()
    parsed_date = datetime.fromisoformat(s).date()
    if parsed_date > date.today():
        raise ValueError("Cannot mark future dates")
    return parsed_date

def add_habit_service(data: Dict):
    print(f"[API:CREATE] 📥 POST /api/habits - Payload: {data}")
    
    auth_error = require_auth()
    if auth_error:
        print(f"[API:CREATE] ❌ Auth error: {auth_error}")
        return auth_error[0], auth_error[1]
    
    name = (data.get("name") or "").strip()
    if not name:
        print(f"[API:CREATE] ❌ Validation error: name required")
        return {"error": "name required"}, 400
    
    desc = (data.get("description") or "").strip()
    time = data.get("time")
    category = data.get("category")
    reminder = data.get("reminder", {"type": "none"})
    
    user_id = get_current_user_id()
    if not isinstance(user_id, str):
        print(f"[API:CREATE] ❌ User ID error: {user_id}")
        return {"error": "unauthorized"}, 401
    
    print(f"[API:CREATE] 📝 Creating habit for user {user_id}: name={name}, category={category}, reminder={reminder}")
    result = create_habit(name, desc, user_id, time, category, reminder)
    print(f"[API:CREATE] ✅ Habit created: {result}")
    return result, 201

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
    
    category = data.get("category")
    reminder = data.get("reminder", {"type": "none"})
    
    updated = update_habit(habit_id, name, desc, user_id, category, reminder)
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
    
    try:
        d = validate_date(data.get("date"))
    except ValueError as e:
        return {"error": str(e)}, 400
    
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

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get("HABIT_SECRET", "dev-secret-change-me-32chars-long!")

TOKEN_EXP_SECONDS = 86400 * 30

def generate_token(user_id: str) -> str:
    ts = str(int(time.time()))
    msg = f"{user_id}.{ts}".encode()
    secret_bytes = app.secret_key if isinstance(app.secret_key, bytes) else str(app.secret_key).encode()
    sig = hmac.new(secret_bytes, msg, hashlib.sha256).hexdigest()
    return f"{user_id}.{ts}.{sig}"

def verify_token(token: str) -> Optional[str]:
    try:
        parts = token.strip().split('.')
        if len(parts) != 3:
            print(f"[TOKEN] ❌ Invalid token format: expected 3 parts, got {len(parts)}")
            return None
        user_id, ts, sig = parts
        ts_int = int(ts)
        age_seconds = time.time() - ts_int
        if age_seconds > TOKEN_EXP_SECONDS:
            print(f"[TOKEN] ❌ Token expired: {age_seconds}s > {TOKEN_EXP_SECONDS}s")
            return None
        msg = f"{user_id}.{ts}".encode()
        secret_bytes = app.secret_key if isinstance(app.secret_key, bytes) else str(app.secret_key).encode()
        expected = hmac.new(secret_bytes, msg, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            print(f"[TOKEN] ❌ Signature mismatch for user_id: {user_id}")
            return None
        user = get_user_by_id(user_id)
        if not user:
            print(f"[TOKEN] ❌ User not found: {user_id}")
            return None
        print(f"[TOKEN] ✅ Token verified for user: {user_id}")
        return user_id
    except Exception as e:
        return None

is_production = os.environ.get("RENDER") is not None
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax" if not is_production else "None",
    SESSION_COOKIE_SECURE=is_production,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_NAME="habit_session",
    SESSION_COOKIE_PATH="/",
    PERMANENT_SESSION_LIFETIME=86400 * 30
)

ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")

def _cors_origin():
    origin = request.headers.get('Origin')
    if config['api']['debug']:
        return origin if origin else '*'
    if origin and any(origin.startswith(p) for p in (
        'http://localhost', 'http://0.0.0.0', 'http://192.168.', 'http://10.0.',
        'capacitor://', 'ionic://')):
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
    except Exception:
        return {"error": "Внутренняя ошибка сервера"}, 500

def login_user_service(data: Dict):
    email = (data.get("email") or "").strip()
    password = (data.get("password") or "").strip()
    
    if not email or not password:
        return {"error": "Email и пароль обязательны"}, 400
    
    user = authenticate_user(email, password)
    if user:
        session.permanent = True
        session['user_id'] = user["id"]
        token = generate_token(user["id"])
        return {"user": user, "token": token, "message": "Вход выполнен успешно"}, 200
    else:
        return {"error": "Неверный email или пароль"}, 401

def get_current_user():
    user_id = session.get('user_id')
    if user_id:
        return get_user_by_id(user_id)
    return None

def get_current_user_id():
    return session.get('user_id')

def get_verified_user_id():
    user_id = session.get('user_id')
    if user_id:
        return user_id
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        verified = verify_token(auth_header[7:].strip())
        if verified:
            return verified
    return None

def require_auth():
    # Перевіряємо session
    if session.get('user_id'):
        print(f"[AUTH] ✅ Session user_id: {session.get('user_id')}")
        return None
    
    # Перевіряємо Bearer token
    auth_header = request.headers.get('Authorization', '')
    print(f"[AUTH] Authorization header: {auth_header[:20] if auth_header else 'NONE'}...")
    
    if auth_header.startswith('Bearer '):
        token = auth_header[7:].strip()
        uid = verify_token(token)
        if uid:
            print(f"[AUTH] ✅ Token verified, user_id: {uid}")
            session['user_id'] = uid
            session.modified = True
            return None
        else:
            print(f"[AUTH] ❌ Token verification failed")
    
    print(f"[AUTH] ❌ No valid auth found")
    return {"error": "Требуется авторизация"}, 401

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def static_files(path):
    return app.send_static_file(path)

@app.post("/api/register")
def api_register():
    try:
        data = request.get_json(force=True, silent=True) or {}
        body, code = register_user_service(data)
        return jsonify(body), code
    except Exception:
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

@app.get("/api/habits/<habit_id>/calendar")
def api_calendar(habit_id: str):
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    
    if not get_habit(habit_id, user_id):
        return jsonify({"error": "habit not found"}), 404
    
    entries = list(entries_collection.find({
        "habit_id": habit_id
    }).sort("date", 1))
    result = []
    for entry in entries:
        result.append({
            "date": entry["date"],
            "status": entry.get("status", False),
            "note": entry.get("note", "")
        })
    
    return jsonify({
        "habit_id": habit_id,
        "entries": result,
        "streak": streaks(habit_id)
    })

@app.get("/api/user/progress")
def api_user_progress():
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    
    user_id = get_verified_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    
    try:
        user_id_obj = ObjectId(user_id)
        user = users_collection.find_one({"_id": user_id_obj})
    except Exception:
        return jsonify({"error": "invalid_user_id"}), 400
    
    if not user:
        return jsonify({"error": "user_not_found"}), 404
    
    user_habits = list(habits_collection.find({
        "user_id": user_id,
        "is_active": True
    }))
    total_completed = 0
    longest_streak = 0
    category_stats = {}
    total_habits = len(user_habits)
    earned_badges = []
    for habit in user_habits:
        habit_id = str(habit["_id"])
        streak_data = streaks(habit_id)
        total_completed += streak_data.get("total_completed", 0)
        current_streak = streak_data.get("max", 0)
        if current_streak > longest_streak:
            longest_streak = current_streak
        category = habit.get("category", "other")
        if category and category != "other":
            if category not in category_stats:
                category_stats[category] = 0
            category_stats[category] += streak_data.get("total_completed", 0)
    xp = total_completed * 10
    level = 1
    level_ranges = [
        (0, 99, 1), (100, 249, 2), (250, 499, 3), (500, 999, 4),
        (1000, 1999, 5), (2000, 3999, 6), (4000, 7999, 7),
        (8000, 15999, 8), (16000, 31999, 9), (32000, float('inf'), 10)
    ]
    
    for min_xp, max_xp, lvl in level_ranges:
        if min_xp <= xp <= max_xp:
            level = lvl
            break
    if total_completed > 0:
        earned_badges.append('firstStep')
    for habit in user_habits:
        streak_data = streaks(str(habit["_id"]))
        if streak_data.get("max", 0) >= 7 and 'weekWarrior' not in earned_badges:
            earned_badges.append('weekWarrior')
            break
    for habit in user_habits:
        streak_data = streaks(str(habit["_id"]))
        if streak_data.get("max", 0) >= 30 and 'monthMaster' not in earned_badges:
            earned_badges.append('monthMaster')
            break
    for habit in user_habits:
        streak_data = streaks(str(habit["_id"]))
        if streak_data.get("max", 0) >= 100 and 'streakMaster' not in earned_badges:
            earned_badges.append('streakMaster')
            break
    for habit in user_habits:
        streak_data = streaks(str(habit["_id"]))
        if streak_data.get("total_completed", 0) >= 100 and 'hundredHero' not in earned_badges:
            earned_badges.append('hundredHero')
            break
    category_badge_map = {
        'sport': {'id': 'sportsman', 'min': 50},
        'study': {'id': 'scholar', 'min': 50},
        'health': {'id': 'healthGuru', 'min': 50},
        'work': {'id': 'workaholic', 'min': 50}
    }
    
    for category, badge_info in category_badge_map.items():
        if category_stats.get(category, 0) >= badge_info['min']:
            if badge_info['id'] not in earned_badges:
                earned_badges.append(badge_info['id'])
    if len([c for c in category_stats.keys() if c != 'other']) >= 4:
        if 'categoryCollector' not in earned_badges:
            earned_badges.append('categoryCollector')
    if total_habits >= 25:
        if 'habitMaster' not in earned_badges:
            earned_badges.append('habitMaster')
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    if total_habits > 0:
        perfect_week = True
        for habit in user_habits:
            habit_id = str(habit["_id"])
            week_entries = list(entries_collection.find({
                "habit_id": habit_id,
                "date": {"$gte": start_of_week.isoformat(), "$lte": today.isoformat()},
                "status": True
            }))
            days_in_week = (today - start_of_week).days + 1
            if len(week_entries) < days_in_week:
                perfect_week = False
                break
        
        if perfect_week and 'perfectWeek' not in earned_badges:
            earned_badges.append('perfectWeek')
    if total_completed >= 30 and 'consistency_king' not in earned_badges:
        earned_badges.append('consistency_king')
    users_collection.update_one(
        {"_id": user_id_obj},
        {"$set": {
            "xp": xp,
            "level": level,
            "badges": earned_badges,
            "totalHabitsCompleted": total_completed,
            "longestStreak": longest_streak,
            "categoryStats": category_stats
        }}
    )
    
    return jsonify({
        "xp": xp,
        "level": level,
        "level_emoji": "⭐",
        "level_name": f"Level {level}",
        "badges": earned_badges,
        "earned_badges": earned_badges,
        "total_completed": total_completed,
        "totalHabitsCompleted": total_completed,
        "longest_streak": longest_streak,
        "total_habits": total_habits
    })

@app.get("/api/user/stats")
def api_user_stats():
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    user_id = get_current_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    user_habits = list(habits_collection.find({
        "user_id": user_id,
        "is_active": True
    }))
    today = date.today()
    today_str = today.isoformat()
    completed_today = 0
    for habit in user_habits:
        habit_id = str(habit["_id"])
        entry = entries_collection.find_one({
            "habit_id": habit_id,
            "date": today_str,
            "status": True
        })
        if entry:
            completed_today += 1
    total_habits = len(user_habits)
    all_streaks = []
    total_completed = 0
    
    for habit in user_habits:
        habit_id = str(habit["_id"])
        streak_data = streaks(habit_id)
        all_streaks.append(streak_data)
        total_completed += streak_data.get("total_completed", 0)
    
    longest_streak = max((s.get("max", 0) for s in all_streaks), default=0)
    current_max_streak = max((s.get("current", 0) for s in all_streaks), default=0)
    
    return jsonify({
        "total_habits": total_habits,
        "completed_today": completed_today,
        "total_completed": total_completed,
        "longest_streak": longest_streak,
        "current_streak": current_max_streak
    })

@app.post("/api/user/steps/reward")
def api_check_step_reward():
    """
    Перевіряє чи досяг користувач цілі кроків сьогодні і видає винаграду (+20 XP)
    Очікує: { "stepsToday": 10500 }
    Повертає: { "rewarded": true, "xpAwarded": 20, "message": "..." }
    """
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    
    user_id = get_verified_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    
    data = request.get_json(force=True, silent=True) or {}
    steps_today = data.get("stepsToday", 0)
    
    print(f"[API:STEP_REWARD] 🎯 User {user_id} перевіряє винаграду за кроки: {steps_today}")
    
    result = check_and_reward_daily_steps(user_id, steps_today)
    
    return jsonify(result), 200

@app.put("/api/user/step-goal")
def api_update_step_goal():
    """
    Оновлює цільову кількість кроків для користувача
    Очікує: { "stepGoal": 15000 }
    Повертає: { "success": true, "stepGoal": 15000 }
    """
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    
    user_id = get_verified_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    
    data = request.get_json(force=True, silent=True) or {}
    new_goal = data.get("stepGoal", 10000)
    
    if not isinstance(new_goal, int) or new_goal < 1000:
        return jsonify({"error": "stepGoal повинна бути >= 1000"}), 400
    
    print(f"[API:STEP_GOAL] 📊 User {user_id} оновлює цільо на {new_goal}")
    
    if update_user_step_goal(user_id, new_goal):
        return jsonify({"success": True, "stepGoal": new_goal}), 200
    else:
        return jsonify({"error": "Failed to update step goal"}), 500

@app.get("/api/user/step-info")
def api_get_step_info():
    """
    Отримує інформацію про кроки користувача
    Повертає: { "userStepGoal": 10000, "stepRewardsByDate": {...} }
    """
    auth_error = require_auth()
    if auth_error:
        return jsonify(auth_error[0]), auth_error[1]
    
    user_id = get_verified_user_id()
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            return jsonify({"error": "user_not_found"}), 404
        
        return jsonify({
            "userStepGoal": user.get("userStepGoal", 10000),
            "stepRewardsByDate": user.get("stepRewardsByDate", {})
        }), 200
    except Exception as e:
        print(f"[API:STEP_INFO] ❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.get("/api/health")
def health():
    try:
        client.admin.command('ping')
        db_status = "connected"
        db_message = "MongoDB подключен"
    except Exception as e:
        db_status = "disconnected"
        db_message = f"MongoDB отключен: {str(e)[:100]}"
    return jsonify({
        "status": "ok",
        "service": "Habit Tracker API",
        "version": "2.0",
        "database": db_status,
        "database_message": db_message
    })

if __name__ == "__main__":
    print("\n" + "="*60)
    print("[STARTUP] Инициализация API сервера...")
    print("="*60)
    print(f"[STARTUP] MongoDB URI: {uri[:60]}...")
    init_db()
    print("="*60)
    port = int(os.environ.get("PORT", 10000))
    print(f"[STARTUP] ✓ API запущен на 0.0.0.0:{port}")
    print(f"[STARTUP] Откройте http://localhost:{port}")
    print("="*60 + "\n")
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)


