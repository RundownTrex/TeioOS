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

    # Examination timing
    # Interval (seconds) between server-side sweeps that auto-submit sessions
    # whose individual timer (expires_at) has elapsed. Server time only.
    auto_submit_sweep_interval_seconds: int = 60
    # After this many seconds without server-authoritative activity, an active
    # session is paused automatically (covers browser close, network loss and
    # power failure when the client could not signal the pause itself).
    exam_inactivity_timeout_seconds: int = 60
    # Safety net: a session paused for longer than this many minutes is
    # auto-submitted so an abandoned exam still produces a result.
    exam_max_pause_minutes: int = 120
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