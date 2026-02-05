from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"  # Model to use for AI agents
    openai_embedding_model: str = "text-embedding-3-small"  # Model for embeddings

    # Database
    database_url: str = "sqlite+aiosqlite:///./backend/simvex.db"
    db_pool_size: int = 5  # PostgreSQL connection pool size
    db_max_overflow: int = 10  # Max connections above pool_size

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # App
    debug: bool = True

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_postgres(self) -> bool:
        """Check if using PostgreSQL database."""
        return self.database_url.startswith("postgresql")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
