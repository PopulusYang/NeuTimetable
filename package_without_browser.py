import sys
import subprocess
from pathlib import Path

# Force utf-8 encoding for stdout
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def main():
    try:
        # Run PyInstaller without bundling Playwright browser binaries.
        scripts_dir = Path(sys.executable).parent / "Scripts"
        pyinstaller_exe = scripts_dir / "pyinstaller.exe"

        if pyinstaller_exe.exists():
            cmd_prefix = [str(pyinstaller_exe)]
        else:
            cmd_prefix = [sys.executable, "-m", "PyInstaller"]

        cmd = cmd_prefix + [
            "--onefile",
            "--noconsole",
            "--clean",
            "--name",
            "NeuCourseTable_NoChromium",
            "--add-binary",
            "build/bin/libNeuCourseTabel.dll;.",
            "src/main_gui.py",
        ]

        print(f"[Info] Executing: {' '.join(cmd)}")
        subprocess.check_call(cmd)
        print("\n[Success] Build completed successfully (no bundled Chromium).")

    except Exception as e:
        print(f"[Error] Build failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
