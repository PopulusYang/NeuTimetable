# -*- coding: utf-8 -*-
# Author: PopulusYang
# License: MIT
# Project: NEU Course Table Scraper

import os
import sys
import time
from playwright.sync_api import sync_playwright

# 如果是打包环境，设置 Playwright 浏览器路径
if getattr(sys, "frozen", False):
    os.environ["PLAYWRIGHT_BROWSERS_PATH"] = os.path.join(
        sys._MEIPASS, "playwright-browsers"
    )


def run(username="", password=""):
    print("正在启动内置浏览器...")

    with sync_playwright() as p:
        try:
            # 启动 Playwright 内置 Chromium 浏览器
            # args 参数用于规避一些检测，并最大化窗口体验
            browser = p.chromium.launch(
                headless=False,
                args=["--start-maximized", "--no-sandbox", "--disable-infobars"],
            )
            context = browser.new_context(
                no_viewport=True
            )  # no_viewport 配合 start-maximized 使用
            page = context.new_page()
        except Exception as e:
            msg = f"启动浏览器失败: {e}"
            print(msg)
            if "Executable doesn't exist at" in str(e):
                print(
                    "\n[Tip] 似乎未安装浏览器内核，请尝试在终端执行: playwright install chromium"
                )
            return

        # 定义浏览器内的状态注入函数
        def update_browser_status(msg):
            try:
                # 检查页面是否还存活
                if page.is_closed():
                    return

                page.evaluate(
                    """(msg) => {
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
                }""",
                    msg,
                )
            except Exception:
                pass

        try:
            # 跳转到登录页面
            url = "https://jwxt.neu.edu.cn"  # 教务系统地址
            print(f"正在访问: {url}")
            page.goto(url)
            update_browser_status("正在加载统一身份认证系统...")

            if username and password:
                try:
                    print("正在尝试自动填写账号和密码...")
                    update_browser_status("正在自动填写账号密码并点击登录...")

                    # 等待用户名输入框出现
                    page.wait_for_selector("#un", timeout=5000)

                    # 如果当前是扫码登录页面，切换到密码登录
                    try:
                        pwd_tab = page.locator("#password_login")
                        # 检查是否有 active 类
                        if "active" not in pwd_tab.get_attribute("class") or "":
                            pwd_tab.click()
                            time.sleep(0.5)
                    except:
                        pass

                    page.fill("#un", username)
                    page.fill("#pd", password)
                    page.click("#index_login_btn")

                    print("自动登录提交完成。如有验证码或跳转失败，请手动处理。")
                except Exception as e:
                    print(f"自动填写账号失败，请手动登录。原因: {e}")

            print("\n" + "=" * 60)
            print("【操作指引】")
            print("1. 请在弹出的浏览器窗口中手动登录 (如果需要验证码)。")
            print("2. 登录成功后，程序会自动尝试跳转和抓取数据。")
            print(
                "3. 如果自动抓取未响应，你可以点击页面左上角的【蓝色抓取按钮】强制打包。"
            )
            print("=" * 60 + "\n")

            # 增加：在持续轮询的过程中，检测登录成功后自动跳转并点击并抓取
            auto_clicked_my_course = False
            auto_clicked_semester_course = False
            wait_data_timer = 0
            current_step_text = "等待登录中...\n(如果页面已加载，请手动登录)"

            while True:
                # 检查页面是否已关闭
                if page.is_closed():
                    print("浏览器已关闭。")
                    return

                # --- 自动跳转逻辑 ---
                try:
                    current_url = page.url

                    # 如果没有点过“我的课表”，并且似乎已经登录进去了
                    if not auto_clicked_my_course and (
                        "homeapp/index.do" in current_url
                        or "homeapp/home/index.html" in current_url
                    ):
                        current_step_text = "登录成功！\n正在寻找并点击[我的课表]..."
                        update_browser_status(current_step_text)
                        try:
                            # 查找首页的我的课表应用模块图标
                            # Playwright XPath 选择器
                            course_module = page.locator(
                                "xpath=//div[contains(@class, 'app-icon') and contains(@title, '我的课表')]|//span[contains(text(), '我的课表')]|//div[contains(text(), '我的课表')]"
                            ).first
                            if course_module.count() > 0:
                                course_module.click()
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
                        current_step_text = (
                            "进入课表模块成功！\n正在切换至[学期课表]..."
                        )
                        update_browser_status(current_step_text)
                        try:
                            # 查找学期课表 tab 选项卡或者链接
                            semester_tab = page.locator(
                                "xpath=//a[contains(text(), '学期课表')]|//li[contains(text(), '学期课表')]|//div[contains(text(), '学期课表')]|//span[contains(text(), '学期课表')]"
                            ).first
                            if semester_tab.count() > 0:
                                semester_tab.click()
                                print("自动点击：[学期课表]")
                                auto_clicked_semester_course = True
                                time.sleep(1)
                        except:
                            pass

                    # 自动检测是否已经抓取到真实课表（通过页面源码是否包含特定元素作为证据）
                    if auto_clicked_my_course and auto_clicked_semester_course:
                        current_step_text = (
                            "正在检测课表数据加载情况...\n(请等待数据刷新)"
                        )
                        update_browser_status(current_step_text)

                        # 检查特定元素是否存在
                        has_timetable = (
                            page.locator("text=kbappTimetableDayColumn").count() > 0
                            or "kbappTimetableDayColumn" in page.content()
                        )

                        if has_timetable:
                            wait_data_timer += 1
                            current_step_text = f"检测到课表数据！(校验 {wait_data_timer}/5)\n等待渲染完成..."
                            update_browser_status(current_step_text)
                            # 等待 5 秒确保页面 ajax 渲染完成
                            if wait_data_timer >= 5:
                                print("自动检测到学期课表已加载完成！触发自动抓取...")
                                current_step_text = (
                                    "渲染完成！\n正在触发自动提取与打包..."
                                )
                                update_browser_status(current_step_text)

                                # --- 新增：触发实验课 Tooltips ---
                                print("正在尝试触发实验课详细信息的 Tooltip...")
                                update_browser_status("正在提取实验课详情...")
                                try:
                                    time.sleep(1)  # 额外等待，确保渲染
                                    titles = page.locator(
                                        ".title___3o2RH:has-text('[实]')"
                                    ).all()
                                    exp_count = 0
                                    print(
                                        f"找到 {len(titles)} 个实验课标题元素，准备抓取 Tooltip..."
                                    )

                                    for t_handle in titles:
                                        try:
                                            txt = t_handle.inner_text()
                                            if "[实]" in txt:
                                                exp_count += 1
                                                print(f"处理实验课: {txt}")

                                                t_handle.hover()
                                                time.sleep(0.5)

                                                # 等待 Tooltip 出现
                                                try:
                                                    # 关键：获取 tooltip 内容
                                                    tt_handle = page.wait_for_selector(
                                                        ".ant-tooltip:not(.ant-tooltip-hidden) .ant-tooltip-inner",
                                                        timeout=2000,
                                                    )
                                                    if tt_handle:
                                                        text_content = (
                                                            tt_handle.inner_text()
                                                        )

                                                        # 注入回 DOM - 修复语法
                                                        page.evaluate(
                                                            """(data) => {
                                                            let titles = document.querySelectorAll('.title___3o2RH');
                                                            for(let t of titles) {
                                                                if(t.innerText.trim() === data.title.trim()) {
                                                                    let wrapper = t.closest('.kbappTimetableCourseRenderCourseItem___MgPtp');
                                                                    // 检查是否已注入
                                                                    if(wrapper && !wrapper.querySelector('.scraper-injected-tooltip')) {
                                                                        let div = document.createElement('div');
                                                                        div.className = 'kbappTimetableCourseRenderCourseItemInfoText___2Zmwu scraper-injected-tooltip';
                                                                        div.style.display = 'none';
                                                                        div.innerText = data.content;
                                                                        wrapper.appendChild(div);
                                                                    }
                                                                    break;
                                                                }
                                                            }
                                                        }""",
                                                            {
                                                                "title": txt,
                                                                "content": text_content,
                                                            },
                                                        )

                                                    # 移开鼠标
                                                    page.mouse.move(0, 0)
                                                    time.sleep(0.2)

                                                except Exception:
                                                    print(
                                                        f"  -> 未能捕获 tooltip，跳过。"
                                                    )
                                                    continue

                                        except Exception as inner_e:
                                            print(f"  -> 处理课程元素出错: {inner_e}")
                                            continue

                                    print(
                                        f"实验课详情提取完成！共处理 {exp_count} 个。"
                                    )
                                except Exception as e:
                                    print(f"触发实验课 Tooltip 流程出错: {e}")
                                # ---------------------------------

                                time.sleep(1)
                                break
                except Exception as e:
                    # print(f"自动逻辑错误: {e}")
                    pass
                # ---------------------

                # 尝试注入并更新悬浮窗状态
                update_browser_status(current_step_text)

                # 检查信号
                try:
                    signal = page.evaluate("() => window.neuScraperSignal")
                    if signal:
                        print("检测到抓取信号，正在处理...")
                        current_step_text = "★ 收到手动指令，强制打包中..."
                        update_browser_status(current_step_text)
                        time.sleep(0.5)
                        break
                except:
                    pass

                time.sleep(1)

            print("正在获取页面源代码...")
            content = page.content()

            if "kbappTimetableDayColumn" in content or "课表" in page.title():
                with open("exp.html", "w", encoding="utf-8") as f:
                    f.write(content)
                print("\n【成功】课表已保存至 exp.html！")
            else:
                print("\n【注意】当前页面可能不是课表页，已强制保存源代码。")
                with open("exp.html", "w", encoding="utf-8") as f:
                    f.write(content)

            print("抓取完成，您可以关闭浏览器了。")
            # 这里的 browser.close() 由 with 语句自动处理，但我们可以手动关闭 page
            page.close()

        except Exception as e:
            print(f"\n执行出错: {e}")
            if not page.is_closed():
                page.pause()  # 调试用，也可以去掉


if __name__ == "__main__":
    try:
        run()
    except Exception as e:
        print(f"\n运行出错: {e}")
