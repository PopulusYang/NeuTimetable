@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "BIN_DIR=%SCRIPT_DIR%build\bin"

echo [Build] Starting distribution build...

:: 1. 确保在 venv 中安装了 pyinstaller
if not exist "%SCRIPT_DIR%venv" (
    echo [Build] Creating temporary venv for bundling...
    python -m venv venv
)

echo [Build] Installing dependencies and PyInstaller...
:: 使用清华大学镜像源并增加超时时间，防止因网络问题导致的下载失败
venv\Scripts\pip.exe install -r requirements.txt pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=100

:: 2. 使用 PyInstaller 打包 Python 脚本
echo [Build] Bundling neuscraper_ui.py into EXE...
venv\Scripts\pyinstaller.exe --onefile --noconsole --name neuscraper_ui "%SCRIPT_DIR%src\neuscraper_ui.py"

echo [Build] Bundling web_server.py into EXE...
venv\Scripts\pyinstaller.exe --onefile --name web_server "%SCRIPT_DIR%src\web_server.py"

:: 3. 编译 C++ 程序 (如果尚未编译)
if not exist "build" (
    mkdir build
    cd build
    cmake .. -G "MinGW Makefiles"
    cmake --build .
    cd ..
) else (
    cd build
    cmake --build .
    cd ..
)

:: 4. 整理发布文件夹
echo [Build] Organizing final distribution...
if exist "dist_final" rd /s /q "dist_final"
mkdir "dist_final"

copy "build\bin\CourseTableApp.exe" "dist_final\"
copy "build\bin\NeuCourseTabel.exe" "dist_final\"
copy "dist\neuscraper_ui.exe" "dist_final\"
copy "dist\web_server.exe" "dist_final\"
copy "requirements.txt" "dist_final\"
copy "RunApp.bat" "dist_final\"
copy "README.md" "dist_final\"

:: 复制静态资源文件夹
echo [Build] Copying static assets...
xcopy "resources\static" "dist_final\eams\static\" /E /I /Y

echo.
echo ======================================================
echo [Success] 编译完成！
echo 发布包已准备在: dist_final 目录下
echo 该目录下的程序可以在没有 Python 环境的电脑上直接运行。
echo ======================================================
pause
