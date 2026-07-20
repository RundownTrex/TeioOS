from fastapi import FastAPI 

from app.core.config import settings

from app.api.router import apirouter

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version
)


app.include_router(apirouter)