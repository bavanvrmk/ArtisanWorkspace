"""
Start Artisan Workspace: FastAPI backend + Vite frontend.

Usage (from repo root):
    python dev.py
"""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
API_PORT = 8000
WEB_PORT = 5173


def venv_python() -> str:
    if sys.platform == "win32":
        candidate = ROOT / "venv" / "Scripts" / "python.exe"
    else:
        candidate = ROOT / "venv" / "bin" / "python"
    return str(candidate) if candidate.exists() else sys.executable


def run_setup(py: str) -> None:
    if not (BACKEND / "artisan.db").exists():
        print("[dev] Initializing database...")
        subprocess.check_call([py, "-m", "db.init_db"], cwd=BACKEND)

    node_modules = FRONTEND / "node_modules"
    if not node_modules.exists():
        print("[dev] Installing frontend dependencies...")
        npm = ["cmd", "/c", "npm", "install"] if sys.platform == "win32" else ["npm", "install"]
        subprocess.check_call(npm, cwd=FRONTEND)


def spawn(cmd: list[str], cwd: Path, name: str) -> subprocess.Popen:
    kwargs: dict = {
        "cwd": str(cwd),
        "env": {**os.environ, "PYTHONUNBUFFERED": "1"},
    }
    if sys.platform == "win32":
        kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        if cmd[0] in {"npm", "npx"}:
            cmd = ["cmd", "/c", *cmd]
    print(f"[dev] Starting {name}: {' '.join(cmd)}")
    return subprocess.Popen(cmd, **kwargs)


def stop(proc: subprocess.Popen | None) -> None:
    if proc is None or proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            proc.send_signal(signal.CTRL_BREAK_EVENT)
            time.sleep(0.4)
        proc.terminate()
        proc.wait(timeout=8)
    except Exception:
        proc.kill()


def main() -> int:
    py = venv_python()
    run_setup(py)

    backend = spawn(
        [py, "-m", "uvicorn", "main:app", "--reload", "--port", str(API_PORT)],
        BACKEND,
        "API",
    )
    frontend = spawn(
        ["npm", "run", "dev"],
        FRONTEND,
        "frontend",
    )

    print()
    print(f"  API       http://localhost:{API_PORT}")
    print(f"  Docs      http://localhost:{API_PORT}/docs")
    print(f"  Frontend  http://localhost:{WEB_PORT}")
    print("  Press Ctrl+C to stop both.")
    print()

    procs = [backend, frontend]
    try:
        while True:
            for proc in procs:
                code = proc.poll()
                if code is not None:
                    print(f"[dev] A process exited with code {code}. Stopping the rest.")
                    for other in procs:
                        stop(other)
                    return code or 1
            time.sleep(0.4)
    except KeyboardInterrupt:
        print("\n[dev] Shutting down...")
        for proc in procs:
            stop(proc)
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
