#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🌐 Habit Tracker - Static File Server
Красивый статический сервер с CORS поддержкой
"""

from http.server import HTTPServer, SimpleHTTPRequestHandler
import os
import json
import sys

# Загружаем конфигурацию
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return {"static": {"port": 8000, "host": "localhost"}}

config = load_config()

# Автоматически используем директорию скрипта
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

class CORSRequestHandler(SimpleHTTPRequestHandler):
    """Улучшенный обработчик с CORS и красивыми логами"""
    
    def end_headers(self):
        # Максимально открытый CORS для локальной разработки
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        """Обработка preflight запросов"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        # Автоматический редирект на index.html
        if self.path == '/':
            self.path = '/index.html'
        super().do_GET()
    
    def log_message(self, format, *args):
        """Красивые логи запросов"""
        sys.stdout.write(f"📄 {self.address_string()} - {format % args}\n")

if __name__ == '__main__':
    port = config["static"]["port"]
    host = config["static"]["host"]
    
    print("\n" + "="*70)
    print("           🌐 HABIT TRACKER - STATIC SERVER")
    print("="*70)
    print(f"\n📡 Сервер:        http://{host}:{port}")
    print(f"🏠 Директория:    {os.getcwd()}")
    print(f"🔗 Приложение:    http://{host}:{port}/index.html")
    print(f"🎯 API Backend:   http://localhost:5001/api")
    print("\n📦 Доступные файлы:")
    
    files = sorted([f for f in os.listdir('.') if f.endswith(('.html', '.js', '.css', '.json', '.png', '.ico'))])
    for i, file in enumerate(files, 1):
        icon = {'html': '📄', 'js': '⚡', 'css': '🎨', 'json': '⚙️', 'png': '🖼️', 'ico': '🖼️'}
        ext = file.split('.')[-1]
        print(f"   {icon.get(ext, '📄')} {file}")
    
    print("\n" + "="*70)
    print("✅ Сервер запущен! Нажмите Ctrl+C для остановки")
    print("="*70 + "\n")
    
    server = HTTPServer((host, port), CORSRequestHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Сервер остановлен")
        server.server_close()
        sys.exit(0)