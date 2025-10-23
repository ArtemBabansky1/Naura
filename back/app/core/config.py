from typing import Optional, List
from pydantic import Field, validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Application
    APP_ENV: str = Field(default="development")
    APP_SECRET_KEY: str = Field(...)
    API_VERSION: str = Field(default="v1")
    DEBUG: bool = Field(default=False)
    
    # Server
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8002)
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(default=["http://localhost:5173", "http://localhost:3000"])
    
    # Database
    DATABASE_URL: str = Field(...)
    DATABASE_POOL_SIZE: int = Field(default=10)
    
    # Redis
    REDIS_URL: str = Field(...)
    REDIS_CACHE_TTL: int = Field(default=300)
    
    # JWT
    JWT_SECRET_KEY: str = Field(...)
    JWT_ALGORITHM: str = Field(default="HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30)
    
    # OAuth - Google
    GOOGLE_CLIENT_ID: Optional[str] = Field(default=None)
    GOOGLE_CLIENT_SECRET: Optional[str] = Field(default=None)
    GOOGLE_REDIRECT_URI: Optional[str] = Field(default=None)
    
    # OAuth - LinkedIn
    LINKEDIN_CLIENT_ID: Optional[str] = Field(default=None)
    LINKEDIN_CLIENT_SECRET: Optional[str] = Field(default=None)
    LINKEDIN_REDIRECT_URI: Optional[str] = Field(default=None)
    
    # OAuth - Facebook
    FACEBOOK_APP_ID: Optional[str] = Field(default=None)
    FACEBOOK_APP_SECRET: Optional[str] = Field(default=None)
    FACEBOOK_REDIRECT_URI: Optional[str] = Field(default=None)
    
    # OAuth - VK
    VK_APP_ID: Optional[str] = Field(default=None)
    VK_APP_SECRET: Optional[str] = Field(default=None)
    VK_REDIRECT_URI: Optional[str] = Field(default=None)
    
    # Email
    SMTP_HOST: Optional[str] = Field(default=None)
    SMTP_PORT: int = Field(default=587)
    SMTP_USER: Optional[str] = Field(default=None)
    SMTP_PASSWORD: Optional[str] = Field(default=None)
    FROM_EMAIL: Optional[str] = Field(default=None)
    
    # File Storage
    # AWS_ACCESS_KEY_ID: Optional[str] = Field(default=None)
    # AWS_SECRET_ACCESS_KEY: Optional[str] = Field(default=None)
    # AWS_S3_BUCKET: Optional[str] = Field(default=None)
    # AWS_REGION: str = Field(default="us-east-1")
    
    # Celery
    CELERY_BROKER_URL: str = Field(...)
    CELERY_RESULT_BACKEND: str = Field(...)
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


settings = Settings()