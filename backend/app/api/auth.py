from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, require_hr, verify_password, hash_password
from app.models.models import HRUser
from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate, UserOut
from slowapi import Limiter
from slowapi.util import get_remote_address
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

# Rate limiter — 5 login attempts per minute per IP
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(HRUser).filter(HRUser.email == payload.email).first()

    # Use verify_password which supports both bcrypt and legacy plain text
    if not user or not verify_password(payload.password, user.password_hash):
        logger.warning(f"Failed login attempt for email: {payload.email} from IP: {request.client.host}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    # Auto-upgrade plain text password to bcrypt on successful login
    try:
        from passlib.context import CryptContext
        ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
        ctx.verify(payload.password, user.password_hash)
        # If we get here, already bcrypt — no upgrade needed
    except Exception:
        # Plain text detected — upgrade to bcrypt silently
        user.password_hash = hash_password(payload.password)
        db.commit()
        logger.info(f"Password upgraded to bcrypt for user: {user.email}")

    token = create_access_token({
        "sub": str(user.id),
        "type": "access",
        "role": user.role
    })

    logger.info(f"Successful login: {user.email} ({user.role})")

    return TokenResponse(
        access_token=token,
        role=user.role,
        name=user.name,
        user_id=str(user.id),
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: HRUser = Depends(get_current_user)):
    return current_user


@router.post("/users", response_model=UserOut, dependencies=[Depends(require_hr)])
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(HRUser).filter(HRUser.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = HRUser(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),  # Always bcrypt for new users
        role=payload.role,
        department=payload.department,
        location=payload.location,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_hr)])
def list_users(db: Session = Depends(get_db)):
    return db.query(HRUser).filter(HRUser.is_active == True).all()