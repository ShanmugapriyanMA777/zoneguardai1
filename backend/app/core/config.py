import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "ZoneGuard AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "zoneguard-ai-sih-secret-key-super-secure-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Environment modes
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "t")
    REAL_DATA_MODE: bool = os.getenv("REAL_DATA_MODE", "false").lower() in ("true", "1", "t")
    
    # Database URL (defaults to SQLite, supports PostGIS via DATABASE_URL)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Copernicus Data Space Ecosystem (CDSE) Settings
    CDSE_API_URL: str = os.getenv("CDSE_API_URL", "https://catalogue.dataspace.copernicus.eu/odata/v1")
    CDSE_TOKEN_URL: str = os.getenv("CDSE_TOKEN_URL", "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token")
    CDSE_USERNAME: str = os.getenv("CDSE_USERNAME", "mashanmugapriyan777@gmail.com")
    CDSE_PASSWORD: str = os.getenv("CDSE_PASSWORD", "Priyan@7771111")
    CDSE_CLIENT_ID: str = os.getenv("CDSE_CLIENT_ID", "cdse-public")
    
    # Default District Focus (Tamil Nadu Nilgiris & Western Ghats Hazard Corridor)
    DEFAULT_DISTRICT: str = "Nilgiris-Western Ghats Hazard Corridor (Tamil Nadu)"
    DISTRICT_CENTER_LAT: float = 11.3530
    DISTRICT_CENTER_LNG: float = 76.7950

    def __init__(self, **values):
        super().__init__(**values)
        
        # 1. Normalize postgres:// to postgresql:// for SQLAlchemy 2.0 compatibility (e.g. Render, Railway, Supabase)
        if self.DATABASE_URL and self.DATABASE_URL.startswith("postgres://"):
            self.DATABASE_URL = self.DATABASE_URL.replace("postgres://", "postgresql://", 1)

        # 2. Robust SQLite resolution across Docker, Cloud, and local environments
        if not self.DATABASE_URL or self.DATABASE_URL == "sqlite:///./zoneguard.db" or self.DATABASE_URL.startswith("sqlite:///./"):
            backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
            candidates = [
                os.path.join(backend_dir, "zoneguard.db"),
                os.path.join(root_dir, "zoneguard.db"),
                os.path.join(os.getcwd(), "zoneguard.db"),
                os.path.join(backend_dir, "data", "zoneguard.db"),
            ]
            chosen_db = None
            for cand in candidates:
                if os.path.isfile(cand):
                    chosen_db = cand
                    break
            if not chosen_db:
                chosen_db = os.path.join(backend_dir, "zoneguard.db")
            
            chosen_db = os.path.abspath(chosen_db).replace("\\", "/")
            self.DATABASE_URL = f"sqlite:///{chosen_db}"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
