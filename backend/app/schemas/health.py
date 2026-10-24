from datetime import datetime
from typing import Dict, Literal

from pydantic import BaseModel

ServiceState = Literal["connected", "unavailable", "disabled", "not_configured"]


class ComponentHealth(BaseModel):
    status: ServiceState
    details: str


class HealthCheckResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str


class SettingsHealthResponse(BaseModel):
    status: str
    timestamp: datetime
    services: Dict[str, ComponentHealth]
