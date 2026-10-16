from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    rule_version: str
    timestamp: str

@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return health status and API version metadata."""
    return HealthResponse(
        status="healthy",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        rule_version=settings.RULE_VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
