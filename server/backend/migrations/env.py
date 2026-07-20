from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# ---------------------------------------------------------------------------
# Alembic Config object — provides access to values within alembic.ini.
# ---------------------------------------------------------------------------
config = context.config

# Set up Python logging from alembic.ini.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Inject the database URL from application settings so it is never hardcoded
# in alembic.ini or version-controlled files.
# ---------------------------------------------------------------------------
from app.core.config import settings  # noqa: E402

config.set_main_option("sqlalchemy.url", settings.database_url)

# ---------------------------------------------------------------------------
# Import all models so that Alembic's autogenerate can detect every table.
#
# The models package __init__.py re-exports every model class, which
# forces SQLAlchemy to register each table on Base.metadata.
# ---------------------------------------------------------------------------
import app.models  # noqa: E402, F401

from app.db.base import Base  # noqa: E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    Configures the context with just the URL rather than an Engine.
    Useful for generating SQL scripts without a live database connection.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        render_as_batch=False,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    Creates an Engine from config and associates a connection with the
    migration context so migrations are applied against a live database.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            render_as_batch=False,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
