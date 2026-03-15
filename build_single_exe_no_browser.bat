@echo off
chcp 65001 >nul
setlocal
set "SCRIPT_DIR=%~dp0"
set "BUILD_DIR=%SCRIPT_DIR%build"

echo ======================================================
echo [Build] 开始构建无 Chromium 轻量版...
echo ======================================================
echo.

:: 1. 检查虚拟环境和依赖
if not exist "%SCRIPT_DIR%venv" (
    echo [Setup] 正在创建 Python 虚拟环境...
    python -m venv venv
)

echo [Setup] 安装/更新相关依赖包...
venv\Scripts\pip.exe install -r requirements.txt pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=100

:: 2. 编译 C++ 以生成扩展 DLL
echo.
echo [CMake] 正在编译底层 C++ 动态链接库...
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
cd "%BUILD_DIR%"
cmake .. -G "MinGW Makefiles" -DCMAKE_BUILD_TYPE=Release
if %errorlevel% neq 0 (
    echo [Error] CMake 配置失败！
    pause
    exit /b %errorlevel%
)

cmake --build .
if %errorlevel% neq 0 (
    echo [Error] C++ 代码编译失败！请检查 MinGW 工具链。
    pause
    exit /b %errorlevel%
)
cd "%SCRIPT_DIR%"

:: 3. 打包无浏览器内核版本
echo.
echo [PyInstaller] 正在打包无 Chromium 版本 (体积更小)...
venv\Scripts\python.exe package_without_browser.py

if %errorlevel% neq 0 (
    echo [Error] PyInstaller 打包失败！
    pause
    exit /b %errorlevel%
)

:: 4. 汇总
echo.
echo ======================================================
echo [Success] 无 Chromium 版本打包完成！
echo.
echo [路径]: %SCRIPT_DIR%dist\NeuCourseTable_NoChromium.exe
echo [说明]: 该版本不内置浏览器，请确保目标机器有 Edge/Chrome。
echo ======================================================
pause
