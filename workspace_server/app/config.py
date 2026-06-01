import os
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    workspace_id: str = "dev-ws-1"
    workspace_name: str = "Dev Workspace"
    gateway_token: str = "dev-token-replace-me"
    hub_api_url: str = "http://localhost:8000"
    database_path: str = "./data/workspace.db"
    files_path: str = "./data/files"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    log_level: str = "info"

    model_config = {
        "env_prefix": "",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def db_path(self) -> Path:
        return Path(self.database_path)

    @property
    def files_dir(self) -> Path:
        return Path(self.files_path)


settings = Settings()
