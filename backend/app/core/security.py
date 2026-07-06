from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from passlib.context import CryptContext
import secrets
import string

bearer_scheme = HTTPBearer(auto_error=False)

# ── Password hashing (bcrypt) ────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    # Support both bcrypt hashed and legacy plain text passwords
    # Once user logs in with plain text, their password gets upgraded to bcrypt
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        # Legacy plain text fallback
        return plain == hashed


# ── JWT utilities ────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


# ── Portal token ─────────────────────────────────────────────────────────────

def generate_portal_token() -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(64))


def create_portal_token(intern_record_id: str, expiry_days: int = None) -> str:
    days = expiry_days if expiry_days is not None else settings.PORTAL_TOKEN_EXPIRE_DAYS
    expire = datetime.utcnow() + timedelta(days=days)
    data = {
        "sub": intern_record_id,
        "type": "portal",
        "exp": expire,
    }
    return jwt.encode(data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_portal_token(token: str) -> Optional[str]:
    payload = decode_token(token)
    if payload and payload.get("type") == "portal":
        return payload.get("sub")
    return None


# ── Role-based auth dependencies ─────────────────────────────────────────────

def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    from app.models.models import HRUser

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(HRUser).filter(HRUser.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user


def require_role(*roles: str):
    def checker(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(roles)}",
            )
        return current_user
    return checker


# Shorthand role dependencies
require_hr = require_role("hr")
require_accounts = require_role("accounts")
require_it = require_role("it")
require_manager = require_role("manager")
require_hr_or_manager = require_role("hr", "manager")
require_any = require_role("hr", "accounts", "it", "manager")

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    """Like get_current_user but returns None instead of raising 401 — for public endpoints."""
    from app.models.models import HRUser
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        return None
    user = db.query(HRUser).filter(HRUser.id == payload.get("sub")).first()
    if not user or not user.is_active:
        return None
    return user