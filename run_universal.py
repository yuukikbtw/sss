#!/usr/bin/env python3
"""
Универсальный скрипт запуска Habit Tracker
Автоматически определяет пути и настройки
"""
import os
import sys
import subprocess
import time
from pathlib import Path

def check_dependencies():
    """Проверяет наличие необходимых библиотек"""
    required = ['flask', 'pymongo']
    missing = []
    
    for module in required:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)
    
    return missing

def install_dependencies():
    """Устанавливает зависимости из requirements.txt"""
    requirements_file = Path(__file__).parent / 'requirements.txt'
    if requirements_file.exists():
        print("📦 Устанавливаем зависимости...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)])
    else:
        print("⚠️  requirements.txt не найден, устанавливаем основные пакеты...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', 'flask', 'pymongo'])

def main():
    print("🚀 Habit Tracker - Универсальный запуск")
    print("=" * 50)
    
    # Переходим в директорию скрипта
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    print(f"📁 Рабочая директория: {script_dir}")
    
    # Проверяем Python версию
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print(f"🐍 Python версия: {python_version}")
    
    # Проверяем зависимости
    missing = check_dependencies()
    if missing:
        print(f"❌ Отсутствуют библиотеки: {', '.join(missing)}")
        install_dependencies()
        
        # Проверяем еще раз
        missing = check_dependencies()
        if missing:
            print(f"❌ Не удалось установить: {', '.join(missing)}")
            return 1
    
    print("✅ Все зависимости установлены")
    
    # Запускаем серверы
    print("\n🚀 Запускаем серверы...")
    
    try:
        # Запускаем Flask API
        print("🔌 Запускаем Flask API сервер...")
        api_process = subprocess.Popen([sys.executable, 'py.py'])
        time.sleep(3)
        
        # Запускаем статический сервер
        print("🌐 Запускаем статический сервер...")
        static_process = subprocess.Popen([sys.executable, 'static_server.py'])
        time.sleep(2)
        
        print("\n✅ Серверы запущены!")
        print("🌍 Веб-приложение: http://localhost:8000")
        print("🔌 API сервер:     http://localhost:5001")
        print("\n🔴 Нажмите Ctrl+C для остановки серверов")
        
        # Ждем прерывания
        try:
            api_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Останавливаем серверы...")
            api_process.terminate()
            static_process.terminate()
            
    except Exception as e:
        print(f"❌ Ошибка запуска: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())