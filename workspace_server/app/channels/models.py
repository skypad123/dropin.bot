import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import SQLModel, Field


class Channel(SQLModel, table=True):
    __tablename__ = "channels"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    agent_id: Optional[str] = Field(default=None)
    name: str
    type: str
    status: str = Field(default="disconnected")
    description: str = Field(default="")
    config: str = Field(default="{}")
    messages_count: int = Field(default=0)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class ChannelCreate(SQLModel):
    name: str
    type: str
    agent_id: Optional[str] = None
    description: str = ""
    config: str = "{}"


class ChannelUpdate(SQLModel):
    name: Optional[str] = None
    type: Optional[str] = None
    agent_id: Optional[str] = None
    description: Optional[str] = None
    config: Optional[str] = None
