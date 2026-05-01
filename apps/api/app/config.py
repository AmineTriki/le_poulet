from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/lepoulet"
    database_pool_min: int = 5
    database_pool_max: int = 20
    redis_url: str = "redis://localhost:6379"
    secret_key: str = "dev-secret-key-change-in-production"
    jwt_expire_hours: int = 24
    allowed_origins: str = "http://localhost:3000,http://localhost:8081"
    max_players_per_game: int = 200
    game_code_length: int = 6
    location_rate_limit_seconds: int = 4
    overpass_api_url: str = "https://overpass-api.de/api/interpreter"
    nominatim_url: str = "https://nominatim.openstreetmap.org"
    sentry_dsn: str = ""
    anthropic_api_key: str = ""
    expo_access_token: str = ""
    amazon_affiliate_tag: str = "lepoulet-20"
    debug: bool = False
    environment: str = "development"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
