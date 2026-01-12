@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
set "VENV_DIR=%SCRIPT_DIR%venv"

echo [Setup] Checking Python environment...

:: 检查 venv 是否存在
if not exist "%VENV_DIR%" (
    echo [Setup] Creating virtual environment in %VENV_DIR%...
    python -m venv "%VENV_DIR%"
    if %errorlevel% neq 0 (
        echo [Error] Failed to create venv. Please ensure Python is installed.
        pause
        exit /b 1
    )
    echo [Setup] Installing dependencies...
    :: 使用清华大学镜像源并增加超时时间，防止因网络问题导致的下载失败
    "%VENV_DIR%\Scripts\pip.exe" install -r "%SCRIPT_DIR%requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=100
)

echo [Setup] Starting application...
start "" "%SCRIPT_DIR%CourseTableApp.exe"
exit /b 0
