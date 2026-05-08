from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Grasim Intern Onboarding"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/intern_onboarding"

    # JWT
    SECRET_KEY: str = "change-this-to-a-very-secure-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # Portal token expiry (days)
    PORTAL_TOKEN_EXPIRE_DAYS: int = 30

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "hr@grasim.com"
    MAIL_FROM_NAME: str = "Grasim HR - MBDD"
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False

    # File storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # Frontend URL (for email links)
    FRONTEND_URL: str = "http://localhost:5173"

    # Company details (used in PDF generation)
    COMPANY_NAME: str = "Grasim Industries Ltd."
    COMPANY_DIVISION: str = "MBDD"
    HR_HEAD_NAME: str = "Sheba Banerjee"
    HR_HEAD_TITLE: str = "Head - Human Resources"
    COMPANY_ADDRESS: str = "Aditya Birla Centre, 'A' wing, 2nd Floor, S.K. Ahire Marg, Worli, Mumbai 400 030, India"
    COMPANY_EMAIL: str = "grasimcfd@adityabirla.com"
    COMPANY_WEBSITE: str = "www.grasim.com"
    COMPANY_CIN: str = "L17124MP1947PLC000410"

    # Stipend
    DEFAULT_STIPEND_AMOUNT: float = 7000.0
    STIPEND_PAYMENT_DAY: int = 23  # 23rd of every month

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
