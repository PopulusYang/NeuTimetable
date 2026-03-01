# -*- coding: utf-8 -*-
# Author: PopulusYang
# License: MIT
# Project: NEU Course Table Scraper

import sys
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def run(username="", password=""):
    print("正在启动系统浏览器...")
    driver = None  # 初始化驱动变量
    try:
        # 尝试顺序：Edge -> Chrome -> Firefox
        try:
            options = webdriver.EdgeOptions()  # 创建 Edge 选项
            options.add_experimental_option(
                "excludeSwitches", ["enable-logging"]
            )  # 过滤冗余日志
            driver = webdriver.Edge(options=options)  # 启动 Edge
        except:
            try:
                options = webdriver.ChromeOptions()  # 尝试 Chrome
                driver = webdriver.Chrome(options=options)  # 启动 Chrome
            except:
                options = webdriver.FirefoxOptions()  # 尝试 Firefox
                driver = webdriver.Firefox(options=options)  # 启动 Firefox

        # 定义浏览器内的状态注入函数
        def update_browser_status(msg):
            try:
                driver.execute_script(
                    """
                (function(msg) {
                    var panel = document.getElementById('neu-scraper-panel');
                    if (panel) {
                        var statusEl = document.getElementById('neu-scraper-status');
                        if (statusEl && statusEl.innerText !== msg) {
                            statusEl.innerText = msg;
                        }
                        return;
                    }
                    var panel = document.createElement('div');
                    panel.id = 'neu-scraper-panel';
                    panel.style.position = 'fixed';
                    panel.style.top = '20px';
                    panel.style.right = '20px';
                    panel.style.zIndex = '9999999';
                    panel.style.padding = '15px';
                    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
                    panel.style.color = '#fff';
                    panel.style.borderRadius = '10px';
                    panel.style.fontFamily = '"PingFang SC", "Microsoft YaHei", sans-serif';
                    panel.style.boxShadow = '0 8px 20px rgba(0,0,0,0.5)';
                    panel.style.width = '240px';
                    panel.style.backdropFilter = 'blur(5px)';
                    
                    var title = document.createElement('div');
                    title.innerHTML = '🤖 自动化抓取助手';
                    title.style.fontWeight = 'bold';
                    title.style.marginBottom = '10px';
                    title.style.fontSize = '15px';
                    title.style.borderBottom = '1px solid #555';
                    title.style.paddingBottom = '8px';
                    
                    var statusDiv = document.createElement('div');
                    statusDiv.id = 'neu-scraper-status';
                    statusDiv.innerText = msg;
                    statusDiv.style.fontSize = '13px';
                    statusDiv.style.marginBottom = '12px';
                    statusDiv.style.color = '#00FF7F';
                    statusDiv.style.lineHeight = '1.4';
                    
                    var btn = document.createElement('button');
                    btn.id = 'neu-scraper-btn';
                    btn.innerHTML = '如果卡住，点我强制抓取';
                    btn.style.width = '100%';
                    btn.style.padding = '8px';
                    btn.style.backgroundColor = '#0078d4';
                    btn.style.color = 'white';
                    btn.style.border = 'none';
                    btn.style.borderRadius = '5px';
                    btn.style.cursor = 'pointer';
                    btn.style.fontSize = '12px';
                    btn.style.transition = 'background-color 0.2s';
                    btn.onmouseover = function() { this.style.backgroundColor = '#005a9e'; };
                    btn.onmouseout = function() { this.style.backgroundColor = '#0078d4'; };
                    btn.onclick = function() {
                        window.neuScraperSignal = true;
                        this.innerHTML = '已收到信号，准备抓取...';
                        this.style.backgroundColor = '#555';
                    };
                    
                    panel.appendChild(title);
                    panel.appendChild(statusDiv);
                    panel.appendChild(btn);
                    document.body.appendChild(panel);
                })(arguments[0]);
                """,
                    msg,
                )
            except:
                pass

        # 跳转到登录页面
        url = "https://jwxt.neu.edu.cn"  # 教务系统地址
        driver.get(url)  # 加载页面
        update_browser_status("正在加载统一身份认证系统...")

        if username and password:
            try:
                print("正在尝试自动填写账号和密码...")
                update_browser_status("正在自动填写账号密码并点击登录...")
                wait = WebDriverWait(driver, 5)
                # 等待密码输入框出现
                un_input = wait.until(EC.presence_of_element_located((By.ID, "un")))

                # 如果当前是扫码登录页面，切换到密码登录
                try:
                    pwd_tab = driver.find_element(By.ID, "password_login")
                    if "active" not in pwd_tab.get_attribute("class"):
                        driver.execute_script("arguments[0].click();", pwd_tab)
                        time.sleep(0.5)
                except:
                    pass

                un_input.clear()
                un_input.send_keys(username)

                pd_input = driver.find_element(By.ID, "pd")
                pd_input.clear()
                pd_input.send_keys(password)

                login_btn = driver.find_element(By.ID, "index_login_btn")
                login_btn.click()
                print("自动登录提交完成。如有验证码或跳转失败，请手动处理。")
            except Exception as e:
                print(f"自动填写账号失败，请手动登录。原因: {e}")

        print("\n" + "=" * 60)
        print("【操作指引】")
        print("1. 请在弹出的浏览器窗口中手动登录 (如果需要验证码)。")
        print("2. 登录成功后，程序会自动尝试跳转和抓取数据。")
        print("3. 如果自动抓取未响应，你可以点击页面左上角的【蓝色抓取按钮】强制打包。")
        print("=" * 60 + "\n")

        # 增加：在持续轮询的过程中，检测登录成功后自动跳转并点击并抓取
        auto_clicked_my_course = False
        auto_clicked_semester_course = False
        wait_data_timer = 0
        current_step_text = "等待登录中...\n(如果页面已加载，请手动登录)"

        while True:
            try:
                # 检查是否有关闭浏览器
                _ = driver.window_handles  # 获取窗口句柄
            except:
                print("浏览器已关闭。")  # 发现浏览器已手动关闭
                break

            # --- 自动跳转逻辑 ---
            try:
                # 当我们在主页或刚登录之后的页面
                current_url = driver.current_url

                # 如果没有点过“我的课表”，并且似乎已经登录进去了
                if not auto_clicked_my_course and (
                    "homeapp/index.do" in current_url
                    or "homeapp/home/index.html" in current_url
                ):
                    current_step_text = "登录成功！\n正在寻找并点击[我的课表]..."
                    update_browser_status(current_step_text)
                    try:
                        # 查找首页的我的课表应用模块图标
                        course_module = driver.find_element(
                            By.XPATH,
                            "//div[contains(@class, 'app-icon') and contains(@title, '我的课表')]|//span[contains(text(), '我的课表')]|//div[contains(text(), '我的课表')]",
                        )
                        # 使用 JS 点击以避免被拦截
                        driver.execute_script("arguments[0].click();", course_module)
                        print("自动点击：[我的课表]")
                        auto_clicked_my_course = True
                        time.sleep(1)
                    except:
                        pass

                # 如果成功进入我的课表，还没点进入学期课表
                if (
                    auto_clicked_my_course
                    and not auto_clicked_semester_course
                    and (
                        "student/courseTable" in current_url
                        or "homeapp/home/index.html" in current_url
                    )
                ):
                    current_step_text = "进入课表模块成功！\n正在切换至[学期课表]..."
                    update_browser_status(current_step_text)
                    try:
                        # 查找学期课表 tab 选项卡或者链接
                        semester_tab = driver.find_element(
                            By.XPATH,
                            "//a[contains(text(), '学期课表')]|//li[contains(text(), '学期课表')]|//div[contains(text(), '学期课表')]|//span[contains(text(), '学期课表')]",
                        )
                        driver.execute_script("arguments[0].click();", semester_tab)
                        print("自动点击：[学期课表]")
                        auto_clicked_semester_course = True
                        time.sleep(1)
                    except:
                        pass

                # 自动检测是否已经抓取到真实课表（通过页面源码是否包含特定元素作为证据）
                if auto_clicked_my_course and auto_clicked_semester_course:
                    current_step_text = "正在检测课表数据加载情况...\n(请等待数据刷新)"
                    update_browser_status(current_step_text)
                    page_html_content = driver.page_source
                    if "kbappTimetableDayColumn" in page_html_content:
                        wait_data_timer += 1
                        current_step_text = f"检测到课表数据！(校验 {wait_data_timer}/2)\n等待渲染完成..."
                        update_browser_status(current_step_text)
                        # 等待 2 秒确保页面 ajax 渲染完成
                        if wait_data_timer >= 2:
                            print("自动检测到学期课表已加载完成！触发自动抓取...")
                            current_step_text = "渲染完成！\n正在触发自动提取与打包..."
                            update_browser_status(current_step_text)
                            time.sleep(1)
                            break
            except Exception as e:
                pass
            # ---------------------

            # 尝试注入并更新悬浮窗状态
            update_browser_status(current_step_text)

            # 检查信号
            try:
                signal = driver.execute_script(
                    "return window.neuScraperSignal;"
                )  # 读取 JS 信号
                if signal:
                    print("检测到抓取信号，正在处理...")  # 信号被触发
                    current_step_text = "★ 收到手动指令，强制打包中..."
                    update_browser_status(current_step_text)
                    time.sleep(0.5)
                    break
            except:
                pass  # 忽略读取失败

            time.sleep(1)  # 每秒检测一次

        print("正在获取页面源代码...")
        content = driver.page_source  # 获取整个 HTML 内容

        if "kbappTimetableDayColumn" in content or "课表" in driver.title:
            with open("exp.html", "w", encoding="utf-8") as f:
                f.write(content)  # 保存关键页面源代码
            print("\n【成功】课表已保存至 exp.html！")
        else:
            print("\n【注意】当前页面可能不是课表页，已强制保存源代码。")
            with open("exp.html", "w", encoding="utf-8") as f:
                f.write(content)  # 备选保存逻辑

        print("抓取完成，正在关闭浏览器...")
        driver.quit()  # 关闭浏览器并退出驱动进程

    except Exception as e:
        print(f"\n执行出错: {e}")  # 打印错误信息
        print("请确保已安装 Microsoft Edge 浏览器。")
        input("按回车键退出...")  # 等待用户确认


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"\n运行出错: {e}")
        input("按回车键退出...")
