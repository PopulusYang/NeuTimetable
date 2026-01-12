#!/bin/bash
# 检查 Python 环境
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VENV_DIR="$SCRIPT_DIR/venv"

echo "[Setup] Checking Python environment..."

if [ ! -d "$VENV_DIR" ]; then
    echo "[Setup] Creating virtual environment in $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "[Error] Failed to create venv. Please ensure Python3 is installed."
        exit 1
    fi
    echo "[Setup] Installing dependencies..."
    "$VENV_DIR/bin/pip" install -r "$SCRIPT_DIR/requirements.txt" -i https://pypi.tuna.tsinghua.edu.cn/simple
fi

# 检查 C++ 二进制是否存在
if [ ! -f "$SCRIPT_DIR/build/bin/NeuCourseTabel" ]; then
    echo "[Build] NeuCourseTabel not found. Attempting to build..."
    mkdir -p "$SCRIPT_DIR/build"
    cd "$SCRIPT_DIR/build"
    cmake ..
    make
    cd "$SCRIPT_DIR"
fi

echo "[Run] Starting GUI..."
"$VENV_DIR/bin/python3" "$SCRIPT_DIR/src/main_gui.py"
