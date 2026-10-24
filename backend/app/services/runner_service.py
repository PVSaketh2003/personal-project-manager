import asyncio
import logging
import os
import re
import signal
import socket
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from app.core.config import settings

logger = logging.getLogger(__name__)

# Active background runners: project_id -> metadata
RUNNING_PROCESSES: Dict[str, Dict[str, Any]] = {}


def find_free_port(start_port: int = 8001, max_tries: int = 50) -> int:
    for port in range(start_port, start_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return start_port


class RunnerService:
    @staticmethod
    def get_project_dir(project_name: str) -> str:
        safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', project_name).strip('_') or "project"
        base_dir = os.path.abspath(settings.LOCAL_PROJECTS_DIR)
        os.makedirs(base_dir, exist_ok=True)
        return os.path.join(base_dir, safe_name)

    @classmethod
    async def run_command_logged(
        cls, cmd: list, cwd: str, log_file_path: str, append: bool = True
    ) -> Tuple[int, str]:
        mode = "a" if append else "w"
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        with open(log_file_path, mode, encoding="utf-8") as f:
            f.write(f"\n[{timestamp}] $ {' '.join(cmd)}\n")

        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        output_lines = []
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            decoded = line.decode("utf-8", errors="replace")
            output_lines.append(decoded)
            with open(log_file_path, "a", encoding="utf-8") as f:
                f.write(decoded)

        returncode = await process.wait()
        return returncode, "".join(output_lines)

    @classmethod
    async def launch_project(
        cls, project_id: str, project_name: str, repo_url: str
    ) -> Dict[str, Any]:
        if not repo_url:
            return {"status": "failed", "error": "No repository URL provided"}

        target_dir = cls.get_project_dir(project_name)
        log_path = os.path.join(target_dir, "runner.log")
        os.makedirs(target_dir, exist_ok=True)

        with open(log_path, "w", encoding="utf-8") as f:
            f.write(f"=== Local Runner Session for {project_name} ===\n")

        RUNNING_PROCESSES[project_id] = {
            "status": "starting",
            "target_dir": target_dir,
            "log_path": log_path,
            "backend_proc": None,
            "frontend_proc": None,
            "backend_port": None,
            "frontend_port": None,
            "started_at": datetime.now(timezone.utc).isoformat(),
        }

        # Run setup and launch in background task
        asyncio.create_task(cls._execute_launch(project_id, project_name, repo_url, target_dir, log_path))

        return {
            "status": "started",
            "target_dir": target_dir,
            "log_path": log_path,
            "message": f"Cloning and environment setup started in {target_dir}",
        }

    @classmethod
    async def _execute_launch(
        cls, project_id: str, project_name: str, repo_url: str, target_dir: str, log_path: str
    ):
        try:
            # 1. Clone or Pull
            RUNNING_PROCESSES[project_id]["status"] = "cloning"
            if not os.path.exists(os.path.join(target_dir, ".git")):
                code, _ = await cls.run_command_logged(
                    ["git", "clone", repo_url, "."], cwd=target_dir, log_file_path=log_path
                )
                if code != 0:
                    RUNNING_PROCESSES[project_id]["status"] = "failed"
                    RUNNING_PROCESSES[project_id]["error"] = "Git clone failed"
                    return
            else:
                await cls.run_command_logged(
                    ["git", "pull"], cwd=target_dir, log_file_path=log_path
                )

            # 2. Inspect directories
            items = os.listdir(target_dir)
            backend_dir = target_dir
            if "backend" in items and os.path.isdir(os.path.join(target_dir, "backend")):
                backend_dir = os.path.join(target_dir, "backend")
            elif "server" in items and os.path.isdir(os.path.join(target_dir, "server")):
                backend_dir = os.path.join(target_dir, "server")

            frontend_dir = target_dir
            if "frontend" in items and os.path.isdir(os.path.join(target_dir, "frontend")):
                frontend_dir = os.path.join(target_dir, "frontend")
            elif "client" in items and os.path.isdir(os.path.join(target_dir, "client")):
                frontend_dir = os.path.join(target_dir, "client")

            # 3. Setup Python Backend if requirements.txt exists
            has_py = os.path.exists(os.path.join(backend_dir, "requirements.txt")) or os.path.exists(os.path.join(backend_dir, "pyproject.toml"))
            backend_port = None
            if has_py:
                RUNNING_PROCESSES[project_id]["status"] = "installing_backend"
                venv_dir = os.path.join(backend_dir, ".venv")
                venv_python = os.path.join(venv_dir, "bin", "python")
                venv_pip = os.path.join(venv_dir, "bin", "pip")

                if not os.path.exists(venv_python):
                    await cls.run_command_logged(
                        [sys.executable, "-m", "venv", ".venv"], cwd=backend_dir, log_file_path=log_path
                    )

                req_file = os.path.join(backend_dir, "requirements.txt")
                if os.path.exists(req_file):
                    await cls.run_command_logged(
                        [venv_pip, "install", "-r", "requirements.txt"], cwd=backend_dir, log_file_path=log_path
                    )

                # Launch backend
                backend_port = find_free_port(start_port=8001)
                RUNNING_PROCESSES[project_id]["backend_port"] = backend_port

                # Detect entry point
                launch_cmd = None
                if os.path.exists(os.path.join(backend_dir, "main.py")):
                    # Check if FastAPI
                    with open(os.path.join(backend_dir, "main.py"), "r", encoding="utf-8") as mf:
                        content = mf.read()
                    if "FastAPI" in content:
                        launch_cmd = [os.path.join(venv_dir, "bin", "uvicorn"), "main:app", "--port", str(backend_port), "--host", "127.0.0.1"]
                    else:
                        launch_cmd = [venv_python, "main.py"]
                elif os.path.exists(os.path.join(backend_dir, "app.py")):
                    launch_cmd = [venv_python, "app.py"]
                elif os.path.exists(os.path.join(backend_dir, "manage.py")):
                    launch_cmd = [venv_python, "manage.py", "runserver", f"127.0.0.1:{backend_port}"]

                if launch_cmd:
                    with open(log_path, "a", encoding="utf-8") as f:
                        f.write(f"\n[Launching Backend on port {backend_port}]: {' '.join(launch_cmd)}\n")
                    b_proc = subprocess.Popen(
                        launch_cmd,
                        cwd=backend_dir,
                        stdout=open(log_path, "a"),
                        stderr=subprocess.STDOUT,
                        preexec_fn=os.setsid,
                    )
                    RUNNING_PROCESSES[project_id]["backend_proc"] = b_proc

            # 4. Setup Node Frontend if package.json exists
            has_node = os.path.exists(os.path.join(frontend_dir, "package.json"))
            frontend_port = None
            if has_node:
                RUNNING_PROCESSES[project_id]["status"] = "installing_frontend"
                await cls.run_command_logged(["npm", "install"], cwd=frontend_dir, log_file_path=log_path)

                frontend_port = find_free_port(start_port=3001)
                RUNNING_PROCESSES[project_id]["frontend_port"] = frontend_port

                # Read scripts from package.json
                f_cmd = ["npm", "run", "dev", "--", "--port", str(frontend_port)]
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(f"\n[Launching Frontend on port {frontend_port}]: {' '.join(f_cmd)}\n")

                f_proc = subprocess.Popen(
                    f_cmd,
                    cwd=frontend_dir,
                    stdout=open(log_path, "a"),
                    stderr=subprocess.STDOUT,
                    preexec_fn=os.setsid,
                )
                RUNNING_PROCESSES[project_id]["frontend_proc"] = f_proc

            RUNNING_PROCESSES[project_id]["status"] = "running"
            with open(log_path, "a", encoding="utf-8") as f:
                f.write("\n=== Application successfully running on localhost! ===\n")
                if frontend_port:
                    f.write(f"Frontend URL: http://localhost:{frontend_port}\n")
                if backend_port:
                    f.write(f"Backend URL: http://localhost:{backend_port}\n")

        except Exception as e:
            logger.error(f"Error launching project {project_id}: {e}", exc_info=True)
            RUNNING_PROCESSES[project_id]["status"] = "failed"
            RUNNING_PROCESSES[project_id]["error"] = str(e)
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(f"\nExecution error: {e}\n")

    @classmethod
    def get_status(cls, project_id: str) -> Dict[str, Any]:
        info = RUNNING_PROCESSES.get(project_id)
        if not info:
            return {"status": "idle", "message": "Project is not running"}

        # Read last 50 lines of logs
        log_snippet = ""
        log_path = info.get("log_path")
        if log_path and os.path.exists(log_path):
            try:
                with open(log_path, "r", encoding="utf-8", errors="replace") as f:
                    lines = f.readlines()
                    log_snippet = "".join(lines[-80:])
            except Exception:
                pass

        return {
            "status": info.get("status", "unknown"),
            "target_dir": info.get("target_dir"),
            "backend_port": info.get("backend_port"),
            "frontend_port": info.get("frontend_port"),
            "frontend_url": f"http://localhost:{info.get('frontend_port')}" if info.get("frontend_port") else None,
            "backend_url": f"http://localhost:{info.get('backend_port')}" if info.get("backend_port") else None,
            "started_at": info.get("started_at"),
            "error": info.get("error"),
            "logs": log_snippet,
        }

    @classmethod
    def stop_project(cls, project_id: str) -> Dict[str, Any]:
        info = RUNNING_PROCESSES.get(project_id)
        if not info:
            return {"status": "idle", "message": "Project was not running"}

        # Terminate processes
        for key in ["backend_proc", "frontend_proc"]:
            proc = info.get(key)
            if proc:
                try:
                    os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                except Exception as e:
                    logger.info(f"Process termination note: {e}")

        info["status"] = "stopped"
        log_path = info.get("log_path")
        if log_path and os.path.exists(log_path):
            with open(log_path, "a", encoding="utf-8") as f:
                f.write("\n=== Stopped by user ===\n")

        return {"status": "stopped", "message": "All project processes terminated."}
