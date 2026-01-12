# -*- coding: utf-8 -*-
# Author: PopulusYang
# License: MIT
# Project: NEU Course Table Scraper

import sys
import time
from selenium import webdriver


def run():
    print("正在启动系统浏览器...")
    driver = None
    try:
        # 尝试顺序：Edge -> Chrome -> Firefox
        try:
            options = webdriver.EdgeOptions()
            options.add_experimental_option('excludeSwitches', ['enable-logging'])
            driver = webdriver.Edge(options=options)
        except:
            try:
                options = webdriver.ChromeOptions()
                driver = webdriver.Chrome(options=options)
            except:
                options = webdriver.FirefoxOptions()
                driver = webdriver.Firefox(options=options)

        # 跳转到登录页面
        url = "https://jwxt.neu.edu.cn"
        driver.get(url)

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
            var btn = document.createElement('button');
            btn.id = 'neu-scraper-btn';
            btn.innerHTML = '点击抓取课表数据';
            btn.style.position = 'fixed';
            btn.style.top = '10px';
            btn.style.left = '10px';
            btn.style.zIndex = '999999';
            btn.style.padding = '10px 20px';
            btn.style.backgroundColor = '#0078d4';
            btn.style.color = 'white';
            btn.style.border = 'none';
            btn.style.borderRadius = '5px';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
            btn.onclick = function() {
                window.neuScraperSignal = true;
                this.innerHTML = '正在抓取...';
                this.style.backgroundColor = '#ccc';
            };
            document.body.appendChild(btn);
        })();
        """

        while True:
            try:
                # 检查是否有关闭浏览器
                _ = driver.window_handles
            except:
                print("浏览器已关闭。")
                break

            # 尝试注入按钮（防止跳转后消失）
            try:
                driver.execute_script(inject_script)
            except:
                pass

            # 检查信号
            try:
                signal = driver.execute_script("return window.neuScraperSignal;")
                if signal:
                    print("检测到抓取信号，正在处理...")
                    break
            except:
                pass

            time.sleep(1)

        print("正在获取页面源代码...")
        content = driver.page_source

        if "kbappTimetableDayColumn" in content or "课表" in driver.title:
            with open("exp.html", "w", encoding="utf-8") as f:
                f.write(content)
            print("\n【成功】课表已保存至 exp.html！")
        else:
            print("\n【注意】当前页面可能不是课表页，已强制保存源代码。")
            with open("exp.html", "w", encoding="utf-8") as f:
                f.write(content)

        print("抓取完成，正在关闭浏览器...")
        driver.quit()

    except Exception as e:
        print(f"\n执行出错: {e}")
        print("请确保已安装 Microsoft Edge 浏览器。")
        input("按回车键退出...")


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"\n运行出错: {e}")
        input("按回车键退出...")
