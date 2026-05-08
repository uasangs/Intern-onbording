import os
import uuid
import aiofiles
from fastapi import UploadFile, HTTPException
from app.core.config import settings

# Documents must be PDF only
PDF_ONLY = {"application/pdf"}

# Other uploads (certificates, offer letters HR uploads) allow PDF only too
ALLOWED_TYPES = {"application/pdf"}


async def save_upload(file: UploadFile, folder: str = "uploads") -> str:
    # Enforce PDF only for all uploads
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Only PDF files are accepted. You uploaded: {file.content_type}"
        )

    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File size {size_mb:.1f}MB exceeds the {settings.MAX_FILE_SIZE_MB}MB limit"
        )

    filename = f"{uuid.uuid4()}.pdf"
    out_dir = os.path.join(settings.UPLOAD_DIR, folder)
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, filename)

    async with aiofiles.open(out_path, "wb") as f:
        await f.write(content)

    return f"/uploads/{folder}/{filename}"