from fastapi import APIRouter

from app.api.routes.root import router as root_router
from app.api.routes.health import router as health_router


apirouter = APIRouter(prefix="/api/v1")

apirouter.include_router(root_router)
apirouter.include_router(health_router)