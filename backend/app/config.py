import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str
    supabase_anon_key: str
    supabase_jwt_secret: str
    
    azure_vision_endpoint: str
    azure_vision_key: str

    class Config:
        env_file = ".env"

settings = Settings()