from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
import os
from dotenv import load_dotenv

load_dotenv()

# Import all models so Alembic can detect them
from app.database import Base
from app.models.person import Person
from app.models.project import Project
from app.models.decision import Decision
from app.models.task import Task
from app.models.process import Process
from app.models.event import Event
from app.models.document import Document
from app.models.workflow import Workflow
from app.models.relationship import Relationship
from app.models.source import Source
from app.models.extraction import Extraction

# Alembic Config object
config = context.config

# Set up logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = os.getenv("DATABASE_URL_SYNC", config.get_main_option("sqlalchemy.url"))
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section, {})
    if os.getenv("DATABASE_URL_SYNC"):
        configuration["sqlalchemy.url"] = os.getenv("DATABASE_URL_SYNC")
        
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
