"""
Bharat Bee HoneyChain - tiny local server.
Serves the website AND shares the blockchain data between devices,
so a phone that scans a QR code sees the same batches as your laptop.

Run:   python local/server.py   (or double-click start.bat)
"""
import json, os, socket, sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # project root (this file lives in local/)
DATA = os.path.join(ROOT, "data.json")


def lan_ip():
    """Find this computer's Wi-Fi/LAN address (no traffic is actually sent)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"
    finally:
        s.close()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=ROOT, **k)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/host":
            return self._json({"ip": lan_ip(), "port": PORT})
        if path == "/api/state":
            try:
                with open(DATA, encoding="utf-8") as f:
                    return self._json(json.load(f))
            except Exception:
                return self._json({})
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/state":
            return self._json({"error": "not found"}, 404)
        try:
            n = int(self.headers.get("Content-Length", 0))
            obj = json.loads(self.rfile.read(n) or b"{}")
            tmp = DATA + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(obj, f)
            os.replace(tmp, DATA)
            return self._json({"ok": True})
        except Exception as e:
            return self._json({"error": str(e)}, 400)

    def log_message(self, fmt, *args):
        if "/api/" not in (args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    ip = lan_ip()
    print("\n  Bharat Bee HoneyChain is running\n")
    print(f"  On this computer : http://localhost:{PORT}")
    print(f"  On your phone    : http://{ip}:{PORT}   (same Wi-Fi)\n")
    print("  Press Ctrl+C to stop.\n")
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
