from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "Operational Memory"
    app_env: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/operational_memory"
    database_url_sync: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/operational_memory"

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
