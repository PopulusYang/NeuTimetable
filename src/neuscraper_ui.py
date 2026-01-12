# -*- coding: utf-8 -*-
# Author: PopulusYang
# License: MIT
# Project: NEU Course Table Scraper

import sys
import time
from selenium import webdriver


def run():
    print("正在启动系统浏览器...")
    driver = None # 初始化驱动变量
    try:
        # 尝试顺序：Edge -> Chrome -> Firefox
        try:
            options = webdriver.EdgeOptions() # 创建 Edge 选项
            options.add_experimental_option('excludeSwitches', ['enable-logging']) # 过滤冗余日志
            driver = webdriver.Edge(options=options) # 启动 Edge
        except:
            try:
                options = webdriver.ChromeOptions() # 尝试 Chrome
                driver = webdriver.Chrome(options=options) # 启动 Chrome
            except:
                options = webdriver.FirefoxOptions() # 尝试 Firefox
                driver = webdriver.Firefox(options=options) # 启动 Firefox

        # 跳转到登录页面
        url = "https://jwxt.neu.edu.cn" # 教务系统地址
        driver.get(url) # 加载页面

        print("\n" + "=" * 60)
        print("【操作指引】")
        print("1. 请在弹出的浏览器窗口中手动登录。")
        print("2. 登录成功并进入课表页面后，点击浏览器左上角的【蓝色抓取按钮】。")
        print("3. 程序将自动检测点击并保存数据。")
        print("=" * 60 + "\n")

        # 注入按钮脚本
        inject_script = """
        (function() {
            if (document.getElementById('neu-scraper-btn')) return;
            var btn = document.createElement('button'); // 创建按钮元素
            btn.id = 'neu-scraper-btn'; // 设置 ID
            btn.innerHTML = '点击抓取课表数据'; // 按钮显示文字
            btn.style.position = 'fixed'; // 固定定位
            btn.style.top = '10px'; // 距离顶部
            btn.style.left = '10px'; // 距离左侧
            btn.style.zIndex = '999999'; // 置顶显示
            btn.style.padding = '10px 20px'; // 内边距
            btn.style.backgroundColor = '#0078d4'; // 背景色
            btn.style.color = 'white'; // 文字颜色
            btn.style.border = 'none'; // 无边框
            btn.style.borderRadius = '5px'; // 圆角
            btn.style.cursor = 'pointer'; // 鼠标手势
            btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)'; // 阴影
            btn.onclick = function() {
                window.neuScraperSignal = true; // 设置全局信号变量
                this.innerHTML = '正在抓取...'; // 更新按钮文字
                this.style.backgroundColor = '#ccc'; // 更新背景色
            };
            document.body.appendChild(btn); // 将按钮添加到页面
        })();
        """

        while True:
            try:
                # 检查是否有关闭浏览器
                _ = driver.window_handles # 获取窗口句柄
            except:
                print("浏览器已关闭。") # 发现浏览器已手动关闭
                break

            # 尝试注入按钮（防止跳转后消失）
            try:
                driver.execute_script(inject_script) # 执行 Javascript 注入
            except:
                pass # 忽略注入失败情况

            # 检查信号
            try:
                signal = driver.execute_script("return window.neuScraperSignal;") # 读取 JS 信号
                if signal:
                    print("检测到抓取信号，正在处理...") # 信号被触发
                    break
            except:
                pass # 忽略读取失败

            time.sleep(1) # 每秒检测一次

        print("正在获取页面源代码...")
        content = driver.page_source # 获取整个 HTML 内容

        if "kbappTimetableDayColumn" in content or "课表" in driver.title:
            with open("exp.html", "w", encoding="utf-8") as f:
                f.write(content) # 保存关键页面源代码
            print("\n【成功】课表已保存至 exp.html！")
        else:
            print("\n【注意】当前页面可能不是课表页，已强制保存源代码。")
            with open("exp.html", "w", encoding="utf-8") as f:
                f.write(content) # 备选保存逻辑

        print("抓取完成，正在关闭浏览器...")
        driver.quit() # 关闭浏览器并退出驱动进程

    except Exception as e:
        print(f"\n执行出错: {e}") # 打印错误信息
        print("请确保已安装 Microsoft Edge 浏览器。")
        input("按回车键退出...") # 等待用户确认


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"\n运行出错: {e}")
        input("按回车键退出...")
