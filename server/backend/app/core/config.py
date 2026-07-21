from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Application
    app_name: str = "TeioOS Exam Server"
    app_version: str = "0.1.0"
    debug: bool = False

    # Database
    database_host: str = "localhost"
    database_port: int = 5432
    database_name: str = "teioos"
    database_user: str = "teioos_user"
    database_password: str = ""

    # Security
    secret_key: str = "default_unsafe_secret_key_change_in_production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 1 day default
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    @property
    def database_url(self) -> str:
        """Assemble a psycopg (v3) DSN for SQLAlchemy."""
        return (
            f"postgresql+psycopg://{self.database_user}:{self.database_password}"
            f"@{self.database_host}:{self.database_port}/{self.database_name}"
        )


settings = Settings()