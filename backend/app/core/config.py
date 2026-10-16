import os
from typing import Any, Dict, List

class Settings:
    PROJECT_NAME: str = "JomiTrace"
    PROJECT_DESCRIPTION: str = "Explainable land-record verification and risk screening"
    VERSION: str = "0.1.0"
    RULE_VERSION: str = "0.2"
    API_PREFIX: str = "/api"
    
    API_HOST: str = os.getenv("API_HOST", "127.0.0.1")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    
    # Database configuration (SQLite default for zero-setup local evaluation)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./jomitrace.db")
    
    # CORS configuration
    CORS_ORIGINS_RAW: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
    
    # Default rule engine and tolerance configuration
    DEFAULT_CASE_CONFIG: Dict[str, Any] = {
        "area_tolerance_pct": 1.0,
        "rapid_transfer_days": 30,
        "mutation_reference_days": 45,
        "katha_sqft": None,
        "bigha_sqft": None,
    }
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

settings = Settings()
