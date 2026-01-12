import tkinter as tk
from tkinter import messagebox
import subprocess
import os
import sys

class App:
    def __init__(self, root):
        self.root = root
        self.root.title("东大课表导出工具 (Cross-Platform)")
        self.root.geometry("400x320")
        self.root.resizable(False, False)

        # Style colors
        self.bg_color = "#f0f0f0"
        self.root.configure(bg=self.bg_color)

        # Step 1
        tk.Label(root, text="第一步：点击按钮并在浏览器中登录抓取数据", bg=self.bg_color).pack(pady=(20, 5))
        self.btn_scrape = tk.Button(root, text="登录并抓取页面", command=self.run_scraper, height=2, width=20, bg="#0078d4", fg="white")
        self.btn_scrape.pack()

        # Step 2
        tk.Label(root, text="第二步：输入开学第一周周日的日期", bg=self.bg_color).pack(pady=(20, 2))
        tk.Label(root, text="(格式: YYYY-MM-DD)", font=("Arial", 8), bg=self.bg_color).pack()
        
        self.date_entry = tk.Entry(root, justify='center')
        self.date_entry.insert(0, "2026-03-01")
        self.date_entry.pack(pady=5)

        self.btn_gen = tk.Button(root, text="生成日历文件 (.ics)", command=self.generate_ics, height=2, width=20, bg="#28a745", fg="white")
        self.btn_gen.pack(pady=10)

        # Status
        self.status_var = tk.StringVar(value="等待操作...")
        self.status_label = tk.Label(root, textvariable=self.status_var, fg="blue", bg=self.bg_color)
        self.status_label.pack(pady=10)

    def get_bin_path(self, name):
        # 寻找 NeuCourseTabel 编译后的二进制文件
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # 常见路径搜索
        search_paths = [
            script_dir,
            os.path.join(script_dir, "..", "build", "bin"),
            os.path.join(script_dir, "bin"),
        ]
        
        ext = ".exe" if os.name == 'nt' else ""
        bin_name = name + ext
        
        for p in search_paths:
            full_path = os.path.join(p, bin_name)
            if os.path.exists(full_path):
                return full_path
        return bin_name # Fallback to system PATH

    def run_scraper(self):
        self.status_var.set("正在启动浏览器...")
        script_dir = os.path.dirname(os.path.abspath(__file__))
        scraper_py = os.path.join(script_dir, "neuscraper_ui.py")
        
        try:
            # 优先尝试 venv 里的 python
            venv_pth = os.path.join(script_dir, "..", "venv", "Scripts" if os.name == 'nt' else "bin", "python")
            python_exe = venv_pth if os.path.exists(venv_pth) else sys.executable
            
            subprocess.Popen([python_exe, scraper_py])
            self.status_var.set("已启动。请在浏览器中操作。")
        except Exception as e:
            self.status_var.set(f"发生错误: {str(e)}")

    def generate_ics(self):
        date = self.date_entry.get()
        self.status_var.set("正在解析并生成日历...")
        
        bin_path = self.get_bin_path("NeuCourseTabel")
        
        try:
            # 运行 C++ 二进制程序进行解析
            result = subprocess.run([bin_path, date], capture_output=True, text=True)
            if result.returncode == 0:
                self.status_var.set("成功！生成了 schedule.ics")
                messagebox.showinfo("完成", "日历文件生成成功！\n请将生成的 schedule.ics 导入你的日历软件。")
            else:
                self.status_var.set("解析失败")
                messagebox.showerror("错误", f"解析失败:\n{result.stderr or result.stdout}")
        except FileNotFoundError:
            self.status_var.set("错误：找不到 NeuCourseTabel 程序")
            messagebox.showerror("错误", "找不到 NeuCourseTabel 二进制文件。\n请先执行编译（cmake & make）。")
        except Exception as e:
            self.status_var.set(f"发生错误: {str(e)}")

if __name__ == "__main__":
    root = tk.Tk()
    app = App(root)
    root.mainloop()
