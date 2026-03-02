import os
import sys
import json
import subprocess
from pathlib import Path
import playwright

# Force utf-8 encoding for stdout
try:
    sys.stdout.reconfigure(encoding="utf-8")
except:
    pass


def main():
    try:
        # 1. Find Playwright package location and read browsers.json
        playwright_pkg_dir = Path(playwright.__file__).parent
        # The file is in playwright/driver/package/browsers.json
        browsers_json_path = playwright_pkg_dir / "driver" / "package" / "browsers.json"

        if not browsers_json_path.exists():
            print(f"Error: browsers.json not found at {browsers_json_path}")
            sys.exit(1)

        with open(browsers_json_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        # 2. Extract Chromium revision
        chromium_config = next(
            (b for b in config.get("browsers", []) if b["name"] == "chromium"), None
        )
        if not chromium_config:
            print("Error: Chromium configuration not found in browsers.json")
            sys.exit(1)

        revision = chromium_config["revision"]
        print(f"[Info] Required Chromium revision: {revision}")

        # 3. Locate the browser folder in local system
        # Usually in %LOCALAPPDATA%/ms-playwright
        local_app_data = os.environ.get("LOCALAPPDATA")
        if not local_app_data:
            print("Error: LOCALAPPDATA environment variable not found.")
            sys.exit(1)

        # The exact folder name logic from playwright
        browser_folder_name = f"chromium-{revision}"
        playwright_root = Path(local_app_data) / "ms-playwright"
        browser_path = playwright_root / browser_folder_name

        if not browser_path.exists():
            print(f"Error: Browser folder not found at {browser_path}")
            print(
                "Please run 'playwright install chromium' to download the required browser."
            )
            sys.exit(1)

        print(f"[Info] Found browser at: {browser_path}")

        # 4. Construct PyInstaller arguments
        # Destination inside the package: playwright-browsers/chromium-<revision>
        # Format: source_path;dest_path
        # We need to put the contents of browser_path into playwright-browsers/chromium-<revision>
        add_data_arg = f"{str(browser_path)};playwright-browsers/{browser_folder_name}"

        print(f"[Info] Adding data: {add_data_arg}")

        # 5. Run PyInstaller
        # Find pyinstaller executable in Scripts folder relative to python executable
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
            "NeuCourseTable",
            # Add the DLL if it exists
            "--add-binary",
            "build/bin/libNeuCourseTabel.dll;.",
            # Add the browser
            "--add-data",
            add_data_arg,
            "src/main_gui.py",
        ]

        print(f"[Info] Executing: {' '.join(cmd)}")
        subprocess.check_call(cmd)

        print("\n[Success] Build completed successfully.")

    except Exception as e:
        print(f"[Error] Build failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
