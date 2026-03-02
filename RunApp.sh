#!/bin/bash

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR" || exit 1

echo "======================================================"
echo " [Setup] 准备环境并启动 NeuCourseTable..."
echo "======================================================"
echo ""

# 1. 检查 Python3 是否安装
if ! command -v python3 &> /dev/null; then
    echo "[Error] 未检测到 Python 3。请先安装 python3。"
    echo "  Ubuntu/Debian: sudo apt install python3 python3-venv python3-pip"
    echo "  macOS: brew install python3"
    exit 1
fi

# 2. 检查并创建 Python 虚拟环境
if [ ! -d "venv" ]; then
    echo "[Info] 首次运行，正在创建 Python 虚拟环境 (venv)..."
    python3 -m venv venv
    if [ $? -ne 0 ]; then
        echo "[Error] 创建虚拟环境失败。请确保安装了 python3-venv 包。"
        exit 1
    fi
fi

# 3. 激活虚拟环境并安装依赖
echo "[Info] 正在检查/更新依赖包..."
source venv/bin/activate
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=100
echo "[Info] 正在检查/安装 Playwright 浏览器..."
playwright install chromium

# 4. 检查是否需要编译 C++ 核心库 (libNeuCourseTabel.so / .dylib)
OS_NAME=$(uname -s)
if [ "$OS_NAME" = "Darwin" ]; then
    LIB_NAME="libNeuCourseTabel.dylib"
else
    LIB_NAME="libNeuCourseTabel.so"
fi

if [ ! -f "build/bin/$LIB_NAME" ] && [ ! -f "build/$LIB_NAME" ]; then
    echo ""
    echo "[Info] 未检测到已编译的核心动态库 ($LIB_NAME)，正在尝试进行编译..."
    
    # 检查 CMake
    if ! command -v cmake &> /dev/null; then
        echo "[Error] 未检测到 CMake。核心库需要 CMake 才能编译！"
        echo "  Ubuntu/Debian: sudo apt install cmake build-essential"
        echo "  macOS: brew install cmake"
        exit 1
    fi
    
    mkdir -p build
    cd build || exit 1
    cmake .. -DCMAKE_BUILD_TYPE=Release
    cmake --build . --config Release
    cd ..
    echo "[Info] C++ 核心库编译完成！"
fi

echo ""
echo "======================================================"
echo " [Success] 启动 NeuCourseTable ! 祝您使用顺利~"
echo "======================================================"
echo ""

# 5. 启动 Python GUI
python3 src/main_gui.py
