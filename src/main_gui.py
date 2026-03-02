# -*- coding: utf-8 -*-
# Author: PopulusYang
# License: MIT
# Project: NEU Course Table Universal GUI (Tkinter)

import tkinter as tk
from tkinter import messagebox
import tkinter.scrolledtext as scrolledtext
import subprocess
import os
import sys
import threading
import socket
import ctypes
import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler
import neuscraper_ui


def get_base_dir():
    """获取程序运行基准路径（兼容 PyInstaller 的提取目录）"""
    if hasattr(sys, "_MEIPASS"):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


# ---------- Web Server 相关 ----------
class MyHandler(SimpleHTTPRequestHandler):
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

    def log_message(self, format, *args):
        # 覆盖默认日志，如果是 GUI 模式则发送到界面
        msg = f"{self.address_string()} - - [{self.log_date_time_string()}] {format % args}"
        if hasattr(MyHandler, "app_instance") and MyHandler.app_instance:
            # 捕获日志并推送到界面
            MyHandler.app_instance.root.after(
                0, lambda: MyHandler.app_instance.append_log(msg, "INFO")
            )
        else:
            sys.stderr.write(msg + "\n")


# -----------------------------------


class App:
    def __init__(self, root):
        self.root = root  # 保存根窗口引用
        self.root.title("东大课表导出工具 (Cross-Platform)")  # 设置窗口标题
        self.root.geometry("450x550")  # 设置窗口初始大小
        self.root.resizable(False, False)  # 禁止缩放窗口

        self.bg_color = "#fefefe"  # 定义背景颜色更明亮
        self.root.configure(bg=self.bg_color)  # 应用背景色

        # 使用 Frame 组织上半部分，使其更紧凑
        top_frame = tk.Frame(root, bg=self.bg_color)
        top_frame.pack(fill=tk.X, padx=15, pady=(10, 0))

        # --- 设置与学号区域并行布局 ---
        grid_frame = tk.Frame(top_frame, bg=self.bg_color)
        grid_frame.pack(fill=tk.X, pady=(0, 5))

        tk.Label(grid_frame, text="开学周日:", bg=self.bg_color).grid(
            row=0, column=0, padx=5, pady=2, sticky="e"
        )

        now = datetime.datetime.now()
        if 2 <= now.month <= 7:
            target_date = datetime.date(now.year, 3, 1)
        elif now.month == 1:
            target_date = datetime.date(now.year - 1, 9, 1)
        else:
            target_date = datetime.date(now.year, 9, 1)

        # 找到离 target_date 最近的周日
        weekday = int(target_date.strftime("%w"))  # 0 是周日，1-6 是周一到周六
        if weekday != 0:
            if weekday <= 3:
                # 距离上个周日更近
                delta = datetime.timedelta(days=-weekday)
            else:
                # 距离下一个周日更近
                delta = datetime.timedelta(days=7 - weekday)
            target_date += delta

        auto_date = target_date.strftime("%Y-%m-%d")

        self.date_entry = tk.Entry(grid_frame, justify="center", width=12)
        self.date_entry.insert(0, auto_date)
        self.date_entry.grid(row=0, column=1, padx=5, pady=2, sticky="w")

        tk.Label(grid_frame, text="学号:", bg=self.bg_color).grid(
            row=1, column=0, padx=5, pady=2, sticky="e"
        )
        self.user_entry = tk.Entry(grid_frame, width=12)
        self.user_entry.grid(row=1, column=1, padx=5, pady=2, sticky="w")

        tk.Label(grid_frame, text="密码:", bg=self.bg_color).grid(
            row=1, column=2, padx=5, pady=2, sticky="e"
        )
        self.pwd_entry = tk.Entry(grid_frame, width=12, show="*")
        self.pwd_entry.grid(row=1, column=3, padx=5, pady=2, sticky="w")

        # 让列居中
        grid_frame.grid_columnconfigure(0, weight=1)
        grid_frame.grid_columnconfigure(3, weight=1)

        # --- 第三部分：导出选项 ---
        export_frame = tk.Frame(top_frame, bg=self.bg_color)
        export_frame.pack(fill=tk.X, pady=(5, 5))

        self.var_ics = tk.BooleanVar(value=True)
        self.var_csv = tk.BooleanVar(value=True)
        self.var_html = tk.BooleanVar(value=True)

        # 居中对齐多选框
        export_inner = tk.Frame(export_frame, bg=self.bg_color)
        export_inner.pack(pady=2)
        tk.Checkbutton(
            export_inner,
            text="ICS日历",
            variable=self.var_ics,
            bg=self.bg_color,
            font=("Arial", 9),
        ).pack(side=tk.LEFT, padx=15)
        tk.Checkbutton(
            export_inner,
            text="CSV表格",
            variable=self.var_csv,
            bg=self.bg_color,
            font=("Arial", 9),
        ).pack(side=tk.LEFT, padx=15)
        tk.Checkbutton(
            export_inner,
            text="HTML预览",
            variable=self.var_html,
            bg=self.bg_color,
            font=("Arial", 9),
        ).pack(side=tk.LEFT, padx=15)

        # --- 第四部分：操作按钮 ---
        action_frame = tk.Frame(root, bg=self.bg_color)
        action_frame.pack(fill=tk.X, padx=15, pady=5)

        self.btn_scrape = tk.Button(
            action_frame,
            text="一键抓取并生成",
            command=self.run_scraper,
            height=2,
            bg="#0078d4",
            fg="white",
            font=("Arial", 10, "bold"),
            relief=tk.GROOVE,
        )  # 抓取按钮
        self.btn_scrape.pack(fill=tk.X, pady=(0, 5))

        bottom_action_frame = tk.Frame(action_frame, bg=self.bg_color)
        bottom_action_frame.pack(fill=tk.X)
        self.btn_gen = tk.Button(
            bottom_action_frame,
            text="仅生成本地文件",
            command=self.generate_ics,
            height=1,
            bg="#28a745",
            fg="white",
            relief=tk.GROOVE,
        )  # 生成按钮
        self.btn_gen.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 2))

        # 第四步：后端共享
        self.btn_server = tk.Button(
            bottom_action_frame,
            text="开启局域网共享",
            command=self.toggle_server,
            height=1,
            bg="#6c757d",
            fg="white",
            relief=tk.GROOVE,
        )
        self.btn_server.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(2, 2))

        self.btn_copy_url = tk.Button(
            bottom_action_frame,
            text="复制网址",
            command=self.copy_url,
            height=1,
            bg="#17a2b8",
            fg="white",
            relief=tk.GROOVE,
            state="disabled",
        )
        self.btn_copy_url.pack(side=tk.RIGHT, expand=True, fill=tk.X, padx=(2, 0))

        self.server_thread = None
        self.httpd = None
        self.server_url = ""

        self.status_var = tk.StringVar(value="等待操作...")  # 状态变量
        self.status_label = tk.Label(
            root,
            textvariable=self.status_var,
            fg="#005a9e",
            bg=self.bg_color,
            font=("Arial", 9, "bold"),
        )  # 状态显示标签
        self.status_label.pack(pady=(5, 2))  # 放置状态标签

        # 日志输出框
        log_frame = tk.Frame(root, bg="#ddd")
        log_frame.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 15))
        self.log_text = scrolledtext.ScrolledText(
            log_frame,
            height=10,
            state="disabled",
            font=("Consolas", 8),
            bg="#222",
            fg="#ddd",
            borderwidth=0,
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=1, pady=1)

        # 配置日志颜色标签 (深色背景主题)
        self.log_text.tag_config("DEBUG", foreground="#888")
        self.log_text.tag_config("INFO", foreground="#7FFF00")
        self.log_text.tag_config("WARN", foreground="#FFD700")
        self.log_text.tag_config("ERROR", foreground="#FF6347")

    def append_log(self, text, level_tag):
        self.log_text.configure(state="normal")
        self.log_text.insert(tk.END, text + "\n", level_tag)
        self.log_text.see(tk.END)
        self.log_text.configure(state="disabled")
        self.root.update_idletasks()

    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    def toggle_server(self):
        if self.httpd:
            self.httpd.shutdown()
            self.httpd = None
            self.btn_server.config(text="开启局域网共享", bg="#6c757d")
            self.btn_copy_url.config(state="disabled")
            self.server_url = ""
            self.status_var.set("后端已关闭")
            return

        def run_server():
            nonlocal self
            try:
                # 使用执行目录而不是代码提取目录，确保能访问到 exp_old.html
                if hasattr(sys, "_MEIPASS"):
                    proj_root = os.path.dirname(sys.executable)
                else:
                    proj_root = os.path.dirname(
                        os.path.dirname(os.path.abspath(__file__))
                    )
                os.chdir(proj_root)

                server_address = ("", 8080)
                socket.setdefaulttimeout(None)  # 防止 server accept 抛出 timeout
                HTTPServer.allow_reuse_address = True
                MyHandler.app_instance = self
                self.httpd = HTTPServer(server_address, MyHandler)
                ip = self.get_local_ip()
                url = f"http://{ip}:8080/exp_old.html"
                self.server_url = url
                self.root.after(
                    0, lambda: self.status_var.set(f"已开启！共享地址: {url}")
                )
                self.root.after(
                    0,
                    lambda: self.btn_server.config(text="关闭局域网共享", bg="#dc3545"),
                )
                self.root.after(0, lambda: self.btn_copy_url.config(state="normal"))
                self.root.after(
                    0, lambda: self.append_log(f"Server started at {url}", "INFO")
                )
                self.httpd.serve_forever()
            except Exception as e:
                self.root.after(0, lambda: self.status_var.set(f"服务启动失败: {e}"))
                self.httpd = None
                self.root.after(0, lambda: self.btn_copy_url.config(state="disabled"))

        self.server_thread = threading.Thread(target=run_server, daemon=True)
        self.server_thread.start()

    def copy_url(self):
        if self.server_url:
            self.root.clipboard_clear()
            self.root.clipboard_append(self.server_url)
            self.root.update()
            self.status_var.set("已复制网址到剪贴板！")
            self.append_log("Selected URL copied to clipboard.", "INFO")

    def get_bin_path(self, name):

        script_dir = os.path.dirname(os.path.abspath(__file__))  # 获取脚本目录

        search_paths = [
            script_dir,  # 当前目录
            os.path.join(script_dir, "..", "build", "bin"),  # CMake 默认输出目录
            os.path.join(script_dir, "bin"),  # bin 目录
        ]

        ext = ".exe" if os.name == "nt" else ""  # Windows 下添加 .exe 后缀
        bin_name = name + ext

        for p in search_paths:
            full_path = os.path.join(p, bin_name)  # 拼接完整路径
            if os.path.exists(full_path):  # 检查文件是否存在
                return full_path
        return bin_name  # 找不到则返回原始名称尝试系统 PATH

    def run_scraper(self):
        user = self.user_entry.get().strip()
        pwd = self.pwd_entry.get().strip()

        self.status_var.set("正在启动浏览器...")  # 更新状态

        def scraper_thread():
            try:
                neuscraper_ui.run(username=user, password=pwd)
                self.root.after(
                    0, lambda: self.status_var.set("抓取成功！正在自动生成课表...")
                )
                # 抓取完成后，回到主线程启动生成任务（从而安全获取 UI 数据并在后台处理）
                self.root.after(500, self.generate_ics)
            except Exception as e:
                self.root.after(0, lambda: self.status_var.set(f"发生错误: {str(e)}"))

        threading.Thread(target=scraper_thread, daemon=True).start()

    def generate_ics(self):
        # 获取输入框内容（主线程安全操作）
        try:
            date_str = self.date_entry.get()
            enable_ics = bool(self.var_ics.get())
            enable_csv = bool(self.var_csv.get())
            enable_html = bool(self.var_html.get())
            
            # 在后台线程中运行耗时任务
            threading.Thread(
                target=self._generate_core,
                args=(date_str, enable_ics, enable_csv, enable_html),
                daemon=True
            ).start()
        except Exception as e:
            messagebox.showerror("错误", f"无法启动生成任务: {e}")

    def _generate_core(self, date_str, enable_ics, enable_csv, enable_html):
        # 后台线程执行核心生成逻辑
        date = date_str.encode("utf-8")
        
        # 使用 after 更新 UI
        self.root.after(0, lambda: self.status_var.set("正在解析并生成..."))

        try:
            # 加载 DLL
            base_dir = get_base_dir()
            if os.name == "nt":
                dll_name = "NeuCourseTabel.dll"
            elif sys.platform == "darwin":
                dll_name = "libNeuCourseTabel.dylib"
            else:
                dll_name = "libNeuCourseTabel.so"

            # 兼容 MinGW 编译出来的名称
            if os.name == "nt" and not os.path.exists(os.path.join(base_dir, dll_name)):
                if os.path.exists(os.path.join(base_dir, "libNeuCourseTabel.dll")):
                    dll_name = "libNeuCourseTabel.dll"
                elif os.path.exists(
                    os.path.join(
                        base_dir, "..", "build", "bin", "libNeuCourseTabel.dll"
                    )
                ):
                    base_dir = os.path.join(base_dir, "..", "build", "bin")
                    dll_name = "libNeuCourseTabel.dll"
                elif os.path.exists(
                    os.path.join(base_dir, "..", "build", "bin", "NeuCourseTabel.dll")
                ):
                    base_dir = os.path.join(base_dir, "..", "build", "bin")
            
            # 兼容 Linux/macOS 开发环境路径查找
            if os.name != "nt" and not os.path.exists(os.path.join(base_dir, dll_name)):
                # 尝试查找 build/bin 和 build 目录
                dev_paths = [
                    os.path.join(base_dir, "..", "build", "bin", dll_name),
                    os.path.join(base_dir, "..", "build", dll_name)
                ]
                for p in dev_paths:
                    if os.path.exists(p):
                        base_dir = os.path.dirname(p)
                        # dll_name 保持不变
                        break

            dll_path = os.path.join(base_dir, dll_name)
            if not os.path.exists(dll_path):
                raise FileNotFoundError(dll_path)

            parser_dll = ctypes.CDLL(dll_path)

            # C 类型回调定义
            LOG_CALLBACK = ctypes.CFUNCTYPE(None, ctypes.c_int, ctypes.c_char_p)

            def log_callback(level, msg):
                try:
                    level_names = {0: "DEBUG", 1: "INFO", 2: "WARN", 3: "ERROR"}
                    level_tag = level_names.get(level, "INFO")
                    msg_str = msg.decode("utf-8", errors="replace")
                    # 使用 root.after 确保线程安全
                    self.root.after(0, lambda: self.append_log(msg_str, level_tag))
                except Exception as e:
                    print("Log callback error:", e)

            # 保持回调函数的引用以防被垃圾回收
            self._log_cb = LOG_CALLBACK(log_callback)

            # 绑定回调函数
            parser_dll.set_log_callback.argtypes = [LOG_CALLBACK]
            parser_dll.set_log_callback.restype = None
            parser_dll.set_log_callback(self._log_cb)

            parser_dll.run_parser.argtypes = [
                ctypes.c_char_p,
                ctypes.c_bool,
                ctypes.c_bool,
                ctypes.c_bool,
            ]
            parser_dll.run_parser.restype = ctypes.c_int

            result = parser_dll.run_parser(date, enable_ics, enable_csv, enable_html)

            if result == 0:
                self.root.after(0, lambda: self.status_var.set("生成成功！"))
                self.root.after(0, lambda: messagebox.showinfo("完成", "文件生成成功！"))
            else:
                self.root.after(0, lambda: self.status_var.set("解析失败"))
                self.root.after(0, lambda: messagebox.showerror("错误", f"解析失败，返回值：{result}"))

        except FileNotFoundError:
            self.root.after(0, lambda: self.status_var.set("错误：找不到 NeuCourseTabel 核心库"))
            self.root.after(0, lambda: messagebox.showerror(
                "错误", "找不到 NeuCourseTabel 链接库。\n请先执行编译。"
            ))
        except Exception as e:
            self.root.after(0, lambda: self.status_var.set(f"发生错误: {str(e)}"))
            self.root.after(0, lambda: messagebox.showerror("错误", f"发生未知错误: {str(e)}"))
        except Exception as e:
            self.status_var.set(f"发生错误: {str(e)}")


if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
