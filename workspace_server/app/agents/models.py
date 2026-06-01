import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from sqlmodel import SQLModel, Field


class Instance(SQLModel, table=True):
    __tablename__ = "instances"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    model: str
    status: str = Field(default="stopped")
    temperature: float = Field(default=0.7)
    system_prompt: str = Field(default="")
    region: str = Field(default="us-east")
    environment: str = Field(default="production")
    memories_organiser: str = Field(default="file")
    plugins: str = Field(default="{}")
    skills: str = Field(default="[]")
    integrations: str = Field(default="[]")
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_active_at: Optional[str] = Field(default=None)
    usage: int = Field(default=0)


class InstanceCreate(SQLModel):
    name: str
    model: str
    temperature: float = 0.7
    system_prompt: str = ""
    region: str = "us-east"
    environment: str = "production"


class InstanceUpdate(SQLModel):
    name: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None
    region: Optional[str] = None
    environment: Optional[str] = None
    status: Optional[str] = None
