/**
 * @file CourseTableGUI.cpp
 * @author PopulusYang
 * @brief Windows Native GUI for NEU Course Table Tool
 * @license MIT
 * @date 2026-01-12
 */

#ifndef UNICODE
#define UNICODE
#endif

#include <iostream>
#include <string>
#include <windows.h>

// 定义控件ID
#define ID_BTN_SCRAPE 101
#define ID_BTN_GENERATE 102
#define ID_EDIT_DATE 103

LRESULT CALLBACK WindowProc (HWND hwnd, UINT uMsg, WPARAM wParam,
                             LPARAM lParam);

// 状态文本
HWND hStatus;
HWND hDateInput;

int WINAPI
wWinMain (HINSTANCE hInstance, HINSTANCE hPrevInstance, PWSTR pCmdLine,
          int nCmdShow)
{
  const wchar_t CLASS_NAME[] = L"NEU Course Table GUI"; // 窗口类名

  WNDCLASS wc = {};                              // 初始化窗口类
  wc.lpfnWndProc = WindowProc;                   // 设置回调函数
  wc.hInstance = hInstance;                      // 设置实例句柄
  wc.lpszClassName = CLASS_NAME;                 // 应用类名
  wc.hCursor = LoadCursor (NULL, IDC_ARROW);     // 设置光标
  wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1); // 设置背景颜色

  RegisterClass (&wc); // 注册窗口类

  HWND hwnd = CreateWindowEx (
      0, CLASS_NAME, L"东大课表导出工具", // 窗口标题
      WS_OVERLAPPEDWINDOW & ~WS_THICKFRAME & ~WS_MAXIMIZEBOX,
      CW_USEDEFAULT, // 固定窗口大小样式
      CW_USEDEFAULT, 400, 300, NULL, NULL, hInstance, NULL); // 创建主窗口

  if (hwnd == NULL)
    return 0; // 创建失败则退出

  ShowWindow (hwnd, nCmdShow); // 显示窗口

  MSG msg = {};                         // 消息结构体
  while (GetMessage (&msg, NULL, 0, 0)) // 开启消息循环
    {
      TranslateMessage (&msg); // 转换消息格式
      DispatchMessage (&msg);  // 分发消息到回调函数
    }

  return 0; // 程序正常退出
}

LRESULT CALLBACK
WindowProc (HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
  switch (uMsg)
    {
    case WM_CREATE: // 窗口初始化
      {
        // 说明文字
        CreateWindow (L"STATIC", L"第一步：点击按钮并在浏览器中登录抓取数据",
                      WS_VISIBLE | WS_CHILD, 20, 20, 350, 20, hwnd, NULL, NULL,
                      NULL); // 静态文本提示

        CreateWindow (L"BUTTON", L"登录并抓取页面",
                      WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON, 20, 50, 150, 40,
                      hwnd, (HMENU)ID_BTN_SCRAPE, NULL, NULL); // 抓取按钮

        // 日期输入
        CreateWindow (L"STATIC",
                      L"第二步：输入开学第一周周日的日期 (YYYY-MM-DD)",
                      WS_VISIBLE | WS_CHILD, 20, 110, 350, 20, hwnd, NULL,
                      NULL, NULL); // 第二步提示

        hDateInput = CreateWindow (
            L"EDIT", L"2026-03-01", WS_VISIBLE | WS_CHILD | WS_BORDER, 20, 140,
            150, 25, hwnd, (HMENU)ID_EDIT_DATE, NULL, NULL); // 编辑框输入

        CreateWindow (L"BUTTON", L"生成日历文件 (.ics)",
                      WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON, 20, 180, 150, 40,
                      hwnd, (HMENU)ID_BTN_GENERATE, NULL, NULL); // 生成按钮

        // 状态栏
        hStatus = CreateWindow (L"STATIC", L"等待操作...",
                                WS_VISIBLE | WS_CHILD, 20, 230, 350, 20, hwnd,
                                NULL, NULL, NULL); // 底部状态栏
        break;
      }
    case WM_COMMAND: // 按钮点击处理
      {
        if (LOWORD (wParam) == ID_BTN_SCRAPE) // 抓取按钮逻辑
          {
            SetWindowText (hStatus, L"正在启动浏览器...");

            // 获取当前程序所在目录
            wchar_t path[MAX_PATH];
            GetModuleFileName (NULL, path, MAX_PATH); // 获取自身路径
            std::wstring fullPath (path);
            size_t pos_path = fullPath.find_last_of (L"\\/"); // 寻找路径分隔符
            std::wstring dir
                = fullPath.substr (0, pos_path + 1); // 提取目录部分

            std::wstring scraperExe
                = dir + L"neuscraper_ui.exe"; // 打包后的爬虫路径
            std::wstring scraperPy = dir + L"neuscraper_ui.py"; // 原始脚本路径
            std::wstring pythonExe
                = dir + L"venv\\Scripts\\python.exe"; // venv 路径

            DWORD dwAttribExe
                = GetFileAttributes (scraperExe.c_str ()); // 检查 exe 是否存在
            if (dwAttribExe != INVALID_FILE_ATTRIBUTES
                && !(dwAttribExe & FILE_ATTRIBUTE_DIRECTORY))
              {
                ShellExecute (NULL, L"open", scraperExe.c_str (), NULL, NULL,
                              SW_SHOW); // 运行 exe
                SetWindowText (hStatus,
                               L"已启动 (独立运行模式)。请在浏览器中操作。");
              }
            else
              {
                DWORD dwAttribVenv = GetFileAttributes (
                    pythonExe.c_str ()); // 检查 venv 是否有效
                bool useVenv = (dwAttribVenv != INVALID_FILE_ATTRIBUTES
                                && !(dwAttribVenv & FILE_ATTRIBUTE_DIRECTORY));

                const wchar_t *execPath
                    = useVenv ? pythonExe.c_str ()
                              : L"python.exe"; // 择优使用 Python 解释器

                ShellExecute (NULL, L"open", execPath, scraperPy.c_str (),
                              NULL, SW_SHOW); // 调用 python 运行脚本

                if (useVenv)
                  SetWindowText (
                      hStatus, L"已启动 (使用 venv 环境)。请在浏览器中操作。");
                else
                  SetWindowText (hStatus,
                                 L"已启动 (使用系统环境)。请在浏览器中操作。");
              }
          }
        else if (LOWORD (wParam) == ID_BTN_GENERATE) // 生成按钮逻辑
          {
            wchar_t date[20];
            GetWindowText (hDateInput, date, 20); // 获取输入框中的日期字符串

            SetWindowText (hStatus, L"正在解析并生成日历...");

            wchar_t path[MAX_PATH];
            GetModuleFileName (NULL, path, MAX_PATH);
            std::wstring fullPath (path);
            size_t pos_path = fullPath.find_last_of (L"\\/");
            std::wstring dir = fullPath.substr (0, pos_path + 1);

            std::wstring cmd = L"\"" + dir + L"NeuCourseTabel.exe\" "
                               + date; // 拼接后端命令

            STARTUPINFO si = { sizeof (si) }; // 启动信息
            PROCESS_INFORMATION pi;           // 进程信息
            if (CreateProcess (NULL, (LPWSTR)cmd.c_str (), NULL, NULL, FALSE,
                               CREATE_NO_WINDOW, NULL, NULL, &si,
                               &pi)) // 后台运行解析进程
              {
                WaitForSingleObject (pi.hProcess, INFINITE); // 等待进程结束
                CloseHandle (pi.hProcess);                   // 关闭进程句柄
                CloseHandle (pi.hThread);                    // 关闭线程句柄
                SetWindowText (hStatus, L"成功！生成了 schedule.ics");
                MessageBox (
                    hwnd, L"日历文件生成成功！你可以将其导入 Google 日历了。",
                    L"完成", MB_OK | MB_ICONINFORMATION); // 提示完成
              }
            else
              {
                SetWindowText (hStatus, L"错误：无法运行 NeuCourseTabel.exe");
              }
          }
        break;
      }
    case WM_DESTROY:       // 窗口销毁
      PostQuitMessage (0); // 发送退出消息
      return 0;
    }
  return DefWindowProc (hwnd, uMsg, wParam, lParam); // 默认消息处理
}
