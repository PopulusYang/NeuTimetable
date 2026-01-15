import http.server
import socketserver
import mimetypes
import os
import sys

PORT = 8080

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        # 核心修复：确保 .action 文件被识别为网页
        if path.endswith(".action"):
            return "text/html"
        return super().guess_type(path)

    def do_POST(self):
        # 核心修复：支持 POST 请求。很多导入 App 会通过 POST 获取数据
        # 我们直接将其重定向到 GET 处理逻辑，共用同一套文件返回逻辑
        return self.do_GET()

    def end_headers(self):
        # 强制 UTF-8 编码并禁用缓存，确保数据实时更新
        if self.path.endswith(".action"):
            self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

# 强制允许端口复用
socketserver.TCPServer.allow_reuse_address = True

print(f"NEU Server starting on port {PORT}...")
with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at: http://0.0.0.0:{PORT}")
    httpd.serve_forever()
