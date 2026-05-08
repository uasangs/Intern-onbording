# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from app.core.database import get_db
# from app.core.security import (
#     verify_password, create_access_token, hash_password,
#     get_current_user, require_hr
# )
# from app.models.models import HRUser
# from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate, UserOut

# router = APIRouter(prefix="/auth", tags=["Auth"])


# @router.post("/login", response_model=TokenResponse)
# def login(payload: LoginRequest, db: Session = Depends(get_db)):
#     user = db.query(HRUser).filter(HRUser.email == payload.email).first()
#     if not user or not verify_password(payload.password, user.password_hash):
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Invalid email or password",
#         )
#     if not user.is_active:
#         raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

#     token = create_access_token({"sub": str(user.id), "type": "access", "role": user.role})
#     return TokenResponse(
#         access_token=token,
#         role=user.role,
#         name=user.name,
#         user_id=str(user.id),
#     )


# @router.get("/me", response_model=UserOut)
# def get_me(current_user: HRUser = Depends(get_current_user)):
#     return current_user


# @router.post("/users", response_model=UserOut, dependencies=[Depends(require_hr)])
# def create_user(payload: UserCreate, db: Session = Depends(get_db)):
#     existing = db.query(HRUser).filter(HRUser.email == payload.email).first()
#     if existing:
#         raise HTTPException(status_code=400, detail="Email already registered")

#     user = HRUser(
#         name=payload.name,
#         email=payload.email,
#         password_hash=hash_password(payload.password),
#         role=payload.role,
#         department=payload.department,
#         location=payload.location,
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)
#     return user


# @router.get("/users", response_model=list[UserOut], dependencies=[Depends(require_hr)])
# def list_users(db: Session = Depends(get_db)):
#     return db.query(HRUser).filter(HRUser.is_active == True).all()



from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, require_hr
from app.models.models import HRUser
from app.schemas.schemas import LoginRequest, TokenResponse, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(HRUser).filter(HRUser.email == payload.email).first()

    # Plain text password check - no encryption
    if not user or user.password_hash != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled"
        )

    token = create_access_token({
        "sub": str(user.id),
        "type": "access",
        "role": user.role
    })

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
        password_hash=payload.password,  # Store plain text
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