from fastapi import FastAPI 

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.router import apirouter
from app.api.exception_handlers import add_exception_handlers

# Initialize logging before creating the app
setup_logging()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)

# Register global exception handlers
add_exception_handlers(app)

app.include_router(apirouter)