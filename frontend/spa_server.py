from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os


ROOT = Path(__file__).resolve().parent / "dist"
PORT = int(os.getenv("PORT", "5173"))


class SpaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def guess_type(self, path):
        if path.endswith((".js", ".mjs")):
            return "application/javascript"
        if path.endswith(".css"):
            return "text/css"
        if path.endswith(".svg"):
            return "image/svg+xml"
        return super().guess_type(path)

    def do_GET(self):
        target = (ROOT / self.path.lstrip("/")).resolve()
        if self.path == "/" or not target.exists() or target.is_dir():
          self.path = "/index.html"
        return super().do_GET()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), SpaHandler)
    print(f"[BurnoutGuard] Frontend SPA server running on http://localhost:{PORT}")
    server.serve_forever()
