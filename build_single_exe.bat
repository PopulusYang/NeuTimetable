@echo off
chcp 65001 >nul
setlocal
set "SCRIPT_DIR=%~dp0"
set "BUILD_DIR=%SCRIPT_DIR%build"

echo ======================================================
echo [Build] 开始构建东大课表集成单文件版...
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

:: 3. 最终整体封装为纯单文件 exe
echo.
echo [PyInstaller] 正在将所有代码彻底融合打包为单一 EXE...

:: 执行单文件打包命令，利用 --add-binary 将上一步编译出来的 DLL 和自身绑定
venv\Scripts\pyinstaller.exe ^
    --onefile ^
    --noconsole ^
    --clean ^
    --name "NeuCourseTable" ^
    --add-binary "build\bin\libNeuCourseTabel.dll;." ^
    src\main_gui.py

if %errorlevel% neq 0 (
    echo [Error] PyInstaller 整体打包失败！
    pause
    exit /b %errorlevel%
)

:: 4. 汇总
echo.
echo ======================================================
echo [Success] 全部打包完成！
echo.
echo [路径]: %SCRIPT_DIR%dist\NeuCourseTable.exe
echo [说明]: 这是一个真正的纯净单文件。双击即可运行，
echo        无需其它任何环境和多余文件即可跨电脑使用。
echo ======================================================
pause
