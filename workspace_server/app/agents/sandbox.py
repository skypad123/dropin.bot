import asyncio
from pathlib import Path
from typing import Optional


class SandboxError(Exception):
    pass


class ShellResult:
    def __init__(self, stdout: str, stderr: str, exit_code: int):
        self.stdout = stdout
        self.stderr = stderr
        self.exit_code = exit_code


class Sandbox:
    def __init__(self, root: Path = Path("/workspace")):
        self.root = root.resolve()

    def resolve(self, path: str) -> Path:
        full = (self.root / path).resolve()
        if not str(full).startswith(str(self.root)):
            raise SandboxError(f"Path escape: {path}")
        return full

    async def run_shell(self, command: str, timeout: int = 30) -> ShellResult:
        proc = await asyncio.create_subprocess_shell(
            command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=str(self.root),
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout)
        except asyncio.TimeoutError:
            proc.kill()
            raise SandboxError(f"Timeout after {timeout}s")
        return ShellResult(
            stdout.decode() if stdout else "",
            stderr.decode() if stderr else "",
            proc.returncode or 0,
        )

    async def read_file(self, path: str) -> str:
        return self.resolve(path).read_text()

    async def write_file(self, path: str, content: str):
        target = self.resolve(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content)

    async def glob(self, pattern: str) -> list[str]:
        return [str(p.relative_to(self.root)) for p in self.root.glob(pattern)]

    async def install(self, package: str, manager: str = "pip") -> ShellResult:
        if manager == "pip":
            cmd = f"pip install {package}"
        elif manager == "npm":
            cmd = f"npm install {package}"
        else:
            raise SandboxError(f"Unknown package manager: {manager}")
        return await self.run_shell(cmd, timeout=120)


_default_sandbox: Optional[Sandbox] = None


def get_sandbox() -> Sandbox:
    global _default_sandbox
    if _default_sandbox is None:
        from ..config import settings
        _default_sandbox = Sandbox(root=Path(settings.files_path))
    return _default_sandbox
