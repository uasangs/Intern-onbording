# # from fastapi import FastAPI, HTTPException
# # from fastapi.middleware.cors import CORSMiddleware
# # from fastapi.staticfiles import StaticFiles
# # from fastapi.responses import FileResponse
# # import os

# # from app.core.config import settings
# # from app.core.database import Base, engine
# # from app.api.auth import router as auth_router
# # from app.api.hr import router as hr_router
# # from app.api.candidate import router as candidate_router
# # from app.api.operations import accounts_router, it_router, manager_router

# # # Create all tables on startup
# # Base.metadata.create_all(bind=engine)

# # # Ensure upload directory exists
# # os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
# # for folder in ["documents", "offer_letters", "certificates"]:
# #     os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)

# # app = FastAPI(
# #     title=settings.APP_NAME,
# #     version=settings.APP_VERSION,
# #     description="Intern Onboarding System — Grasim Industries Ltd. (MBDD / TRADC)",
# # )

# # # CORS — allow React dev server
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=[
# #         "http://localhost:5173",
# #         "http://localhost:3000",
# #         settings.FRONTEND_URL,
# #     ],
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# # # ── File serving endpoint with iframe-friendly headers ────────────────────────
# # # This replaces static file mounting — serves PDFs inline in browser iframes
# # @app.get("/uploads/{folder}/{filename}")
# # def serve_upload(folder: str, filename: str):
# #     """Serve uploaded files with appropriate headers."""
# #     # Security: only allow safe folder names
# #     if folder not in ("documents", "offer_letters", "certificates"):
# #         raise HTTPException(status_code=404, detail="Not found")

# #     # Security: no path traversal
# #     if ".." in filename or "/" in filename or "\\" in filename:
# #         raise HTTPException(status_code=400, detail="Invalid filename")

# #     path = os.path.join(settings.UPLOAD_DIR, folder, filename)
# #     if not os.path.exists(path):
# #         raise HTTPException(status_code=404, detail="File not found")

# #     # Detect media type
# #     if filename.endswith(".docx"):
# #         media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
# #         disposition = "attachment"  # docx must be downloaded, can't be rendered inline
# #     elif filename.endswith(".pdf"):
# #         media_type = "application/pdf"
# #         disposition = "inline"
# #     else:
# #         media_type = "application/octet-stream"
# #         disposition = "attachment"

# #     response = FileResponse(path, media_type=media_type, filename=filename)
# #     response.headers["Content-Disposition"] = disposition + '; filename="' + filename + '"'
# #     response.headers["Cache-Control"] = "no-cache, no-store"
# #     return response

# # # All routers
# # app.include_router(auth_router, prefix="/api")
# # app.include_router(hr_router, prefix="/api")
# # app.include_router(candidate_router, prefix="/api")
# # app.include_router(accounts_router, prefix="/api")
# # app.include_router(it_router, prefix="/api")
# # app.include_router(manager_router, prefix="/api")


# # @app.get("/")
# # def root():
# #     return {
# #         "app": settings.APP_NAME,
# #         "version": settings.APP_VERSION,
# #         "status": "running",
# #         "docs": "/docs",
# #     }


# # @app.get("/health")
# # def health():
# #     return {"status": "ok"}




# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# import os

# from app.core.config import settings
# from app.core.database import Base, engine
# from app.api.auth import router as auth_router
# from app.api.hr import router as hr_router
# from app.api.candidate import router as candidate_router
# from app.api.operations import accounts_router, it_router, manager_router

# # Create all tables on startup
# Base.metadata.create_all(bind=engine)

# # Ensure upload directory exists
# os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
# for folder in ["documents", "offer_letters", "certificates"]:
#     os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)

# app = FastAPI(
#     title=settings.APP_NAME,
#     version=settings.APP_VERSION,
#     description="Intern Onboarding System — Grasim Industries Ltd. (MBDD / TRADC)",
# )

# # CORS — allow React dev server
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://localhost:3000",
#         settings.FRONTEND_URL,
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── File serving endpoint with iframe-friendly headers ────────────────────────
# # This replaces static file mounting — serves PDFs inline in browser iframes
# @app.get("/uploads/{folder}/{filename}")
# def serve_upload(folder: str, filename: str):
#     """Serve uploaded files with appropriate headers."""
#     # Security: only allow safe folder names
#     if folder not in ("documents", "offer_letters", "certificates"):
#         raise HTTPException(status_code=404, detail="Not found")

#     # Security: no path traversal
#     if ".." in filename or "/" in filename or "\\" in filename:
#         raise HTTPException(status_code=400, detail="Invalid filename")

#     path = os.path.join(settings.UPLOAD_DIR, folder, filename)
#     if not os.path.exists(path):
#         raise HTTPException(status_code=404, detail="File not found")

#     # Detect media type — only PDFs are generated now
#     if filename.endswith(".pdf"):
#         media_type = "application/pdf"
#         disposition = "inline"
#     else:
#         media_type = "application/octet-stream"
#         disposition = "attachment"

#     response = FileResponse(path, media_type=media_type, filename=filename)
#     response.headers["Content-Disposition"] = disposition + '; filename="' + filename + '"'
#     response.headers["Cache-Control"] = "no-cache, no-store"
#     return response

# # All routers
# app.include_router(auth_router, prefix="/api")
# app.include_router(hr_router, prefix="/api")
# app.include_router(candidate_router, prefix="/api")
# app.include_router(accounts_router, prefix="/api")
# app.include_router(it_router, prefix="/api")
# app.include_router(manager_router, prefix="/api")


# @app.get("/")
# def root():
#     return {
#         "app": settings.APP_NAME,
#         "version": settings.APP_VERSION,
#         "status": "running",
#         "docs": "/docs",
#     }


# @app.get("/health")
# def health():
#     return {"status": "ok"}








# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# import os

# from app.core.config import settings
# from app.core.database import Base, engine
# from app.api.auth import router as auth_router
# from app.api.hr import router as hr_router
# from app.api.candidate import router as candidate_router
# from app.api.operations import accounts_router, it_router, manager_router

# # Create all tables on startup
# Base.metadata.create_all(bind=engine)

# # Ensure upload directory exists
# os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
# for folder in ["documents", "offer_letters", "certificates"]:
#     os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)

# app = FastAPI(
#     title=settings.APP_NAME,
#     version=settings.APP_VERSION,
#     description="Intern Onboarding System — Grasim Industries Ltd. (MBDD / TRADC)",
# )

# # CORS — allow React dev server
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://localhost:3000",
#         settings.FRONTEND_URL,
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # ── File serving endpoint with iframe-friendly headers ────────────────────────
# # This replaces static file mounting — serves PDFs inline in browser iframes
# @app.get("/uploads/{folder}/{filename}")
# def serve_upload(folder: str, filename: str):
#     """Serve uploaded files with appropriate headers."""
#     # Security: only allow safe folder names
#     if folder not in ("documents", "offer_letters", "certificates"):
#         raise HTTPException(status_code=404, detail="Not found")

#     # Security: no path traversal
#     if ".." in filename or "/" in filename or "\\" in filename:
#         raise HTTPException(status_code=400, detail="Invalid filename")

#     path = os.path.join(settings.UPLOAD_DIR, folder, filename)
#     if not os.path.exists(path):
#         raise HTTPException(status_code=404, detail="File not found")

#     # Detect media type
#     if filename.endswith(".docx"):
#         media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
#         disposition = "attachment"  # docx must be downloaded, can't be rendered inline
#     elif filename.endswith(".pdf"):
#         media_type = "application/pdf"
#         disposition = "inline"
#     else:
#         media_type = "application/octet-stream"
#         disposition = "attachment"

#     response = FileResponse(path, media_type=media_type, filename=filename)
#     response.headers["Content-Disposition"] = disposition + '; filename="' + filename + '"'
#     response.headers["Cache-Control"] = "no-cache, no-store"
#     return response

# # All routers
# app.include_router(auth_router, prefix="/api")
# app.include_router(hr_router, prefix="/api")
# app.include_router(candidate_router, prefix="/api")
# app.include_router(accounts_router, prefix="/api")
# app.include_router(it_router, prefix="/api")
# app.include_router(manager_router, prefix="/api")


# @app.get("/")
# def root():
#     return {
#         "app": settings.APP_NAME,
#         "version": settings.APP_VERSION,
#         "status": "running",
#         "docs": "/docs",
#     }


# @app.get("/health")
# def health():
#     return {"status": "ok"}




from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

from app.core.config import settings
from app.core.database import Base, engine
from app.api.auth import router as auth_router
from app.api.hr import router as hr_router
from app.api.candidate import router as candidate_router
from app.api.operations import accounts_router, it_router, manager_router

# Create all tables on startup
Base.metadata.create_all(bind=engine)

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
for folder in ["documents", "offer_letters", "certificates"]:
    os.makedirs(os.path.join(settings.UPLOAD_DIR, folder), exist_ok=True)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Intern Onboarding System — Grasim Industries Ltd. (MBDD / TRADC)",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── File serving endpoint with iframe-friendly headers ────────────────────────
# This replaces static file mounting — serves PDFs inline in browser iframes
@app.get("/uploads/{folder}/{filename}")
def serve_upload(folder: str, filename: str):
    """Serve uploaded files with appropriate headers."""
    # Security: only allow safe folder names
    if folder not in ("documents", "offer_letters", "certificates"):
        raise HTTPException(status_code=404, detail="Not found")

    # Security: no path traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    path = os.path.join(settings.UPLOAD_DIR, folder, filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    # Detect media type and set inline disposition so browser renders the file
    if filename.endswith(".pdf"):
        media_type = "application/pdf"
        disposition = "inline"
    elif filename.endswith(".docx"):
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disposition = "inline"
    else:
        media_type = "application/octet-stream"
        disposition = "attachment"

    response = FileResponse(path, media_type=media_type, filename=filename)
    response.headers["Content-Disposition"] = disposition + '; filename="' + filename + '"'
    response.headers["Cache-Control"] = "no-cache, no-store"
    return response

# All routers
app.include_router(auth_router, prefix="/api")
app.include_router(hr_router, prefix="/api")
app.include_router(candidate_router, prefix="/api")
app.include_router(accounts_router, prefix="/api")
app.include_router(it_router, prefix="/api")
app.include_router(manager_router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}