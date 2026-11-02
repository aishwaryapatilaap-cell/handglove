import secrets, warnings
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    secret_key: str = ""
    access_token_minutes: int = 60
    cookie_secure: bool = False          # set True when served over https
    database_url: str = "sqlite:///./neurokinetics.db"


settings = Settings()
if not settings.secret_key:
    settings.secret_key = secrets.token_urlsafe(48)
    warnings.warn("SECRET_KEY is not set in .env: using a temporary key. Everyone is logged out on restart.")
