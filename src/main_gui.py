# -*- coding: utf-8 -*-
# Author: PopulusYang
# License: MIT
# Project: NEU Course Table Universal GUI (Tkinter)

import tkinter as tk
from tkinter import messagebox
import subprocess
import os
import sys

class App:
    def __init__(self, root):
        self.root = root # 保存根窗口引用
        self.root.title("东大课表导出工具 (Cross-Platform)") # 设置窗口标题
        self.root.geometry("400x320") # 设置窗口初始大小
        self.root.resizable(False, False) # 禁止缩放窗口

        self.bg_color = "#f0f0f0" # 定义背景颜色
        self.root.configure(bg=self.bg_color) # 应用背景色

        tk.Label(root, text="第一步：点击按钮并在浏览器中登录抓取数据", bg=self.bg_color).pack(pady=(20, 5)) # 第一步提示
        self.btn_scrape = tk.Button(root, text="登录并抓取页面", command=self.run_scraper, height=2, width=20, bg="#0078d4", fg="white") # 抓取按钮
        self.btn_scrape.pack() # 放置按钮


        tk.Label(root, text="第二步：输入开学第一周周日的日期", bg=self.bg_color).pack(pady=(20, 2)) # 第二步提示
        tk.Label(root, text="(格式: YYYY-MM-DD)", font=("Arial", 8), bg=self.bg_color).pack() # 格式提示
        
        self.date_entry = tk.Entry(root, justify='center') # 日期输入框
        self.date_entry.insert(0, "2026-03-01") # 默认日期
        self.date_entry.pack(pady=5) # 放置输入框

        self.btn_gen = tk.Button(root, text="生成日历文件 (.ics)", command=self.generate_ics, height=2, width=20, bg="#28a745", fg="white") # 生成按钮
        self.btn_gen.pack(pady=10) # 放置生成按钮


        self.status_var = tk.StringVar(value="等待操作...") # 状态变量
        self.status_label = tk.Label(root, textvariable=self.status_var, fg="blue", bg=self.bg_color) # 状态显示标签
        self.status_label.pack(pady=10) # 放置状态标签

    def get_bin_path(self, name):

        script_dir = os.path.dirname(os.path.abspath(__file__)) # 获取脚本目录
        
        search_paths = [
            script_dir, # 当前目录
            os.path.join(script_dir, "..", "build", "bin"), # CMake 默认输出目录
            os.path.join(script_dir, "bin"), # bin 目录
        ]
        
        ext = ".exe" if os.name == 'nt' else "" # Windows 下添加 .exe 后缀
        bin_name = name + ext
        
        for p in search_paths:
            full_path = os.path.join(p, bin_name) # 拼接完整路径
            if os.path.exists(full_path): # 检查文件是否存在
                return full_path
        return bin_name # 找不到则返回原始名称尝试系统 PATH

    def run_scraper(self):
        self.status_var.set("正在启动浏览器...") # 更新状态
        script_dir = os.path.dirname(os.path.abspath(__file__)) # 获取脚本目录
        scraper_py = os.path.join(script_dir, "neuscraper_ui.py") # 拼接待执行脚本路径
        
        try:
            venv_pth = os.path.join(script_dir, "..", "venv", "Scripts" if os.name == 'nt' else "bin", "python") # 构造 venv 路径
            python_exe = venv_pth if os.path.exists(venv_pth) else sys.executable # 优先使用 venv 环境
            
            subprocess.Popen([python_exe, scraper_py]) # 异步启动爬虫程序
            self.status_var.set("已启动。请在浏览器中操作。") # 更新状态
        except Exception as e:
            self.status_var.set(f"发生错误: {str(e)}") # 捕获并显示错误

    def generate_ics(self):
        date = self.date_entry.get() # 获取输入框日期
        self.status_var.set("正在解析并生成日历...") # 更新状态
        
        bin_path = self.get_bin_path("NeuCourseTabel") # 获取 C++ 解析器路径
        
        try:
            result = subprocess.run([bin_path, date], capture_output=True, text=True) # 同步运行解析器
            if result.returncode == 0: # 检查运行结果
                self.status_var.set("成功！生成了 schedule.ics") # 更新状态
                messagebox.showinfo("完成", "日历文件生成成功！\n请将生成的 schedule.ics 导入你的日历软件。") # 弹窗提示
            else:
                self.status_var.set("解析失败") # 解析出错
                messagebox.showerror("错误", f"解析失败:\n{result.stderr or result.stdout}") # 显示错误信息
        except FileNotFoundError:
            self.status_var.set("错误：找不到 NeuCourseTabel 程序") # 文件找不到
            messagebox.showerror("错误", "找不到 NeuCourseTabel 二进制文件。\n请先执行编译（cmake & make）。") # 提示编译
        except Exception as e:
            self.status_var.set(f"发生错误: {str(e)}") # 其他异常

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
