@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "RELEASE_DIR=%SCRIPT_DIR%release"

echo ======================================================
echo [Release] 开始生成发布产物...
echo ======================================================
echo.

if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"

:: 1) 构建含 Chromium 版本
echo [Step 1/6] 构建 WithChromium 版本...
call "%SCRIPT_DIR%build_single_exe.bat"
if %errorlevel% neq 0 (
    echo [Error] build_single_exe.bat 执行失败。
    exit /b %errorlevel%
)

:: 2) 构建无 Chromium 版本
echo [Step 2/6] 构建 NoChromium 版本...
call "%SCRIPT_DIR%build_single_exe_no_browser.bat"
if %errorlevel% neq 0 (
    echo [Error] build_single_exe_no_browser.bat 执行失败。
    exit /b %errorlevel%
)

:: 3) 拷贝并按要求重命名 Windows 产物
echo [Step 3/6] 复制并重命名 Windows 产物...
if not exist "%SCRIPT_DIR%dist\NeuCourseTable.exe" (
    echo [Error] 未找到 WithChromium 产物: dist\NeuCourseTable.exe
    exit /b 1
)
if not exist "%SCRIPT_DIR%dist\NeuCourseTable_NoChromium.exe" (
    echo [Error] 未找到 NoChromium 产物: dist\NeuCourseTable_NoChromium.exe
    exit /b 1
)

copy /Y "%SCRIPT_DIR%dist\NeuCourseTable.exe" "%RELEASE_DIR%\NeuCourseTable_WithChromium_Windows_x86_64.exe" >nul
if %errorlevel% neq 0 (
    echo [Error] 复制 WithChromium 产物失败。
    exit /b %errorlevel%
)

copy /Y "%SCRIPT_DIR%dist\NeuCourseTable_NoChromium.exe" "%RELEASE_DIR%\NeuCourseTable_NoChromium_Windows_x86_64.exe" >nul
if %errorlevel% neq 0 (
    echo [Error] 复制 NoChromium 产物失败。
    exit /b %errorlevel%
)

:: 4) 生成 Linux 源码压缩包
echo [Step 4/6] 生成 Linux tar.gz 压缩包...
set "LINUX_PKG=%RELEASE_DIR%\NeuCourseTable_WithChromium_Linux_x86_64.tar.gz"
if exist "%LINUX_PKG%" del /f /q "%LINUX_PKG%"

where tar >nul 2>&1
if %errorlevel% neq 0 (
    echo [Error] 当前系统未找到 tar 命令，无法生成 tar.gz。
    echo         请安装 Windows 自带 tar 或 Git for Windows 后重试。
    exit /b 1
)

pushd "%SCRIPT_DIR%" >nul
tar -czf "%LINUX_PKG%" src resources CMakeLists.txt LICENSE package_with_browser.py package_without_browser.py README.md requirements.txt RunApp.sh
if %errorlevel% neq 0 (
    popd >nul
    echo [Error] 生成 tar.gz 失败。
    exit /b %errorlevel%
)
popd >nul

:: 5) 计算 SHA256 并生成 Markdown
echo [Step 5/6] 计算 SHA256 并生成 Markdown...
set "FILE_A=%RELEASE_DIR%\NeuCourseTable_NoChromium_Windows_x86_64.exe"
set "FILE_B=%RELEASE_DIR%\NeuCourseTable_WithChromium_Linux_x86_64.tar.gz"
set "FILE_C=%RELEASE_DIR%\NeuCourseTable_WithChromium_Windows_x86_64.exe"

set "MD_FILE=%RELEASE_DIR%\SHA256.md"
set "SHA_A="
set "SHA_B="
set "SHA_C="

for /f "skip=1 tokens=* delims=" %%H in ('certutil -hashfile "%FILE_A%" SHA256') do if not defined SHA_A set "SHA_A=%%H"
for /f "skip=1 tokens=* delims=" %%H in ('certutil -hashfile "%FILE_B%" SHA256') do if not defined SHA_B set "SHA_B=%%H"
for /f "skip=1 tokens=* delims=" %%H in ('certutil -hashfile "%FILE_C%" SHA256') do if not defined SHA_C set "SHA_C=%%H"

set "SHA_A=!SHA_A: =!"
set "SHA_B=!SHA_B: =!"
set "SHA_C=!SHA_C: =!"

if "!SHA_A!"=="" (
    echo [Error] 计算 NeuCourseTable_NoChromium_Windows_x86_64.exe 的 SHA256 失败。
    exit /b 1
)
if "!SHA_B!"=="" (
    echo [Error] 计算 NeuCourseTable_WithChromium_Linux_x86_64.tar.gz 的 SHA256 失败。
    exit /b 1
)
if "!SHA_C!"=="" (
    echo [Error] 计算 NeuCourseTable_WithChromium_Windows_x86_64.exe 的 SHA256 失败。
    exit /b 1
)

(
    echo 对于没有安装Chrome,Edge,Firefox的电脑，请下载withChromium的版本。
    echo.
    echo ## SHA256校验
    echo.
    echo 文件名^|校验值
    echo ---^|---
    echo NeuCourseTable_NoChromium_Windows_x86_64.exe^|!SHA_A!
    echo NeuCourseTable_WithChromium_Linux_x86_64.tar.gz^|!SHA_B!
    echo NeuCourseTable_WithChromium_Windows_x86_64.exe^|!SHA_C!
    echo.
    echo linux版本需要cmake和python环境
) > "%MD_FILE%"

:: 6) 输出结果
echo [Step 6/6] 发布产物生成完成。
echo.
echo ======================================================
echo [Success] 产物已放入: %RELEASE_DIR%
echo  - NeuCourseTable_WithChromium_Windows_x86_64.exe
echo  - NeuCourseTable_NoChromium_Windows_x86_64.exe
echo  - NeuCourseTable_WithChromium_Linux_x86_64.tar.gz
echo  - SHA256.md
echo ======================================================

exit /b 0
