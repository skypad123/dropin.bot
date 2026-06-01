import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from ..db import get_db
from ..gateway.session import SessionManager
from ..gateway.protocol import EventType


class AgentOrchestrator:
    def __init__(self, session_manager: Optional[SessionManager] = None):
        self.session_manager: Optional[SessionManager] = session_manager
        self._running_tasks: dict[str, asyncio.Task] = {}

    async def start_agent(self, instance_id: str) -> str:
        run_id = str(uuid.uuid4())

        if instance_id in self._running_tasks:
            task = self._running_tasks[instance_id]
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass

        self._update_instance_status(instance_id, "running")

        task = asyncio.create_task(self._agent_loop(instance_id, run_id))
        self._running_tasks[instance_id] = task
        return run_id

    async def stop_agent(self, instance_id: str):
        task = self._running_tasks.pop(instance_id, None)
        if task:
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass
        self._update_instance_status(instance_id, "stopped")

    async def _agent_loop(self, instance_id: str, run_id: str):
        instance = self._get_instance(instance_id)
        if not instance:
            return

        welcome = f"Agent '{instance['name']}' started (model: {instance['model']})"
        await self.session_manager.broadcast_event(
            EventType.SESSION_MESSAGE,
            {
                "session_key": f"agent-{instance_id}",
                "run_id": run_id,
                "instance_id": instance_id,
                "role": "assistant",
                "content": welcome,
                "ts": datetime.now(timezone.utc).isoformat(),
            },
        )

        try:
            while True:
                await asyncio.sleep(0.1)

                message = await self._dequeue_message(instance_id)
                if message is None:
                    continue

                await self._process_turn(instance_id, run_id, message)

        except asyncio.CancelledError:
            self._update_instance_status(instance_id, "stopped")
            await self.session_manager.broadcast_event(
                EventType.SESSION_MESSAGE,
                {
                    "session_key": f"agent-{instance_id}",
                    "run_id": run_id,
                    "instance_id": instance_id,
                    "role": "system",
                    "content": f"Agent '{instance['name']}' stopped.",
                    "ts": datetime.now(timezone.utc).isoformat(),
                },
            )
            raise

    async def _process_turn(self, instance_id: str, run_id: str, message: dict):
        instance = self._get_instance(instance_id)
        if not instance:
            return

        content = message.get("content", "")

        response = self._mock_llm_call(instance, content)

        if response.get("tool_calls"):
            for tool_call in response["tool_calls"]:
                tool_name = tool_call.get("name", "unknown")
                tool_args = tool_call.get("args", {})

                await self.session_manager.broadcast_event(
                    EventType.SESSION_TOOL,
                    {
                        "session_key": f"agent-{instance_id}",
                        "run_id": run_id,
                        "instance_id": instance_id,
                        "tool": tool_name,
                        "args": tool_args,
                        "ts": datetime.now(timezone.utc).isoformat(),
                    },
                )

                tool_result = await self._mock_tool_execution(tool_name, tool_args)

                await self.session_manager.broadcast_event(
                    EventType.SESSION_TOOL,
                    {
                        "session_key": f"agent-{instance_id}",
                        "run_id": run_id,
                        "instance_id": instance_id,
                        "tool": tool_name,
                        "result": tool_result,
                        "ts": datetime.now(timezone.utc).isoformat(),
                    },
                )

        final_content = response.get("content", f"[mock response to: {content[:100]}]")
        await self.session_manager.broadcast_event(
            EventType.SESSION_MESSAGE,
            {
                "session_key": f"agent-{instance_id}",
                "run_id": run_id,
                "instance_id": instance_id,
                "role": "assistant",
                "content": final_content,
                "ts": datetime.now(timezone.utc).isoformat(),
            },
        )

    def _mock_llm_call(self, instance: dict, user_message: str) -> dict:
        name = instance.get("name", "agent")
        model = instance.get("model", "unknown")

        if "run" in user_message.lower() and "shell" in user_message.lower():
            return {
                "content": f"[{name}] Let me run that command for you.",
                "tool_calls": [
                    {"name": "run_shell", "args": {"command": "echo 'Hello from sandbox'"}}
                ],
            }
        elif "read" in user_message.lower() and "file" in user_message.lower():
            return {
                "content": f"[{name}] Let me read that file.",
                "tool_calls": [
                    {"name": "read_file", "args": {"path": "/workspace/files/README.md"}}
                ],
            }
        else:
            return {
                "content": f"[{name} | {model}] Received: {user_message}",
                "tool_calls": [],
            }

    async def _mock_tool_execution(self, tool_name: str, args: dict) -> str:
        if tool_name == "run_shell":
            return "$ echo 'Hello from sandbox'\nHello from sandbox"
        elif tool_name == "read_file":
            return f"[file content at {args.get('path', 'unknown')}]"
        elif tool_name == "write_file":
            return f"Written to {args.get('path', 'unknown')}"
        elif tool_name == "glob":
            return "[]"
        else:
            return f"Tool '{tool_name}' executed with args: {args}"

    async def _dequeue_message(self, instance_id: str) -> Optional[dict]:
        await asyncio.sleep(0.1)
        return None

    def enqueue_message(self, instance_id: str, message: dict):
        pass

    def _get_instance(self, instance_id: str) -> Optional[dict]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM instances WHERE id = ?", (instance_id,)).fetchone()
            if row:
                return dict(row)
        return None

    def _update_instance_status(self, instance_id: str, status: str):
        with get_db() as conn:
            conn.execute(
                "UPDATE instances SET status = ?, last_active_at = ? WHERE id = ?",
                (status, datetime.now(timezone.utc).isoformat(), instance_id),
            )
            conn.commit()

    def is_running(self, instance_id: str) -> bool:
        return instance_id in self._running_tasks


orchestrator = AgentOrchestrator(None)


def set_orchestrator_session_manager(sm: SessionManager):
    orchestrator.session_manager = sm
