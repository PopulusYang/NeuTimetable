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
  const wchar_t CLASS_NAME[] = L"NEU Course Table GUI";

  WNDCLASS wc = {};
  wc.lpfnWndProc = WindowProc;
  wc.hInstance = hInstance;
  wc.lpszClassName = CLASS_NAME;
  wc.hCursor = LoadCursor (NULL, IDC_ARROW);
  wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);

  RegisterClass (&wc);

  HWND hwnd = CreateWindowEx (
      0, CLASS_NAME, L"东大课表导出工具",
      WS_OVERLAPPEDWINDOW & ~WS_THICKFRAME & ~WS_MAXIMIZEBOX, CW_USEDEFAULT,
      CW_USEDEFAULT, 400, 300, NULL, NULL, hInstance, NULL);

  if (hwnd == NULL)
    return 0;

  ShowWindow (hwnd, nCmdShow);

  MSG msg = {};
  while (GetMessage (&msg, NULL, 0, 0))
    {
      TranslateMessage (&msg);
      DispatchMessage (&msg);
    }

  return 0;
}

LRESULT CALLBACK
WindowProc (HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
  switch (uMsg)
    {
    case WM_CREATE:
      {
        // 说明文字
        CreateWindow (L"STATIC", L"第一步：点击按钮并在浏览器中登录抓取数据",
                      WS_VISIBLE | WS_CHILD, 20, 20, 350, 20, hwnd, NULL, NULL,
                      NULL);

        CreateWindow (L"BUTTON", L"登录并抓取页面",
                      WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON, 20, 50, 150, 40,
                      hwnd, (HMENU)ID_BTN_SCRAPE, NULL, NULL);

        // 日期输入
        CreateWindow (
            L"STATIC", L"第二步：输入开学第一周周日的日期 (YYYY-MM-DD)",
            WS_VISIBLE | WS_CHILD, 20, 110, 350, 20, hwnd, NULL, NULL, NULL);

        hDateInput = CreateWindow (
            L"EDIT", L"2026-03-01", WS_VISIBLE | WS_CHILD | WS_BORDER, 20, 140,
            150, 25, hwnd, (HMENU)ID_EDIT_DATE, NULL, NULL);

        CreateWindow (L"BUTTON", L"生成日历文件 (.ics)",
                      WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON, 20, 180, 150, 40,
                      hwnd, (HMENU)ID_BTN_GENERATE, NULL, NULL);

        // 状态栏
        hStatus
            = CreateWindow (L"STATIC", L"等待操作...", WS_VISIBLE | WS_CHILD,
                            20, 230, 350, 20, hwnd, NULL, NULL, NULL);
        break;
      }
    case WM_COMMAND:
      {
        if (LOWORD (wParam) == ID_BTN_SCRAPE)
          {
            SetWindowText (hStatus, L"正在启动浏览器...");

            // 获取当前程序所在目录
            wchar_t path[MAX_PATH];
            GetModuleFileName (NULL, path, MAX_PATH);
            std::wstring fullPath (path);
            size_t pos_path = fullPath.find_last_of (L"\\/");
            std::wstring dir = fullPath.substr (0, pos_path + 1);

            std::wstring scraperExe = dir + L"neuscraper_ui.exe";
            std::wstring scraperPy = dir + L"neuscraper_ui.py";
            std::wstring pythonExe = dir + L"venv\\Scripts\\python.exe";

            // 1. 优先尝试运行已打包的 exe (完全脱离 Python)
            DWORD dwAttribExe = GetFileAttributes (scraperExe.c_str ());
            if (dwAttribExe != INVALID_FILE_ATTRIBUTES
                && !(dwAttribExe & FILE_ATTRIBUTE_DIRECTORY))
              {
                ShellExecute (NULL, L"open", scraperExe.c_str (), NULL, NULL,
                              SW_SHOW);
                SetWindowText (hStatus,
                               L"已启动 (独立运行模式)。请在浏览器中操作。");
              }
            // 2. 其次尝试 venv 环境中的 python
            else
              {
                DWORD dwAttribVenv = GetFileAttributes (pythonExe.c_str ());
                bool useVenv = (dwAttribVenv != INVALID_FILE_ATTRIBUTES
                                && !(dwAttribVenv & FILE_ATTRIBUTE_DIRECTORY));

                const wchar_t *execPath
                    = useVenv ? pythonExe.c_str () : L"python.exe";

                ShellExecute (NULL, L"open", execPath, scraperPy.c_str (),
                              NULL, SW_SHOW);

                if (useVenv)
                  SetWindowText (
                      hStatus, L"已启动 (使用 venv 环境)。请在浏览器中操作。");
                else
                  SetWindowText (hStatus,
                                 L"已启动 (使用系统环境)。请在浏览器中操作。");
              }
          }
        else if (LOWORD (wParam) == ID_BTN_GENERATE)
          {
            wchar_t date[20];
            GetWindowText (hDateInput, date, 20);

            SetWindowText (hStatus, L"正在解析并生成日历...");

            // 获取当前程序所在目录
            wchar_t path[MAX_PATH];
            GetModuleFileName (NULL, path, MAX_PATH);
            std::wstring fullPath (path);
            size_t pos_path = fullPath.find_last_of (L"\\/");
            std::wstring dir = fullPath.substr (0, pos_path + 1);

            // 构造完整命令行参数 (使用绝对路径并添加引号)
            std::wstring cmd = L"\"" + dir + L"NeuCourseTabel.exe\" " + date;

            // 运行可执行文件
            STARTUPINFO si = { sizeof (si) };
            PROCESS_INFORMATION pi;
            if (CreateProcess (NULL, (LPWSTR)cmd.c_str (), NULL, NULL, FALSE,
                               CREATE_NO_WINDOW, NULL, NULL, &si, &pi))
              {
                WaitForSingleObject (pi.hProcess, INFINITE);
                CloseHandle (pi.hProcess);
                CloseHandle (pi.hThread);
                SetWindowText (hStatus, L"成功！生成了 schedule.ics");
                MessageBox (
                    hwnd, L"日历文件生成成功！你可以将其导入 Google 日历了。",
                    L"完成", MB_OK | MB_ICONINFORMATION);
              }
            else
              {
                SetWindowText (hStatus, L"错误：无法运行 NeuCourseTabel.exe");
              }
          }
        break;
      }
    case WM_DESTROY:
      PostQuitMessage (0);
      return 0;
    }
  return DefWindowProc (hwnd, uMsg, wParam, lParam);
}
