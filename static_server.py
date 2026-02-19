import json
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def load_config():
    defaults = {"static": {"port": 8000, "host": "127.0.0.1"}}
    path = os.path.join(os.path.dirname(__file__), 'config.json')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data.get("static"), dict):
            defaults["static"].update(data["static"])
        return defaults
    except (FileNotFoundError, json.JSONDecodeError):
        return defaults

config = load_config()

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Allow-Credentials', 'true')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        super().do_GET()

if __name__ == '__main__':
    host = config["static"]["host"]
    port = config["static"]["port"]
    server = HTTPServer((host, port), CORSRequestHandler)
    print(f"Static: http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
        sys.exit(0)
